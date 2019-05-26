
const CommonTestDependencies = require("../common").CommonTestDependencies;
const MonqadeResponseSearch = CommonTestDependencies.MonqadeResponseSearch;
const MonqadeError = CommonTestDependencies.MonqadeError; 


const chai = require("chai");
expect = chai.expect;

const limitOverride = {}; // 
const useDefaultProjection = undefined;  //function sets to default if undefined.

//mundane test outcome 
const rejectedPromise = (p,expectedErrorCode,done)=>{
    p.then(mqResponse=>{
        expect(mqResponse).to.be.null;
        done();

    }).catch(mqError=>{
        expect(mqError).to.not.be.null;
        if( mqError.constructor.name !== 'MonqadeError' ){
            throw(mqError);
        }

        expect(mqError).to.be.an.instanceof(MonqadeError);
        expect(mqError.code).to.eq(expectedErrorCode);  
        done();

    }).catch(otherError=>{
        done(otherError);

    })
}

//mundane test outcome 
const resolvedPromise = (p,expectedErrorCode,done)=>{
    p.then(mqSearchResponse=>{
        expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
        done();

    }).catch(mqError=>{
        if(mqError && mqError.constructor.name !== 'MonqadeError' ){
            throw(mqError);
        }
        expect(mqError).to.be.null;
        done(); 

    }).catch(otherError=>{
        done(otherError);

    })

}

const makeSearchCriteria = (testRecord,mqSchema)=>{
    const searchForPathID = mqSchema.getPathNamesSearchable().pop();
    return {pathID:searchForPathID,value:testRecord[searchForPathID]}
}


const mundaneTestCases = [
    //  this is schema specific  -- probably best to make 'mundane' tests normal tests
    // {   
    //     findObj: {'idxBucket':2},
    //     desc:'Should resolve to MonqadeResponseSearch (control test-case, does as expected) ',
    //     expectedTo:resolvedPromise,
    //     respCode:'MonqadeResponseSearch'
    // },

    {
        findObj: {},
        desc:`Empty search criteria should reject with 'EmptyFindCriteria'`,
        expectedTo:rejectedPromise,
        respCode:'EmptyFindCriteria'
    },
    {
        findObj: undefined,
        desc:`Undefined search criteria should reject with 'EmptyFindCriteria'`,
        expectedTo:rejectedPromise,
        respCode:'EmptyFindCriteria'
    }

];
before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;

})

    //mundane test-cases 
    mundaneTestCases.forEach(testCase=>{
        it(testCase.desc, function (done) {
            //const theMqSchema = common.theMqSchema;
            //const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'

            testCase.expectedTo(
                theMqSchema.doFindMany( testCase.findObj,
                                        useDefaultProjection,
                                        limitOverride),
                        testCase.respCode,
                        done
            );
        });
    });    

    it("Expect actual projection to be specified project plus system paths ", function (done) {
        // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
        // const testRecordSet = CommonTestDependencies.testRecordSet;

        const findObject = testRecordSet.pop();  // should be at least one of these

        const projection = theMqSchema.getPathNamesQuery({isSystem:false}).slice(0,1); // only need one path name

        theMqSchema.doFindMany(findObject,projection,limitOverride)
        .then(mqSearchResponse=>{  // is the projection what is expected.
            expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
            expect(mqSearchResponse.documents).to.be.an('array');

            const expectedProjection = projection.concat(theMqSchema.getPathNamesSystem());
            const actualProjection = Object.keys( mqSearchResponse.documents[0]);


            expect(expectedProjection).to.have.members(actualProjection );
            expect(actualProjection ).to.have.members(expectedProjection);
            // ^--- if we care about efficiencies. Could test membership a-> b and a.length=b.length
            done();
    
        }).catch(mqError=>{
            console.log(mqError);
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });

    it("Quietly disregard non-paths ", function (done) {
        // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
        // const testRecordSet = CommonTestDependencies.testRecordSet;

        const findObject =testRecordSet.pop(); 
        findObject['notRealPath'] = 'notRealValue'
        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
            expect(mqSearchResponse.appliedQuery).to.not.include({notRealPath:'notRealValue'})
            done();
    
        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });

    it.skip("Mongoose Validation Error test.  - debug see test documentation  ", function (done) {
        // to make a dynamic test (derived from schema) to fail validation (also dynimic)
        // is beyond scope of this project.. At this time simply catching 'validation' or other 
        // and passing them along. 
//        const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
//        const theMqSchema = common.theMqSchema;

        const findObject ={idxBucket:Date()}     
        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.null;
            done();
    
        }).catch(mqError=>{
            expect(mqError).to.not.be.null;
            if( ! MonqadeError.isThisOne(mqError)){
                throw(mqError);
            }
            expect(mqError).to.be.an.instanceof(MonqadeError);
            expect(mqError.code).to.eq('MongooseOtherError');  
 
        }).catch(otherError=>{
            done(otherError);

        });
    });

    it.skip("restrictive search findMany will quietly disregard paths marked isSearchable='false' ", function (done) {
        // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
        // const testRecordSet = CommonTestDependencies.testRecordSet;
  
        const testRecord =testRecordSet.pop();
        const searchCriteria =makeSearchCriteria(testRecordSet.pop(), theMqSchema);    

        const nonSearchPathID = theMqSchema.getPathNamesQuery({isSearchable:false}).pop()
        const nonSearchable = {};
        nonSearchable[nonSearchPathID] =testRecord[nonSearchPathID];

        const searchable = {};
        searchable[searchCriteria.pathID] = searchCriteria.value;
        
        const findObject =Object.assign({},searchable,nonSearchable);



        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
            expect(mqSearchResponse.appliedQuery,' appliedQuery should NOT include.').to.not.include(nonSearchable)
            expect(mqSearchResponse.appliedQuery, ' appliedQuery should include.').to.include(searchable)
            done();
    
        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });
    it("non-restrictive search findMany will search paths marked isSearchable='false' ", function (done) {
        // this is opposed to being restrictive and disregarding findObjects with paths isSearchable false;
        // eg: ignore the rule (non-restrictive) or enforce the rule on the input parameter (restrictive).
        // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
        // const testRecordSet = CommonTestDependencies.testRecordSet;

        theMqSchema.useRestrictiveSearch=false;

        //------------------------------
        const testRecord =testRecordSet.pop();
        const searchCriteria =makeSearchCriteria(testRecordSet.pop(), theMqSchema);    

        const nonSearchPathID = theMqSchema.getPathNamesQuery({isSearchable:false}).pop()
        const nonSearchable = {};
        nonSearchable[nonSearchPathID] =testRecord[nonSearchPathID];

        const searchable = {};
        searchable[searchCriteria.pathID] = searchCriteria.value;
        
        const findObject =Object.assign({},searchable,nonSearchable);

        //-------------------------------

        //const findObject ={idxBucket:2,_schemaVersionKey:'anything'}     
        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);

            expect(mqSearchResponse.appliedQuery, 'non-restrictive appliedQuery should include non-searchables ').to.include(nonSearchable)
            expect(mqSearchResponse.appliedQuery,'appliedQuery ').to.include(searchable)
            done();
    
        }).catch(mqError=>{
            if( mqError.constructor.name !== 'MonqadeError' ){
                throw(mqError);
            }
    
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });
