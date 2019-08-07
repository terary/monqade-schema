"use strict";
/* cSpell:ignore monqade */

const chai = require("chai");
const expect = chai.expect;

const CommonTestDependencies = require("../common");
const MonqadeResponseSearch = CommonTestDependencies.MonqadeResponseSearch;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;


const limitOverride = {}; // 
const useDefaultProjection = undefined;  //function sets to default if undefined.



const makeSearchCriteria = (testRecord,mqSchema)=>{
    const searchForPathID = mqSchema.getPathNamesSearchable().pop();
    return {pathID:searchForPathID,value:testRecord[searchForPathID]}
}


describe('.doFindMany(findCriteria, projection, options) ', ( )=>{ 
    let theMqSchema;
    let testRecordSet;
    before(function(){
        theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
        testRecordSet = CommonTestDependencies.testRecordSet;

    })
    it(`Should resolve to MonqadeResponse containing documents with length greater than 0 - 
                control test all is working  `, function (done) {

        const findObject = testRecordSet.pop();  // should be at least one of these
        theMqSchema.doFindMany(findObject)
        .then(mqSearchResponse => {  
            expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
            expect(mqSearchResponse.documents).to.be.an('array');
            expect(mqSearchResponse.documents.length).to.be.greaterThan(0);
            done();
    
        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });
   
    it(`Should reject with 'EmptyFindCriteria' when finding undefined search criteria` , (done)=>{
        const findObject = undefined;
        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.null;
            done();
    
        }).catch(mqError=>{
            rejectedWithErrorCode('EmptyFindCriteria',mqError);
            done();             
        }).catch(otherError=>{
            done(otherError)
        });

    })
    it(`Should reject with 'EmptyFindCriteria' when searching for createdAt only` , (done)=>{
        const findObject = {createdAt:{$gte:new Date()}};
        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.null;
            done();
    
        }).catch(mqError=>{
            rejectedWithErrorCode('EmptyFindCriteria',mqError);
            done();             
        }).catch(otherError=>{
            done(otherError)
        });

    })

    it(`Should reject with 'EmptyFindCriteria' when finding empty search criteria` , (done)=>{
        const findObject ={}
        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.null;
            done();
    
        }).catch(mqError=>{
            rejectedWithErrorCode('EmptyFindCriteria',mqError);
            done();             

        }).catch(otherError=>{
            done(otherError)

        });

    })

    it("Expect actual projection to be specified project plus system paths ", function (done) {

        const findObject = testRecordSet.pop();  // should be at least one of these
        const projection  = theMqSchema.getPathNamesQuery({isProjectable:false}); // only need one path name

        expect(projection.length,'need test non-projectables are being returned').to.be.above(0);

        theMqSchema.doFindMany(findObject,projection,limitOverride)
        .then(mqSearchResponse => {  
            expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
            expect(mqSearchResponse.documents).to.be.an('array');

            const actualProjection = Object.keys( mqSearchResponse.documents[0]);
            const expectedProjection = [...new Set(projection.concat(theMqSchema.getPathNamesSystem()))];
                                        // potential duplicate with systemPaths -- using Set(...) to remove duplicates

            expect(expectedProjection).to.have.members(actualProjection );
            expect(actualProjection ).to.have.members(expectedProjection);
            // ^--- if we care about efficiencies. Could test membership a-> b and a.length=b.length
            done();
    
        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });

    it("Should accept/ignore/disregard non-paths in findCriteria - no error ", function (done) {

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
    it(`Should reject with  EmptyFindCriteria' when findCriteria includes only createdAt `, (done)=>{
        const findObject ={createdAt:new Date()}
        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse => {
            expect(mqSearchResponse).to.be.null;
            done();
    
        }).catch(mqError => {
            rejectedWithErrorCode('EmptyFindCriteria',mqError);
            done();             

        }).catch(otherError => {
            done(otherError);

        });

    })
    it("Should reject with 'MongooseOtherError' when Mongoose throws validation errors ", function (done) {

        const findObject ={idxBucket:Date()}     
        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.null;
            done();
    
        }).catch(mqError=>{
            rejectedWithErrorCode('MongooseOtherError',mqError);
            done();

        }).catch(otherError=>{
            done(otherError);

        });
    });

    it("Should be able to search searchable and non-searchable (doFindMany feature) ", function (done) {
        const testRecord =testRecordSet.pop();

        // make non-searchable findCriteria
        const nonSearchPathID = theMqSchema.getPathNamesQuery({isSearchable:false}).pop()
        const nonSearchable = {};
        nonSearchable[nonSearchPathID] =testRecord[nonSearchPathID];

        // make searchable findCriteria
        const searchCriteria =makeSearchCriteria(testRecordSet.pop(), theMqSchema);    
        const searchable = {};
        searchable[searchCriteria.pathID] = searchCriteria.value;
        
        
        const findObject =Object.assign({}, searchable, nonSearchable);

        theMqSchema.doFindMany(findObject,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
            expect(mqSearchResponse.appliedQuery, 'should include non-searchable paths ').to.include(nonSearchable)
            expect(mqSearchResponse.appliedQuery,'should include searchable paths ').to.include(searchable)
            done();
    
        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);
        });
    });
    });//describe( doFindMany ... )

    describe('.doFindManyCount', () => {
        let theMqSchema;
        let testRecordSet;
        before(function(){
            theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
            testRecordSet = CommonTestDependencies.testRecordSet;
    
        })
    
        it("Should reject with 'EmptyFindCriteria' if no find paths, or createdAt only ", function (done) {

            theMqSchema.doFindManyCount({createdAt:{$gte:'1970-01-01T00:00:00Z'}})
            .then(mqSearchResponse => {
                expect(mqSearchResponse).to.be.null;
                done();
        
            }).catch(mqError => {
                rejectedWithErrorCode('EmptyFindCriteria',mqError);
                done();             
            }).catch(otherError => {
                expect(otherError).to.be.null;
                done(otherError);
            });
        });
        it("Should be greater than 1 when search non-specific document.  ", function (done) {
            theMqSchema.doFindManyCount({idxBucket:1,createdAt:{$gte:'1970-01-01T00:00:00Z'}})
            .then(mqSearchResponse => {  
                expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
                expect(mqSearchResponse.documents).to.be.an('array');
                expect(mqSearchResponse.documents[0].count).to.be.above(1);
                done();
        
            }).catch(mqError => {
                expect(mqError).to.be.null;
                done(); 
    
            }).catch(otherError=>{
                done(otherError);
            });
        });

        it("Should be 1 when searching for specific document ", function (done) {
            const findObject = testRecordSet.pop();  // should be at least one of these
            theMqSchema.doFindManyCount(findObject)
            .then(mqSearchResponse => {  
                expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
                expect(mqSearchResponse.documents).to.be.an('array');
                expect(mqSearchResponse.documents[0].count).to.equal(1);
                done();
        
            }).catch(mqError=>{
                expect(mqError).to.be.null;
                done(); 
    
            }).catch(otherError=>{
                done(otherError);
            });
        });
        it(`Should reject with 'EmptyFindCriteria' when finding undefined search criteria` , (done)=>{
            const findObject = undefined;
            theMqSchema.doFindManyCount(findObject,useDefaultProjection,limitOverride)
            .then(mqSearchResponse=>{
                expect(mqSearchResponse).to.be.null;
                done();
        
            }).catch(mqError=>{
                rejectedWithErrorCode('EmptyFindCriteria',mqError);
                done();             
            }).catch(otherError=>{
                done(otherError)
            });
        });
    
    
    }); // describe('doFindManyCount()'

    //
