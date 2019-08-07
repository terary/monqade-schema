"use strict";
/* cSpell:ignore monqade */

const chai = require("chai");
const expect = chai.expect;

const CommonTestDependencies = require("../common");
const resolvedAsExpected = CommonTestDependencies.resolvedAsExpected;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;


const limitOverride = {}; //for readability -> no limit  
const useDefaultProjection = undefined;  //for readability -> will set to default projection if undefined.

let theMqSchema, testRecordSet;
before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;

})


it("Should  works as expected - find the given document. control test ", function (done) {

    const testRecord = testRecordSet.pop(); 
    
    theMqSchema.doFindOne(testRecord)
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

it("Should return array of documents. Document should be serializable  ", function (done) {

    const testRecord = testRecordSet.pop(); 
    theMqSchema.doFindOne(testRecord)
    .then(mqResponse=>{
        resolvedAsExpected(mqResponse);
        const pojoDoc = JSON.parse(JSON.stringify(mqResponse.documents[0]));
        expect( mqResponse.documents[0], ` just plane json `).to.deep.equal(pojoDoc );// . equal(1);
        done();

    }).catch(mqError=>{
        expect(mqError).to.be.null;
        done(); 

    }).catch(otherError=>{
        done(otherError);
    });
});
it("Should reject with 'MissingOrInvalidSystemPaths' if there is a mismatch on schema version key  ", function (done) {
    const testRecord = testRecordSet.pop(); 
    testRecord['_schemaVersion'] = 'wrong_schema_key'

    theMqSchema.doFindOne(testRecord)
    .then(mqResponse => {
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError => {
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError => {
        done(otherError);
    });
});

it("Should reject with 'MissingOrInvalidSystemPaths' for  malformed ID", function (done) {
    const findObject ={_id:2}     
    theMqSchema.doFindOne(findObject,useDefaultProjection,limitOverride)
    .then(mqResponse => {
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError => {
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("Should reject with 'MissingOrInvalidDocumentIDs' if findCriteria is empty ", function (done) {
    const findObject ={}     
    theMqSchema.doFindOne(findObject,useDefaultProjection,limitOverride)
    .then(mqResponse => {
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError => {
        rejectedWithErrorCode('MissingOrInvalidDocumentIDs',mqError);
        done();

    }).catch(otherError => {
        done(otherError);
    });
});

it("Should reject with 'MissingOrInvalidDocumentIDs' if findCriteria is undefined. ", function (done) {
    const findObject =undefined; 
    theMqSchema.doFindOne(findObject,useDefaultProjection,limitOverride)
    .then(mqResponse => {
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError => {
        rejectedWithErrorCode('MissingOrInvalidDocumentIDs',mqError);
        done();

    }).catch(otherError => {
        done(otherError);
    });
});

it("Should reject with 'MissingOrInvalidSystemPaths' if search id alone ", function (done) {
    const findObject ={_id:'5bc2ee63086f322373756e70'}; 
    theMqSchema.doFindOne(findObject)
    .then(mqResponse => {
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError => {
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError => {
        done(otherError);
    });
});
it("Should reject with 'NoMatchingDocumentFound' if no document found all system paths ok, just not matching", function (done) {
    const testRecord = testRecordSet.pop(); 
    testRecord['_id'] ='5bc2ee63086f322373756e70'; 
    theMqSchema.doFindOne(testRecord)
    .then(mqResponse => {
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError => {
        rejectedWithErrorCode('NoMatchingDocumentFound',mqError);
        done();

    }).catch(otherError => {
        done(otherError);
    });
});
// mongoose issues:
describe('When mongoose returns error when call deleteOne - maybe broken connection?', ()=>{
    const schemaDefinition = CommonTestDependencies.schemaDefinition;
    let delSchema;
    let fakeMongoose = {   
        set:()=>{},
        model:()=>{return {find:(findCriteria,callback)=>{
            callback('this is an error',null);
        }}},
        _model:{}
    }
    beforeEach(()=>{
        delSchema = new CommonTestDependencies.MonqadeSchema(
                                schemaDefinition.paths,
                                schemaDefinition.options,
                                fakeMongoose                
                                );
                            //this.getMongooseModelClass().deleteOne(findCriteria,(error,statusResponse)=>{
    
    })
    it(`should be schema`,()=>{
        expect(delSchema).to.not.be.null;
        const findObject = testRecordSet.pop(); 
        delSchema.doFindOne(findObject)
            .then(mqResponse=>{
                expect(mqResponse).to.be.null;

            })
            .catch(mqError=>{
                rejectedWithErrorCode('MongooseError',mqError);
 
            });
    });
})