"use strict";
/* cSpell:ignore monqade */

const chai = require("chai");
const expect = chai.expect;

const CommonTestDependencies = require("../common");
const mongoose = CommonTestDependencies.mongoose; 
const resolvedAsExpected = CommonTestDependencies.resolvedAsExpected;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;
// const MonqadeResponse = CommonTestDependencies.MonqadeResponse ;
// const MonqadeError = CommonTestDependencies.MonqadeError ;

// this schema has a path unique restriction which effect the behaviour doUpserOne
const foreignIDSchemaDef = require('monqade-dev-schemas').foreignKeys;

let theMqSchema; //= CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
let testRecordSet;// = CommonTestDependencies.testRecordSet;

const buildDocCollection= (mqSchema,docCollection, count,done)=>{
    const testRecord = mqSchema.createTestDocumentForInsert();
    testRecord['foreign_unique_id'] = count +'.' + (new Date()/1) + '.' + Math.random();
    mqSchema.doInsertOne(testRecord )
        .then(newDoc => {
            // testRecordSetCount++;
            //CommonTestDependencies.testRecordSet.push(newDoc.documents.pop())
            docCollection.push(newDoc.documents.pop());
            if(docCollection.length < count){
                buildDocCollection(mqSchema,docCollection, count,done);
            }else {
                done();
            }
        }).catch(mqError => {
            expect(mqError).to.be.null;
            // expect(MonqadeError.isThisOne(mqError)).to.be.true;
            done(mqError);

        }).catch(otherError => {
            done(otherError);

        });
}



const fidSchema = new CommonTestDependencies.MonqadeSchema(foreignIDSchemaDef.paths,
    foreignIDSchemaDef.options,
    CommonTestDependencies.mongoose);


let uniqueForeignIDPathName = undefined;
`Tests assume there is a a singular foreignID`

// let expectedUpdate= (controlDocument, mqResponse)=>{
//     resolvedAsExpected(mqResponse);
//     const subjectDoc = mqResponse._docs[0];
//     expect(subjectDoc['updatedAt']).not.to.equal(controlDocument['updatedAt'])
//     expect(subjectDoc['_id']).to.equal(controlDocument['_id'])

// }
// let expectedInsert= ( mqResponse)=>{
//     resolvedAsExpected(mqResponse);
//     const subjectDoc = mqResponse._docs[0];
//     expect(subjectDoc['updatedAt']).to.equal(subjectDoc['createdAt'])

// }

