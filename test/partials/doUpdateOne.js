
const  CommonTestDependencies = require("../common").CommonTestDependencies;
const MonqadeResponse = CommonTestDependencies.MonqadeResponse;
const MonqadeError = CommonTestDependencies.MonqadeError; 
const resolvedAsExpected = CommonTestDependencies.resolvedAsExpected;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;
const skipThisTest = CommonTestDependencies.rejectedWithErrorCode;
const LAMBDAS = CommonTestDependencies.LAMBDAS;

const chai = require("chai");
expect = chai.expect;


before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;
})



it("Control test-- make sure things work as expected 'MonqadeResponse' with single updated document ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdatable()); 

    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse=>{ //MonqadeResponse
            resolvedAsExpected(mqResponse);
            done();
    
        }).catch(mqError=>{ //MonqadeError
            if( ! MonqadeError.isThisOne(mqError)){
                throw(mqError);
            }
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError=>{
            done(unknownError);
        })
});

it("Expect that return document is a JSON document ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    // change pre-existing document with testData
    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdatable()); 

    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse=>{ //MonqadeResponse
            resolvedAsExpected(mqResponse);
            expect(LAMBDAS.isPojo( mqResponse.documents[0]), `should return POJO document`).to.equal(true );// . equal(1);
            done();
    
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
            done(); 

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});

it("Update with an empty record rejects with MonqadeError.code 'MissingOrInvalidSystemPaths' ", function (done) {
//    const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'


    theMqSchema.doUpdateOne({})
        .then(mqResponse=>{ //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError=>{ //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
            done();

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});

it("Updating without system fields rejects with MonqadeError.code 'MissingOrInvalidSystemPaths' ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;
    
    // change pre-existing document with testData
    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdatable()); 
    theMqSchema.getPathNamesSystem().forEach(pathName=>{
        delete testRecord[pathName]
    })

    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse=>{ //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError=>{ //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
            done();

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});

it("Update with wrong _id rejects with MonqadeError.code='NoMatchingDocumentFound' ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdatable()); 

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

it("Update with _id in bad format (or just wrong) reject with MonqadeError.code='MissingOrInvalidSystemPaths' ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const testRecord = Object.assign({},  testRecordSet.pop(), theMqSchema.createTestDocumentForUpdatable()); 

    testRecord['_id']  ='5c15688bda44621eb33a534x'; //<--bad (just wrong) format 
    
    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse=>{ //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError=>{ //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
            done();

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
});

it("Update with 'updatedAt' different from collection's copy should reject with 'NoMatchingDocumentFound' ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    //new values for pre-existing document
    const testRecord = Object.assign({}, testRecordSet.pop(), theMqSchema.createTestDocumentForUpdatable()); 
    testRecord['updatedAt'] = new Date();
    
    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse=>{ //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError=>{ //MonqadeError
            rejectedWithErrorCode('NoMatchingDocumentFound',mqError);
            done();

        }).catch(unknownError =>{
            done(unknownError);  // 

        });
});

// left in to indicate test-case was considered
it.skip("updatedAt has different behavior depending on mongoose call used for update ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const testRecord =testRecordSet.pop()
    
    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse=>{ //MonqadeResponse
            // expect(mqResponse).to.be.null;
            // done();
            expect(mqResponse).to.be.an.instanceof(MonqadeResponse);
            const updatedDoc =  mqResponse.documents[0];
    
            // mongo/ose current behavior updatedAt changes regardless if no effective change
            // requires further research but I think find()..save() and findOneAndUpdate will 
            // have different timestamp behavior     
            //expect(testRecord['updatedAt'],'updatedAt should be the same - no effectual change').to.eq(updatedDoc['updatedAt']);  
            done();
    
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);
        });
});
    
it("Update with empty request (no updatable fields) should reject with MonqadeError.code='EmptyCandidateDoc'", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const testRecord =testRecordSet.pop()

    theMqSchema.getPathNamesUpdatable().forEach(pathID=>{
        delete testRecord[pathID];
    });

    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse=>{ //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError=>{ //MonqadeError
            rejectedWithErrorCode('EmptyCandidateDoc',mqError);
            done();

        }).catch(unknownError =>{
            done(unknownError);  // 
        });
});

it("Changes to paths marked isUpdated=false are quietly disregarded ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    // test record with different values than stored  
    const testRecord = Object.assign({},  testRecordSet.pop(), theMqSchema.createTestDocumentForUpdatable()); 

    const pathNamesNotUpdatable = theMqSchema.getPathNamesNonUpdatable(); 
    const pathNamesSystem = theMqSchema.getPathNamesSystem(); 
    const pathNamesUpdatable = theMqSchema.getPathNamesUpdatable(); 


    // change paths that are not system or isUpdatable=true
    // changing system fields should cause to "no record found" errors 
    // invalidating this test. 
    const controlRecord = Object.assign({},testRecord); 
    const prohibitedFields = theMqSchema.getPathNamesQuery({isSystem:false,isUpdatable:false});
    const prohibitedChanges = {}        
    prohibitedFields.forEach(pathID=>{
        prohibitedChanges[pathID] =theMqSchema.getPathOptions(pathID).makeTestData();

        // important for change false to false or if 'makeTestData()'
        // not very random.
        if(testRecord[pathID] == prohibitedChanges[pathID]){  
            delete prohibitedChanges[pathID];  // no actual change will goof later examination.
        }else {
            testRecord[pathID] = prohibitedChanges[pathID];
        }

    });

    if(Object.keys(prohibitedChanges).length == 0){
        skipThisTest.call(this,'Skipping - unable to prohibited create changes to test! ' + this.test.title )
    }
    // console.log("\n\n*****************\n\n")
    // console.log('getPathNamesUniqueOption:', theMqSchema.getPathNamesUniqueOption());
    // console.log("\n\n*****************\n\n")

    theMqSchema.doUpdateOne(testRecord)
        .then(mqResponse=>{ //MonqadeResponse

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
            
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError =>{
            console.log('Unknown error:',unknownError);
            done(unknownError);

        });
}); //ends: it("Changes to paths marked isUpdated=false are quietly disregarded "
