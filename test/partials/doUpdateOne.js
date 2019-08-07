"use strict";
/* cSpell:ignore monqade */
/**
 * Tests are supposed to be schema agnostic.  Some code is written to determine
 * if the schema supports the feature being tested.  Example- are there paths set isUpdatable=true
 * 
 */

const chai = require("chai");
const expect = chai.expect;

const CommonTestDependencies = require("../common");
const MonqadeResponse = CommonTestDependencies.MonqadeResponse;
const MonqadeError = CommonTestDependencies.MonqadeError; 
const resolvedAsExpected = CommonTestDependencies.resolvedAsExpected;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;
const skipThisTest = CommonTestDependencies.rejectedWithErrorCode;


let theMqSchema, testRecordSet; 
before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;
})



it("Verify works as expected. Returns  'MonqadeResponse' with single updated document ", function (done) {

    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdate()); 

    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse => { //MonqadeResponse
            resolvedAsExpected(mqResponse);
            done();
    
        }).catch(mqError => { //MonqadeError
            if( ! MonqadeError.isThisOne(mqError)){
                throw(mqError);
            }
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError => {
            done(unknownError);
        })
});

it("Should return strictly json document on when updating", function (done) {
    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdate()); 

    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse => { //MonqadeResponse
            resolvedAsExpected(mqResponse);
            const strictJSONdoc = JSON.parse(JSON.stringify(mqResponse.documents[0]));
            expect(mqResponse.documents[0], `should return POJO document`).to.deep.equal(strictJSONdoc);// . equal(1);
            done();
    
        }).catch(mqError => { //MonqadeError
            expect(mqError).to.be.null;
            done(); 

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});

it("Should reject with 'MissingOrInvalidSystemPaths' when trying to update an empty document ", function (done) {
    theMqSchema.doUpdateOne({})
        .then(mqResponse => { //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError => { //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
            done();

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});

it("Should reject with 'MissingOrInvalidSystemPaths' when trying to update an empty document ", function (done) {
    theMqSchema.doUpdateOne({})
        .then(mqResponse => { //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError => { //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
            done();

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});
it(`Should reject with 'MissingOrInvalidSystemPaths' when trying to update with invalid schema version `, function (done) {
    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdate()); 
    testRecord['_schemaVersion'] = 'wrong_schema_key'
    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse => { //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError => { //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
            done();

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});

it("Should reject with 'MissingOrInvalidSystemPaths' when missing system paths ", function (done) {

    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdate()); 
    theMqSchema.getPathNamesSystem().forEach(pathName=>{
        delete testRecord[pathName]
    })

    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse => { //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError => { //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
            done();

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});

it("Should reject with 'NoMatchingDocumentFound' when using non-existing _id ", function (done) {
    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdate()); 

    testRecord['_id'] ='5c15688bda44621eb33a534a'; //looks good, but known not to exist
    
    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse=>{ 
            expect(mqResponse).to.be.null;
            done();

        }).catch(mqError=>{ 
            rejectedWithErrorCode('NoMatchingDocumentFound',mqError);
            done();

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });

});

it("Should reject with 'MissingOrInvalidSystemPaths' when _id  bad format (or just wrong) ", function (done) {
    const testRecord = Object.assign({},  testRecordSet.pop(), theMqSchema.createTestDocumentForUpdate()); 

    testRecord['_id']  ='5c15688bda44621eb33a534x'; //<--bad (just wrong) format 
    
    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse => { //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError => { //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
            done();

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});

it("Should reject with 'NoMatchingDocumentFound' when system paths do not match ", function (done) {
    //new values for pre-existing document
    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdate()); 
    testRecord['updatedAt'] = new Date();
    
    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse => { //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError => { //MonqadeError
            rejectedWithErrorCode('NoMatchingDocumentFound',mqError);
            done();

        }).catch(unknownError =>{
            done(unknownError);  // 

        });
});

// left in to indicate test-case was considered
it.skip("updatedAt has different behavior depending on mongoose call used for update ", function (done) {

    const testRecord =testRecordSet.pop()
    
    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse => { //MonqadeResponse
            // expect(mqResponse).to.be.null;
            // done();
            expect(mqResponse).to.be.an.instanceof(MonqadeResponse);
            const updatedDoc =  mqResponse.documents[0];
    
            // mongo/ose current behavior updatedAt changes regardless if no effective change
            // requires further research but I think find()..save() and findOneAndUpdate will 
            // have different timestamp behavior     
            //expect(testRecord['updatedAt'],'updatedAt should be the same - no effectual change').to.eq(updatedDoc['updatedAt']);  
            done();
    
        }).catch(mqError => { //MonqadeError
            expect(mqError).to.be.null;
        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);
        });
});
    
it("Should reject with 'EmptyCandidateDoc' when attempting to update with empty request (no updatable fields)", function (done) {
    const testRecord =testRecordSet.pop()

    theMqSchema.getPathNamesUpdatable().forEach(pathID=>{
        delete testRecord[pathID];
    });

    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse => { //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError => { //MonqadeError
            rejectedWithErrorCode('EmptyCandidateDoc',mqError);
            done();

        }).catch(unknownError =>{
            done(unknownError);  // 
        });
});

it("Should quietly ignore non-updatable paths (isUpdated=false).", function (done) {

    // test record with different values than stored values
    const testRecord = Object.assign({},  testRecordSet.pop(), theMqSchema.createTestDocumentForUpdate()); 

    // change paths that are not system or isUpdatable=true
    // changing system fields should cause to "no record found" errors 
    // invalidating this test. 
    const prohibitedFields = theMqSchema.getPathNamesQuery({isSystem:false,isUpdatable:false});
    const prohibitedChanges = {}        

    prohibitedFields.forEach(pathID=>{
        prohibitedChanges[pathID] =theMqSchema.getPathOptions(pathID).makeTestData();

        if(testRecord[pathID] == prohibitedChanges[pathID]){
            //on the outside chance the test document is no different 
            //then current document --> effectively no change, will goof our test. 
            // Mongo handles no effective change differently MSSQL but similar to MySQL
            // who is to say what is best. 
            delete prohibitedChanges[pathID];  
        }else {
            testRecord[pathID] = prohibitedChanges[pathID];
        }

    });

    if(Object.keys(prohibitedChanges).length == 0){
        skipThisTest.call(this,'Skipping - unable to create changes to test! ' + this.test.title )
    }
    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse => { //MonqadeResponse

            resolvedAsExpected(mqResponse);

            // additionally prohibited changes should be ignored.
            const theUpdatedDoc = mqResponse.documents[0];
            const effectedProhibitedChanges = [];
            for(let pathID of Object.keys(prohibitedChanges)){
                if(theUpdatedDoc[pathID] == prohibitedChanges[pathID]){
                    effectedProhibitedChanges.push(`${pathID} was changed to ${prohibitedChanges[pathID]}`);
                }
            }
            expect(effectedProhibitedChanges.length, `Prohibited changes should be 0 (actual: ${effectedProhibitedChanges.length})`).to.equal(0 );// . equal(1);
            done();
            
        }).catch(mqError => { //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
}); 