const CommonTestDependencies = require("../common").CommonTestDependencies;
const resolvedAsExpected = CommonTestDependencies.resolvedAsExpected;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;

const LAMBDAS = CommonTestDependencies.LAMBDAS; 
const chai = require("chai");
expect = chai.expect;

const limitOverride = {}; //for readability -> no limit  
const useDefaultProjection = undefined;  //for readability -> will set to default projection if undefined.

before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;

})


it("verify works as expected.  Should find a record ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const testRecord = testRecordSet.pop(); 
    
    theMqSchema.doFindOne({_id:testRecord._id})
    .then(mqResponse=>{
        resolvedAsExpected(mqResponse);
        done();

    }).catch(mqError=>{
        expect(mqError).to.be.null;
        done(); 

    }).catch(otherError=>{
        done(otherError);
    });
});

it("returns JSON  ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const testRecord = testRecordSet.pop(); 
    theMqSchema.doFindOne({_id:testRecord._id})
    .then(mqResponse=>{
        resolvedAsExpected(mqResponse);
        expect(LAMBDAS.isPojo( mqResponse.documents[0]), `doFindOne should return one POJO document`).to.equal(true );// . equal(1);
        done();

    }).catch(mqError=>{
        expect(mqError).to.be.null;
        done(); 

    }).catch(otherError=>{
        done(otherError);
    });
});

it("malformed ID will reject with MonqadeError.errorCode='MissingOrInvalidDocumentIDs' ", function (done) {
//    const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'

    const findObject ={_id:2}     
    theMqSchema.doFindOne(findObject,useDefaultProjection,limitOverride)
    .then(mqSearchResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidDocumentIDs',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("empty arguments will reject with MonqadeError.errorCode='MissingOrInvalidDocumentIDs' ", function (done) {
  //  const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'

    const findObject ={}     
    theMqSchema.doFindOne(findObject,useDefaultProjection,limitOverride)
    .then(mqSearchResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidDocumentIDs',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("undefined arguments  will reject with MonqadeError.errorCode='MissingOrInvalidDocumentIDs' ", function (done) {
//    const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'

    const findObject =undefined; 
    theMqSchema.doFindOne(findObject,useDefaultProjection,limitOverride)
    .then(mqSearchResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidDocumentIDs',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("_id known to not exits rejects with MonqadeError.errorCode='NoMatchingDocumentFound' ", function (done) {
 //   const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'

    const findObject ={_id:'5bc2ee63086f322373756e70'}; 
    theMqSchema.doFindOne(findObject)
    .then(mqSearchResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('NoMatchingDocumentFound',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});
