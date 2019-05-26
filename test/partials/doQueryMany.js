
const CommonTestDependencies = require("../common").CommonTestDependencies;
const MonqadeResponseSearch = CommonTestDependencies.MonqadeResponseSearch;
const MonqadeQueryBuilder = CommonTestDependencies.MonqadeQueryBuilder;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;


const chai = require("chai");
expect = chai.expect;


const limitOverride = {}; // 
const useDefaultProjection = undefined;  //function sets to default if undefined.

const resolvedManyAsExpected = (mqResponse) =>{
    expect(mqResponse).to.be.an.instanceof(MonqadeResponseSearch);
    expect(mqResponse.documents).to.be.an('array')
}
const makeSearchCriteria = (testRecord,mqSchema)=>{
    const searchForPathID = mqSchema.getPathNamesSearchable().pop();
    return {pathID:searchForPathID,value:testRecord[searchForPathID]}
}

before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;
})

it("Control test - verify works as expected ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const searchCriteria =makeSearchCriteria(testRecordSet.pop(), theMqSchema);    

    //    const theMqSchema = common.theMqSchema;

    theMqSchema.useRestrictiveSearch=true; //default is true but other testing
                                           //may have changed this.

    mqQueryBuilder =new MonqadeQueryBuilder(theMqSchema.getSearchablePathNamesWithTypes());

    mqQueryBuilder.eq(searchCriteria.pathID, searchCriteria.value);

    theMqSchema.doQueryMany(mqQueryBuilder,useDefaultProjection,limitOverride)
    .then(mqSearchResponse=>{
        resolvedManyAsExpected(mqSearchResponse)
        done();

    }).catch(mqError=>{
        expect(mqError).to.be.null;
        done(); 

    }).catch(otherError=>{
        done(otherError);

    });
});

it("'undefined' queryBuilder should reject with MonqadeError.code='NonTrustedQueryBuilder'", function (done) {
//    const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
//    const theMqSchema = common.theMqSchema;

    theMqSchema.useRestrictiveSearch=true; //default is true but other testing
                                           //may have changed this.

    theMqSchema.doQueryMany(undefined,useDefaultProjection,limitOverride)
    .then(mqSearchResponse=>{
        expect(mqError).to.be.null;
        done();

    }).catch(mqError=>{
        rejectedWithErrorCode('NonTrustedQueryBuilder',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("No QueryBuilder object should reject with MonqadeError.code='NonTrustedQueryBuilder'", function (done) {
//    const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
//    const theMqSchema = common.theMqSchema;

    theMqSchema.useRestrictiveSearch=true; //default is true but other testing
                                           //may have changed this.

    theMqSchema.doQueryMany({},useDefaultProjection,limitOverride)
    .then(mqSearchResponse=>{
        expect(mqError).to.be.null;
        done();

    }).catch(mqError=>{
        rejectedWithErrorCode('NonTrustedQueryBuilder',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});


it("Expect actual projection to be specified project plus system paths ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const searchCriteria =makeSearchCriteria(testRecordSet.pop(), theMqSchema);    

    theMqSchema.useRestrictiveSearch=true; //default is true but other testing
                                           //may have changed this.

    const mqQueryBuilder =new MonqadeQueryBuilder(theMqSchema.getSearchablePathNamesWithTypes());
    const projection = theMqSchema.getPathNamesQuery({isSystem:false}).slice(0,1); // only need one path name, as array

    mqQueryBuilder.eq(searchCriteria.pathID, searchCriteria.value);


    theMqSchema.doQueryMany(mqQueryBuilder,projection,limitOverride)
    .then(mqSearchResponse=>{  // is the projection what is expected.
        expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);
        const expectedProjection = projection.concat(theMqSchema.getPathNamesSystem());
        const actualProjection = Object.keys( mqSearchResponse.documents[0]);
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


it.skip("Not testing QueryBuilder but gaining confidence more complex queries are handled ", function (done) {
    // This test works only with specific knowledge of the underlying schema and document set

    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'

    theMqSchema.useRestrictiveSearch=true; //default is true but other testing
                                           //may have changed this.
    mqQueryBuilder =new MonqadeQueryBuilder(theMqSchema.getSearchablePathNamesWithTypes());
            
    // should  be approximately all documents. 
    mqQueryBuilder.betweeni('idxBucket',0,-3,8,9);
    mqQueryBuilder.betweenx('someDate',new Date('1970-01-01'),new Date());
    mqQueryBuilder.in('state','ME','ca','ne','ut');
    this.test.title += "\n\t" + JSON.stringify(mqQueryBuilder.toFindObject());

    theMqSchema.doQueryMany(mqQueryBuilder,useDefaultProjection,limitOverride)
    .then(mqSearchResponse=>{
        resolvedManyAsExpected(mqSearchResponse)
        done();

    }).catch(mqError=>{
        expect(mqError).to.be.null;
        done(); 

    }).catch(otherError=>{
        done(otherError);

    });
});