//            this.getMongooseModelClass().countDocuments(qry,(error,count)=>{
describe(`Mongoose returns unanticipated error`, ()=>{
    const schemaDefinition = CommonTestDependencies.schemaDefinition;
    let badMongooseSchema;
    let fakeMongoose = {   
        set:()=>{},
        model:()=>{return {countDocuments:(findCriteria,callback)=>{
            callback('some error',null);
        }}},
        _model:{}
    }
    before(()=>{
        badMongooseSchema = new CommonTestDependencies.MonqadeSchema(
                                schemaDefinition.paths,
                                schemaDefinition.options,
                                fakeMongoose                
                                );
    
    })
    it(`Should reject with 'MongooseOtherError' when a encountering an unknown mongoose error`,()=>{
        expect(badMongooseSchema).to.not.be.null;
        const findObject = CommonTestDependencies.testRecordSet.pop(); 
        badMongooseSchema.doFindManyCount(findObject)
            .then(mqResponse=>{
                expect(mqResponse).to.be.null;

            })
            .catch(mqError=>{
                rejectedWithErrorCode('MongooseOtherError',mqError);
                expect(mqError).to.not.be.null;
            });
    });
})
describe(`Mongoose returns unanticipated error`, ()=>{
    const schemaDefinition = CommonTestDependencies.schemaDefinition;
    let badMongooseSchema;
    let fakeMongoose = {   
        set:()=>{},
        model:()=>{return {countDocuments:(findCriteria,callback)=>{
            callback({error:'some error',name:'ValidationError'},null);
        }}},
        _model:{}
    }
    before(()=>{
        badMongooseSchema = new CommonTestDependencies.MonqadeSchema(
                                schemaDefinition.paths,
                                schemaDefinition.options,
                                fakeMongoose                
                                );
    
    })
    it(`Should reject with 'MongooseValidationError' when a encountering an unknown mongoose error`,()=>{
        expect(badMongooseSchema).to.not.be.null;
        const findObject = CommonTestDependencies.testRecordSet.pop(); 
        badMongooseSchema.doFindManyCount(findObject)
            .then(mqResponse=>{
                expect(mqResponse).to.be.null;

            })
            .catch(mqError=>{
                rejectedWithErrorCode('MongooseValidationError',mqError);
                expect(mqError).to.not.be.null;
            });
    });
})
    
    
