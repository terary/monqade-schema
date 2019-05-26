"use strict";

const  CommonTestDependencies = require("../common").CommonTestDependencies;
const MonqadeResponse = CommonTestDependencies.MonqadeResponse;
const MonqadeError = CommonTestDependencies.MonqadeError; 
const resolvedAsExpected = CommonTestDependencies.resolvedAsExpected;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;
const skipThisTest = CommonTestDependencies.skipThisTest;
const LAMBDAS = CommonTestDependencies.LAMBDAS;
const fnTimer = require('tmc-debug-function-timer');
const chai = require("chai");
const expect = chai.expect;

let theMqSchema; //= CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
let testRecordSet;// = CommonTestDependencies.testRecordSet;


let uniqueForeignIDPathName = undefined;
`Tests assume there is a a singular foreignID`

let expectedUpdate= (controlDocument, mqResponse)=>{
    resolvedAsExpected(mqResponse);
    const subjectDoc = mqResponse._docs[0];
    expect(subjectDoc['updatedAt']).not.to.equal(controlDocument['updatedAt'])
    expect(subjectDoc['_id']).to.equal(controlDocument['_id'])

}
let expectedInsert= ( mqResponse)=>{
    resolvedAsExpected(mqResponse);
    const subjectDoc = mqResponse._docs[0];
    expect(subjectDoc['updatedAt']).to.equal(subjectDoc['createdAt'])

}

before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;
    uniqueForeignIDPathName = theMqSchema.getPathNamesUniqueOption()[0]
    if(!uniqueForeignIDPathName){
        // title is already written to screen, this won't work
        //this.test.parent.title = "valid only for schema with path that has 'unique' option... skipping" + this.title  
        this.skip();

    }

})


it("Should update if foreign ID exists - Control test, works as expected ", function (done) {
    `
        To observer a difference between createdAt and updatedAt - had to force lengthy delay.
        Otherwise it seems to update in-place (or in process) the target document.
        Confirmed by review the actual document in the collection.  Update happens - but updateAt=createdAt
    `

    const controlDoc =   testRecordSet.pop();
    const updateDoc =theMqSchema.createTestDocumentForUpdatable();
    const testDoc = Object.assign({},controlDoc,updateDoc ); 
    testDoc[uniqueForeignIDPathName] = controlDoc[uniqueForeignIDPathName];

    
    theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse=>{ //MonqadeResponse
    
            expectedUpdate(controlDoc,mqResponse)
            done();
    
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError=>{
            done(unknownError);
        })
});
 
it("Should insert if foreignID does not exist - Control test, works as expected ", function (done) {

    const controlDoc =   testRecordSet.pop();
    const insertDoc =theMqSchema.createTestDocument();
    const testDoc = Object.assign({},controlDoc,insertDoc ); 

    testDoc[uniqueForeignIDPathName] = Math.random() + (new Date()/1);
    theMqSchema.getPathNamesSystem().forEach(pathID=>{
        delete testDoc[pathID];
    })

    theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse=>{ //MonqadeResponse
            expectedInsert( mqResponse)
            done();
    
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError=>{
            done(unknownError);
        })
});
it("Should update non-updatable (isUpdate=false) paths, unfortunate side-effect of upsert  ", function (done) {

    const controlDoc =   testRecordSet.pop();
    const updateDoc =theMqSchema.createTestDocumentWithPathIDs(theMqSchema.getPathNamesNonUpdatable());
    theMqSchema.getPathNamesSystem().forEach(pathID=>{
        delete updateDoc[pathID];
    })

    //    theMqSchema.createTestDocumentForUpdatable();
    const testDoc = Object.assign({},controlDoc,updateDoc ); 
    testDoc[uniqueForeignIDPathName] = controlDoc[uniqueForeignIDPathName];

    
    theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse=>{ //MonqadeResponse
    
            expectedUpdate(controlDoc,mqResponse)
            done();
    
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError=>{
            done(unknownError);
        })
});

