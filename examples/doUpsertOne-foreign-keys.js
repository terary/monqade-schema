"use strict";

const fidSchemaDef = require('monqade-dev-schemas').foreignKeys ;


// const theDocs = [];

const insertTestRecords= (mqSchema,docCollection = [], count,done)=>{
    const testRecord = mqSchema.createTestDocumentForInsert();
    testRecord['foreign_unique_id'] = (new Date()/1) + '.' + Math.random();
    mqSchema.doInsertOne(testRecord )
        .then(newDoc=>{
            // testRecordSetCount++;
            //CommonTestDependencies.testRecordSet.push(newDoc.documents.pop())
            docCollection.push(newDoc.documents.pop());
            if(docCollection.length < count){
                insertTestRecords(mqSchema,docCollection, count,done);
            }else {
                done(docCollection);
            }
        }).catch(mqError=>{
            if( mqError.constructor.name !== 'MonqadeError' ){
                throw(mqError);
            }
            done(mqError);
            console.log("Caught MonqadeError", mqError);
        }).catch(otherError=>{
            console.log("Caught other error", otherError);
            done(otherError);
        });
}

//'5d2a76703054440212447944'

const mongoose = require('mongoose');
const enviro = require('../environments/env.development')

const  MqSchemaSchema = require('../src/index')


mongoose.connection.on("open", function(ref) {
    console.log("Connected to mongo server.");
    return doApp();
});
  
mongoose.connection.on("error", function(err) {
    console.log("Could not connect to mongo server!");
    return console.log(err);
});

const closeMongoose = ()=>{
    console.log('Closing Mongoose connection');
    mongoose.connection.close();
}



mongoose.connect(enviro.MONGO_CONNECT_STRING, enviro.MONGO_CONNECT_OPTIONS);


function doApp() {
    const childSchema = new MqSchemaSchema(fidSchemaDef.paths,fidSchemaDef.options,mongoose)

    insertTestRecords(childSchema,[], 25,(documents)=>{

        console.log(`Have ${documents.length} documents`);
        const upsertUpdateDocument = documents.pop();
        childSchema.getPathNamesSystem().forEach(pid=>{
            delete upsertUpdateDocument[pid];
        });

        childSchema.doUpsertOne(upsertUpdateDocument)
        .then(mqResponse=> {
            console.log(`
                Update *with* the unique foreignID and *without* system paths yields an 'update'
                createdAt ${mqResponse.documents[0].createdAt}, updatedAt ${mqResponse.documents[0].updatedAt}
                ${JSON.stringify(mqResponse.documents[0])}
            `);
        }).catch(e=>{
            console.log('Failed to do UpsertUpdate',e);
        });
        
        const upsertUpdate2Document = documents.pop();
        delete upsertUpdate2Document['foreign_unique_id'];

        childSchema.doUpsertOne(upsertUpdate2Document)
        .then(mqResponse=> {
            console.log(`
                Update *without* the unique foreignID and *with* system paths yields an 'update'
                createdAt ${mqResponse.documents[0].createdAt}, updatedAt ${mqResponse.documents[0].updatedAt}
                ${JSON.stringify(mqResponse.documents[0])}
            `);
            // 
        }).catch(e=>{
            console.log('Failed to do UpsertUpdate 2',e);
        });

        const upsertInsertDocument = documents.pop();
        delete upsertInsertDocument['foreign_unique_id'];
        childSchema.getPathNamesSystem().forEach(pid=>{
            delete upsertInsertDocument[pid];
        });

        childSchema.doUpsertOne(upsertInsertDocument)
        .then(mqResponse=> {
            console.log('Should not happen', mqResponse)
        }).catch(mqError=>{
            console.log(`
                Update *without* the unique foreignID and *without* system paths yields an 'update'
                creates an error: ${mqError.name}
                *** Simply will not *insert* or *update*  without unique identifier
            `);
        });
            
        const upsert1doc = documents.pop();
        const upsert2doc = documents.pop();
        upsert1doc['foreign_unique_id'] = upsert2doc['foreign_unique_id'];

        childSchema.doUpsertOne(upsert1doc)
        .then(mqResponse=> {
            console.log('Should not happen', mqResponse)
        }).catch(mqError=>{
            console.log(`
                Update with mismatch foreign ID with mongo ID yeilds an error
                creates an error: ${mqError.name}
                *** Simply will not *insert* or *update*  without unique identifier
            `);
        });
    });

}
