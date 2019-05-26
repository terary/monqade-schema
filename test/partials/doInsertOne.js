const  CommonTestDependencies = require("../common").CommonTestDependencies;
const resolvedAsExpected = CommonTestDependencies.resolvedAsExpected;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;
const skipThisTest = CommonTestDependencies.rejectedWithErrorCode;

const chai = require("chai");
expect = chai.expect;

before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;

})


it("Inserting self generated test record should result in 'MonqadeResponse' ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    //const theMqSchema = common.theMqSchema;

    theMqSchema.doInsertOne(theMqSchema.createTestDocumentForInsert())
    .then(mqResponse=>{ //MonqadeResponse
        resolvedAsExpected(mqResponse);
        done();

    }).catch(mqError=>{ //MonqadeError
        expect(mqError).to.be.null;
        done(mqError); 
    }).catch(otherError=>{
        console.log("Caught Other Error:",otherError);
    })
});

it("Insert empty record should reject MonqadeError.errorCode = 'EmptyCandidateDoc' ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    //const theMqSchema = common.theMqSchema;

    theMqSchema.doInsertOne({})
    .then(mqResponse=>{ //MonqadeResponse
        expect(mqResponse).to.be.null;
        done();

    }).catch(mqError=>{ //MonqadeError
        rejectedWithErrorCode('EmptyCandidateDoc',mqError);
        done()

    }).catch(otherError=>{
        done(otherError)
    })
});

it("Insert document missing required paths should reject MonqadeError.errorCode = 'EmptyCandidateDoc' ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    //const theMqSchema = common.theMqSchema;

    const testRecord = theMqSchema.createTestDocumentForInsert();
    const requiredPaths = theMqSchema.getPathNamesRequired();

    if ( requiredPaths.length == 0){
        skipThisTest.call(this,`'Skipping.. Schema has no required fields.' `)
    }

    requiredPaths.forEach(pathID=>{
        delete  testRecord[pathID];
    })

    theMqSchema.doInsertOne(testRecord)
    .then(mqResponse=>{ //MonqadeResponse
        expect(mqResponse).to.be.null;
        done();

    }).catch(mqError=>{ //MonqadeError
        rejectedWithErrorCode('MongooseValidationError',mqError);
        done()

    }).catch(unknownError=>{
        done(unknownError)
    })
});

it("Should quietly disregard paths not defined in original schema. ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    //const theMqSchema = common.theMqSchema;

    const theTestRecord = theMqSchema.createTestDocumentForInsert();
    const fakePathName = 'myFakePath' + Math.floor(100000 * Math.random());
    theTestRecord[fakePathName] =  Math.floor(100000 * Math.random());

    theMqSchema.doInsertOne(theTestRecord)
    .then(mqResponse=>{ //MonqadeResponse

        resolvedAsExpected(mqResponse);
        const newDocument = mqResponse.documents[0];
        expect(newDocument[fakePathName],`Fake path: '${fakePathName}' was inserted`).to.be.undefined;
        done();

    }).catch(mqError=>{ //MonqadeError
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
    .then(mqResponse=>{ //MonqadeResponse

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

    }).catch(mqError=>{ //MonqadeError
        //expect(mqError,' Did not expect an error').to.be.null;
        done(mqError); 

    })
});