it("Should insert non-insertable (isInsertable=false) paths, unfortunate side-effect of upsert ", function (done) {

    //const controlDoc =   testRecordSet.pop();
    const insertDoc =theMqSchema.createTestDocumentWithPathIDs(theMqSchema.getPathNamesNonInsertable());
    const testDoc = Object.assign({},insertDoc ); 

    theMqSchema.getPathNamesSystem().forEach(pathID=>{
        delete testDoc[pathID];
    });
    if(Object.keys(testDoc).length==0){
        skipThisTest.call(this,'No non-insertable paths defined in schema')
    }

    testDoc[uniqueForeignIDPathName] = Math.random() + (new Date()/1);

    theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse=>{ //MonqadeResponse
            expectedInsert( mqResponse)
            done();
    
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError=>{
            done(unknownError);
        })
});

it("Should change document's foreignID. (new foreignID, same mongoDBID's) ", function (done) {
    `
    it('if both unique and system,  use system') 

    systemIDs exist in db.  (new) foreignID unique identify does not exist.
         -> uses systemID to effect change/update (not insert).

    `    
    const controlDoc =   testRecordSet.pop();
    const updateDoc =theMqSchema.createTestDocumentForUpdatable();
    const testDoc = Object.assign({},controlDoc,updateDoc ); 
    testDoc[uniqueForeignIDPathName] = (new Date()/1) + Math.random();

    
    theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse=>{ //MonqadeResponse
    
            expectedUpdate(controlDoc,mqResponse)
            done();
    
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError=>{
            done(unknownError);
        })
});
it("Should update doc if systemID's IS supplied an foreignID NOT supplied ", function (done) {
    `
    it('if no-unique and system,  use system') 

    systemIDs exist in db.   no supplied  foreignID unique identify .
         -> uses systemID to effect change/update (not insert).

    `    
    const controlDoc =   testRecordSet.pop();
    const updateDoc =theMqSchema.createTestDocumentForUpdatable();
    const testDoc = Object.assign({},controlDoc,updateDoc ); 
    delete testDoc[uniqueForeignIDPathName]; // = (new Date()/1) + Math.random();

    
    theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse=>{ //MonqadeResponse
    
            expectedUpdate(controlDoc,mqResponse)
            done();
    
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError=>{
            done(unknownError);
        })
});
it("Should update doc if systemID's NOT supplied but foreignID IS supplied ", function (done) {
    `
    it('if unique and no-system,  use unique') 

    systemIDs exist in db.   no supplied  foreignID unique identify .
         -> uses systemID to effect change/update (not insert).

    `    
    const controlDoc =   testRecordSet.pop();
    const updateDoc =theMqSchema.createTestDocumentForUpdatable();
    const testDoc = Object.assign({},controlDoc,updateDoc ); 
    // delete testDoc[uniqueForeignIDPathName]; // = (new Date()/1) + Math.random();
    theMqSchema.getPathNamesSystem().forEach(pathID=>{
        delete testDoc[pathID];
    })
    testDoc[uniqueForeignIDPathName] =controlDoc[uniqueForeignIDPathName] ;
    
    theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse=>{ //MonqadeResponse
    
            expectedUpdate(controlDoc,mqResponse)
            done();
    
        }).catch(mqError=>{ //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(unknownError=>{
            done(unknownError);
        })
});

it("Should fail if systemID's NOT supplied and foreignID NOT supplied MonqadeError.code='MissingOrInvalidDocumentIDs' ", function (done) {
    `
    effectively -- forcing client code to use foreign key for upsert s
        or rather - if using upsert.  foreignID (path unique=true,) will be required.
    `    
    const controlDoc =   testRecordSet.pop();
    const updateDoc =theMqSchema.createTestDocumentForUpdatable();
    const testDoc = Object.assign({},controlDoc,updateDoc ); 
    // delete testDoc[uniqueForeignIDPathName]; // = (new Date()/1) + Math.random();
    theMqSchema.getPathNamesSystem().forEach(pathID=>{
        delete testDoc[pathID];
    })
    delete testDoc[uniqueForeignIDPathName]; //  =controlDoc[uniqueForeignIDPathName] ;
    
    theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse=>{ //MonqadeResponse
    
            expect(mqResponse).to.be.null;
            done(mqError); 
    
        }).catch(mqError=>{ //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidDocumentIDs',mqError);
            done();

        }).catch(unknownError=>{
            done(unknownError);
        })
});