describe('Schema with only mongoIDs', ()=>{
    before(function(){
        theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
        testRecordSet = CommonTestDependencies.testRecordSet;
    
    })
    it(`Should resolve as expected when upsert'ing with matching systemPaths - (update) `, (done) => {
        // const testData = testRecordSet.pop();
        const testDoc = Object.assign({}, testRecordSet.pop() ,theMqSchema.createTestDocumentForUpdate())
        theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse => { //MonqadeResponse
            resolvedAsExpected(mqResponse);
            done();
    
        }).catch(mqError => { //MonqadeError
            expect(mqError).to.be.null;
            done(mqError); 

        }).catch(otherError => {
            done(otherError)

        });
    });
    
    it(`Should reject with 'MissingOrInvalidDocumentIDs' when upsert'ing without systemPaths (insert) `, (done) => {
        
        const testDoc =theMqSchema.createTestDocumentForInsert();
        theMqSchema.doUpsertOne(testDoc)
        .then(mqResponse => { //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError => { //MonqadeError
            rejectedWithErrorCode('MissingOrInvalidDocumentIDs',mqError);
            done()
    
        }).catch(otherError => {
            console.log("Caught Other Error:",otherError);
        });
    });

    it("Should reject with 'EmptyCandidateDoc' when attempting to update with empty request (no updatable fields)", function (done) {
        const testRecord =testRecordSet.pop()
    
        Object.keys(testRecord).forEach(pathID=>{
            if(theMqSchema.getPathNamesSystem().indexOf(pathID) == -1 ){
                delete testRecord[pathID]
            }
        })
    
        theMqSchema.doUpsertOne(testRecord)
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
    

    it(`Should reject with 'MongooseOtherError' when attempting to update using unmatched _id, (original error indicates actual error)  `, ( done )=>{
        // const testDoc = theMqSchema.createTestDocumentForInsert();
        const corruptDoc =  testRecordSet.pop();
        const testDoc2 =  testRecordSet.pop();
        corruptDoc['_id'] = testDoc2['_id'];
        theMqSchema.doUpsertOne(corruptDoc)
        .then(mqResponse => { //MonqadeResponse
            expect(mqResponse).to.be.null;
            done();
    
        }).catch(mqError => { //MonqadeError
            rejectedWithErrorCode('MongooseOtherError',mqError);
            expect(mqError._originalError.message).to.contain('duplicate')
            done()
    
        }).catch(otherError => {
            console.log("Caught Other Error:",otherError);
            done()
        })

    });
    it(`Should resolve as expected when upsert'ing new document with client generated  mongodb _id  .
          ( unintended Insert?) 
            With upsert its possible to generate _id and insert.
            This may have unintended consequences (createdAt/updatedAt)

            This maybe desirable for adding children documents
            This maybe undesirable for any other reason?
    
        `, ( done )=>{

        const corruptDoc =  testRecordSet.pop();
        corruptDoc['_id'] =mongoose.Types.ObjectId();// '5c356d3aaa5f8f1022102f2f';
        theMqSchema.doUpsertOne(corruptDoc)
        .then(mqResponse => { //MonqadeResponse
 
            resolvedAsExpected(mqResponse);
            done();
        }).catch(mqError => { //MonqadeError
            expect(mqError).to.be.null    
            done()
    
        }).catch(otherError => {
            console.log("Caught Other Error:",otherError);
            done(otherError)
        })

    });

});
describe('Schema with mongoIDs and some unique foreign id', ()=>{
    const fidDocCollection = [];
    before((done) =>{
        buildDocCollection(fidSchema,fidDocCollection, 25,done);
    })
    it('Should update when *foreignID: matching*, *systemPaths: matching*', (done) => {
        const changeData = fidSchema.createTestDocumentForUpdate();
        const subjectDoc = fidDocCollection.pop();
        const updateDoc = Object.assign({}, changeData, subjectDoc);

        // assure our test is doing what it supposed to be doing.
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            resolvedAsExpected(mqResponse);
            const revisedDoc = mqResponse.documents.pop();
            expect(revisedDoc.createdAt).to.not.equal(revisedDoc.updatedAt);
            done()
        }).catch(mqError => {
            expect(mqError).to.be.null;

        });

    });
    it(`Should reject with 'MongooseOtherError' when *foreignID: matching*, *systemPaths: matching* schema version not matching`, (done) => {
        const updateDoc = fidDocCollection.pop(); 
        updateDoc['_schemaVersion'] = 'wrong_schema_key'
        // assure our test is doing what it supposed to be doing.
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            expect(mqResponse).to.be.null;
            done();
        }).catch(mqError => {
            rejectedWithErrorCode('MongooseOtherError',mqError);
            done();
        }).catch(e=>{
            done(e);
        });

    });
    it(`Should reject with 'MongooseOtherError' when *foreignID: not present *, *systemPaths: matching* schema version not matching`, (done) => {
        const updateDoc = fidDocCollection.pop(); 
        delete updateDoc['foreign_unique_id'] ;
        updateDoc['_schemaVersion'] = 'wrong_schema_key'
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            expect(mqResponse).to.be.null;
            done();
        }).catch(mqError => {
            rejectedWithErrorCode('MongooseOtherError',mqError);
            done();
        }).catch(e=>{
            done(e);
        });
    });

    it(`Should reject with 'MissingOrInvalidDocumentIDs' when *foreignID: match *, *systemPaths: not present* schema version not matching`, (done) => {
        const updateDoc = fidDocCollection.pop(); 
        delete updateDoc['foreign_unique_id'] ;
        fidSchema.getPathNamesSystem().forEach(pathID => {
            delete updateDoc[pathID];
        })
        // assure our test is doing what it supposed to be doing.
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            expect(mqResponse).to.be.null;
            done();
        }).catch(mqError => {
            rejectedWithErrorCode('MissingOrInvalidDocumentIDs',mqError);
            done();
        }).catch(e=>{
            done(e);
        });

    });
    it('Should update when *foreignID: not matching*, *systemPaths: matching* (changes foreignID)  ', (done)=>{
        'If changing foreign ID is undesirable - mark it is isUpdatable=false'
        const changeData = fidSchema.createTestDocumentForUpdate();
        const subjectDoc = fidDocCollection.pop();
        const updateDoc = Object.assign({}, changeData, subjectDoc);
        updateDoc['foreign_unique_id'] = 'new id' + Math.random();
        // assure our test is doing what it supposed to be doing.
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            resolvedAsExpected(mqResponse);
            const revisedDoc = mqResponse.documents.pop();
            expect(revisedDoc.createdAt).to.not.equal(revisedDoc.updatedAt);
            done()
        }).catch(mqError => {
            expect(mqError).to.be.null;
            done();
        });
        
    });
    it(`Should reject with 'MongooseOtherError' *foreignID: matching*, *systemPaths: not matching*  `, (done) => {
        const changeData = fidSchema.createTestDocumentForUpdate();
        const subjectDoc = fidDocCollection.pop();
        const updateDoc = Object.assign({}, changeData, subjectDoc);
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);
        
        updateDoc['_id'] = mongoose.Types.ObjectId()

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            expect(mqResponse).to.be.null;
            done();
        }).catch(mqError => {
            rejectedWithErrorCode('MongooseOtherError',mqError);
            done();
        }).catch(e=>{
            done(e);
        });
    });
    it(`Should insert when  *foreignID: not matching*, *systemPaths: not matching*  `, (done) => {
        const changeData = fidSchema.createTestDocumentForUpdate();
        const subjectDoc = fidDocCollection.pop();
        const updateDoc = Object.assign({}, changeData, subjectDoc);
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);
        
        updateDoc['_id'] = mongoose.Types.ObjectId()
        updateDoc['foreign_unique_id'] = 'new id' + Math.random();

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            resolvedAsExpected(mqResponse);
            const revisedDoc = mqResponse.documents.pop();
            expect(revisedDoc.createdAt).to.equal(revisedDoc.updatedAt);
            done()
        }).catch(mqError => {
            //rejectedWithErrorCode('MongooseOtherError',mqError);
            expect(mqError).to.be.null;
            done(); 
        });

    });
    it.skip(`Should insert when  *foreignID: not set*, *systemPaths: not matching*  `, (done) => {
        `
        First document with null as foreign ID - ok
        subsequent document with null as foreign ID - error condition
        `
        const changeData = fidSchema.createTestDocumentForUpdate();
        const subjectDoc = fidDocCollection.pop();
        const updateDoc = Object.assign({}, changeData, subjectDoc);
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);
        
        updateDoc['_id'] = mongoose.Types.ObjectId()
        delete updateDoc['foreign_unique_id'];

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            resolvedAsExpected(mqResponse);
            const revisedDoc = mqResponse.documents.pop();
            expect(revisedDoc.createdAt).to.equal(revisedDoc.updatedAt);
            done()
        }).catch(mqError => {
            rejectedWithErrorCode('MongooseOtherError',mqError);

            // expect(mqError).to.be.null;
            done();
        }).catch(e=>{
            done(e);
        });

    });


    it('Should update when *foreignID: matching*,  *systemPaths: not set*  ', (done) => { 
        const changeData = fidSchema.createTestDocumentForUpdate();
        const subjectDoc = fidDocCollection.pop();
        const updateDoc = Object.assign({}, changeData, subjectDoc);

        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);
        fidSchema.getPathNamesSystem().forEach(pathID=>{
            delete updateDoc[pathID]
        });

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            resolvedAsExpected(mqResponse);
            const revisedDoc = mqResponse.documents.pop();
            expect(revisedDoc.createdAt).to.not.equal(revisedDoc.updatedAt);
            done()
        }).catch(mqError => {
            expect(mqError).to.be.null;
            done();
        });
    });
    it('Should update when  *foreignID: not set*, *systemPaths:matching*', (done )=> {
        const changeData = fidSchema.createTestDocumentForUpdate();
        const subjectDoc = fidDocCollection.pop();
        const updateDoc = Object.assign({}, changeData, subjectDoc);
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);
        delete updateDoc['foreign_unique_id'];
        
        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            resolvedAsExpected(mqResponse);
            const revisedDoc = mqResponse.documents.pop();
            expect(revisedDoc.createdAt).to.not.equal(revisedDoc.updatedAt);
            done()
        }).catch(mqError => {
            expect(mqError).to.be.null;
            done();
        });
    });
    it(`Should reject with 'MissingOrInvalidDocumentIDs' when  *foreignID: not present*  *systemPaths: not present*`, (done) => {
        const changeData = fidSchema.createTestDocumentForUpdate();
        const subjectDoc = fidDocCollection.pop();
        const updateDoc = Object.assign({}, changeData, subjectDoc);
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);
        fidSchema.getPathNamesSystem().forEach(pathID=>{
            delete updateDoc[pathID]
        });
        delete updateDoc['foreign_unique_id'];

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            expect(mqResponse).to.be.null;
            done();
        }).catch(mqError => {
            rejectedWithErrorCode('MissingOrInvalidDocumentIDs',mqError);
            done();
        });
    });

    it(`Should insert when *foreignID: not matching*  *systemPaths: not present*`, (done) => {

        const updateDoc = Object.assign({}, fidDocCollection.pop());
        expect(updateDoc.createdAt).to.equal(updateDoc.updatedAt);
        fidSchema.getPathNamesSystem().forEach(pathID=>{
            delete updateDoc[pathID]
        });
        updateDoc['foreign_unique_id'] = 'some new key' + Math.random();

        fidSchema.doUpsertOne( updateDoc)
        .then(mqResponse => {
            resolvedAsExpected(mqResponse);
            const revisedDoc = mqResponse.documents.pop();
            expect(revisedDoc.createdAt).to.equal(revisedDoc.updatedAt);
            done()
        }).catch(mqError => {
            expect(mqError).to.be.null;
            done();
        });
    });
});
