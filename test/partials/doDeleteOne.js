const  CommonTestDependencies = require("../common").CommonTestDependencies;
const MonqadeResponse = CommonTestDependencies.MonqadeResponse;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;

const chai = require("chai");
expect = chai.expect;

before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;
})




it("Verify works as expected.  Should delete a record (mqResponse.meta.n=1 and mqResponse.meta.ok=1 ) ", function (done) {
    // const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    // const testRecordSet = CommonTestDependencies.testRecordSet;

    const testRecord = testRecordSet.pop(); 
    theMqSchema.doDeleteOne(testRecord)
    .then(mqResponse=>{
        expect(mqResponse).to.be.an.instanceof(MonqadeResponse);
        expect(mqResponse.documents.length, `doDeleteOne should return empty array. returned ${mqResponse.documents.length}`).to.equal(0 );
        expect(mqResponse.meta.ok).to.eq(1);  
        expect(mqResponse.meta.n).to.eq(1);  
        done();
    }).catch(mqError=>{
        expect(mqError).to.be.null;
        done(); 
    }).catch(otherError=>{
        done(otherError);
    });
});

it("Malformed systemPaths will reject with mqError.code='MissingOrInvalidSystemPaths' ", function (done) {
//    const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'

    const findObject ={_id:2}     
    theMqSchema.doDeleteOne(findObject)
    .then(mqSearchResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("Empty systemPaths will reject with mqError.code='MissingOrInvalidSystemPaths' ", function (done) {
 //   const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'

    const findObject ={}     
    theMqSchema.doDeleteOne(findObject)
    .then(mqSearchResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("SystemPaths=undefined will reject with mqError.code='MissingOrInvalidSystemPaths' ", function (done) {
//    const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'

    const findObject =undefined; 
    theMqSchema.doDeleteOne(findObject)
    .then(mqSearchResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("systemPaths known to not exits will reject with mqError.code='NoMatchingDocumentFound' ", function (done) {
//    const theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
//NoMatchingDocumentFound
    const findObject ={_id:'5bc2ee63086f322373756e70',
        updatedAt:'2018-12-15T20:48:11.359Z',
        createdAt:'2018-12-15T20:48:11.359Z',
        _schemaVersionKey:'0001'}; 
     findObject[ theMqSchema.docVersionKeyName] ='-3' ;

    theMqSchema.doDeleteOne(findObject)
    .then(mqResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('NoMatchingDocumentFound',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});
