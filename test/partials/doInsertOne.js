"use strict";
/* cSpell:ignore monqade */

const chai = require("chai");
const expect = chai.expect;

const CommonTestDependencies = require("../common");
const resolvedAsExpected = CommonTestDependencies.resolvedAsExpected;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;
const mongoose =  CommonTestDependencies.mongoose;

const skipThisTest = CommonTestDependencies.rejectedWithErrorCode;


let theMqSchema, testRecordSet;  
before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;

})


it("Verify works as expected. Inserting self generated test record should result in 'MonqadeResponse' ", function (done) {
    theMqSchema.doInsertOne(theMqSchema.createTestDocumentForInsert())
    .then(mqResponse => { //MonqadeResponse
        resolvedAsExpected(mqResponse);
        done();

    }).catch(mqError => { //MonqadeError
        expect(mqError).to.be.null;
        done(mqError); 
    }).catch(otherError=>{
        console.log("Caught Other Error:",otherError);
    })
});

it("Should reject with 'InsertSystemPathsForbidden' when attempting to insert system paths  ", function (done) {
    const testDoc = theMqSchema.createTestDocument();
    testDoc['createdAt'] = new Date();
    testDoc['updatedAt'] = new Date();
    testDoc['_id'] =  mongoose.Types.ObjectId();
    testDoc['_schemaVersionKey'] = 'not_real_key';


    theMqSchema.doInsertOne(testDoc)
    .then(mqResponse => { //MonqadeResponse
        expect(mqResponse).to.be.null;
        done();

    }).catch(mqError => { //MonqadeError
        rejectedWithErrorCode('InsertSystemPathsForbidden',mqError);
        done()

    }).catch(unknownError => {
        done(unknownError)
    })
});
it("Should set to default value (defined in Schema) when isInsertable=false and default is defined  ", function (done) {
    const testDoc = theMqSchema.createTestDocumentForInsert();
    testDoc['memberSinceDate'] = new Date('1974-06-29T01:30:00Z');


    theMqSchema.doInsertOne(testDoc)
    .then(mqResponse => { //MonqadeResponse
        resolvedAsExpected(mqResponse);
        const newDoc = mqResponse.documents[0];
        expect(newDoc['memberSinceDate']).to.not.equal(testDoc['memberSinceDate'])
        expect(newDoc['memberSinceDate']).to.not.be.undefined;
        expect(newDoc['memberSinceDate']).to.not.be.null;
        done();

    }).catch(mqError => { //MonqadeError
        expect(mqError).to.be.null;
        done(mqError); 

    }).catch(otherError=>{
        console.log("Caught Other Error:",otherError);
        done(otherError);

    });
});


it("Should reject with 'InsertSystemPathsForbidden' when attempting insert _id. ", function (done) {
    const testDoc =theMqSchema.createTestDocumentForInsert();
    testDoc['_id'] = mongoose.Types.ObjectId();
    theMqSchema.doInsertOne(testDoc)
    .then(mqResponse => { //MonqadeResponse
        expect(mqResponse).to.be.null;
        done();

    }).catch(mqError => { //MonqadeError
        rejectedWithErrorCode('InsertSystemPathsForbidden',mqError);
        done()

    }).catch(unknownError => {
        done(unknownError)
    })

});

it("Should reject with 'EmptyCandidateDoc' when attempted in insert empty document ", function (done) {

    theMqSchema.doInsertOne({})
    .then(mqResponse => { //MonqadeResponse
        expect(mqResponse).to.be.null;
        done();

    }).catch(mqError => { //MonqadeError
        rejectedWithErrorCode('EmptyCandidateDoc',mqError);
        done()

    }).catch(otherError=>{
        done(otherError)

    });
});


it("Should reject with 'MongooseValidationError' when missing required paths", function (done) {

    const testRecord = theMqSchema.createTestDocumentForInsert();
    const requiredPaths = theMqSchema.getPathNamesRequired();

    expect(requiredPaths.length,'schema required paths necessary for this test').to.be.above(0);

    requiredPaths.forEach(pathID=>{
        delete  testRecord[pathID];
    })

    theMqSchema.doInsertOne(testRecord)
    .then(mqResponse => { //MonqadeResponse
        expect(mqResponse).to.be.null;
        done();

    }).catch(mqError => { //MonqadeError
        rejectedWithErrorCode('MongooseValidationError',mqError);
        done()

    }).catch(unknownError => {
        done(unknownError)
    })
});

it("Should quietly disregard paths not defined in original schema. ", function (done) {

    const theTestRecord = theMqSchema.createTestDocumentForInsert();
    const fakePathName = 'myFakePath' + Math.floor(100000 * Math.random());
    theTestRecord[fakePathName] =  Math.floor(100000 * Math.random());

    theMqSchema.doInsertOne(theTestRecord)
    .then(mqResponse => { //MonqadeResponse
        resolvedAsExpected(mqResponse);
        const newDocument = mqResponse.documents[0];
        expect(newDocument[fakePathName],`Fake path: '${fakePathName}' was inserted`).to.be.undefined;
        done();

    }).catch(mqError => { //MonqadeError
        expect(mqError,' Did not expect an error').to.be.null;
        done(mqError); 

    })
});

it.skip("test is a bit goofy- insertable=false, required or not, default or not??/ Should quietly disregard paths marked as isInsertable=false . ", function (done) {
    // leaving test for future consideration
    // pass/fail can be effected by schema: isInsertable, required, default. 
    // combination of these can cause this test to fail 
    // see isInsert documentation MonqadePath
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    //const theMqSchema = common.theMqSchema;

    const theTestRecord = theMqSchema.createTestDocumentForInsert();

    const effectiveNonInsertables = theMqSchema.getPathNamesQuery({isSystem:false,isInsertable:false});
    if(effectiveNonInsertables.length==0){
        skipThisTest.call(this,`There are no effective non insertable paths (isInsertable=false`);
    }

    for(let pathID of effectiveNonInsertables){
        theTestRecord[pathID] = theMqSchema.getPathOptions(pathID).makeTestData() || 'makeTestData not defined';
    }


    theMqSchema.doInsertOne(theTestRecord)
    .then(mqResponse => { //MonqadeResponse

        resolvedAsExpected(mqResponse);
        const newDocument = mqResponse.documents[0];
        const nonInsertablesNotIgnored = [];
        for(let pathID of effectiveNonInsertables){
            if(newDocument[pathID] === theTestRecord[pathID]){
                nonInsertablesNotIgnored.push(pathID);
            }
        }
        expect(nonInsertablesNotIgnored.length, `Should not be able to insert isInsertable=false. returned ${nonInsertablesNotIgnored.join(',')} (count:${nonInsertablesNotIgnored.length})`).to.equal(0 );

        done();

    }).catch(mqError => { //MonqadeError
        //expect(mqError,' Did not expect an error').to.be.null;
        done(mqError); 

    })
});
