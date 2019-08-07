"use strict";

const schemaDefinitions = require('monqade-dev-schemas').chaos;
// const schemaDefinitions = require('/mypart/tmc/my-node-modules/monqade/monqade-dev-schemas/schemas/chaos.mqschema.js');

const mongoose = require('mongoose');
//const enviro = require('../environments/env.development')
const enviro = require('../environments/')
const MqSchemaSchema = require('../src/index')

const MonqadeResponse = require('monqade-shared').MonqadeResponse;
const MonqadeError = require('monqade-shared').MonqadeError;

/// -------------
// const MonqadeShared = require('./monqade-shared.js'); 
// //const MonqadeError = MonqadeShared.MonqadeError;
// const MonqadeResponse = MonqadeShared.MonqadeResponse; 

/// ----------------
//mongoose.set('useFindAndModify', false); // not a Monqade issue.  Simply tell Mongoose to use MongoDB driver for modifyAndUpdate (mongoose is outdated)

const userSchema = new MqSchemaSchema(schemaDefinitions.paths,schemaDefinitions.options,mongoose)


function doApp(doAction ='doInsert', theDocument  ) {

    switch(doAction){
        case 'doInsert':
            const theInsertDocument =  userSchema.createTestDocumentForInsert();
            userSchema.doInsertOne(theInsertDocument)
            .then(mqResponse => { //MonqadeResponse type
                const subjDocument = mqResponse.documents[0];
                console.log(`\ndoInsertOne Completed - 
                    Inserted document with ID: ${subjDocument._id}
                    createdAt: ${subjDocument.createdAt}, updatedAt ${subjDocument.updatedAt} 
                `);
                doApp('doFindOne', mqResponse.documents[0]) ; 
            }).catch(mqError=>{ //MonqadeErro
                console.log('mqError',mqError); 
                closeMongoose();
        
            });
        break;
        case 'doFindOne':
            userSchema.doFindOne(theDocument)
            .then(mqResponse => { //MonqadeResponse type
                const subjDocument = mqResponse.documents[0];
                console.log(`\ndoFindOne Completed - 
                    Found document with ID: ${subjDocument._id}
                    createdAt: ${subjDocument.createdAt}, updatedAt ${subjDocument.updatedAt} 
                `);

                doApp('doUpdateOne', mqResponse.documents[0]) ; 
            }).catch(mqError=>{ //MonqadeErro
                console.log('mqError',mqError); 
                closeMongoose();
            });
        break;
        case 'doUpdateOne':
            const theUpdates =  userSchema.createTestDocumentForUpdate(); // contains no system paths 
            const theUpdateDocument = Object.assign({}, theDocument, theUpdates); // making this a safe operation
            userSchema.doUpdateOne(theUpdateDocument)
            .then(mqResponse => { //MonqadeResponse type
                const subjDocument = mqResponse.documents[0];
                console.log(`\ndoUpdateOne Completed - 
                    Updated document with ID: ${subjDocument._id}
                    createdAt: ${subjDocument.createdAt}, updatedAt ${subjDocument.updatedAt} 
                `)            
                doApp('doUpsertUpdate', subjDocument) ; 
            }).catch(mqError=>{ //MonqadeErro
                console.log('mqError',mqError); 
                closeMongoose();
            });
        break;        
        case 'doUpsertUpdate':
            // upsertInsert and upsertUpdate both call 'upsert'.
            // - design premise if document is systemPaths its an update.  As such demonstrate both operations
            const theUpsertUpdates =  userSchema.createTestDocumentForUpdate(); // contains no system paths 
            const theUpsertDocument = Object.assign({}, theDocument, theUpsertUpdates); // making this a safe operation
            userSchema.doUpsertOne(theUpsertDocument)
            .then( r => { //MonqadeResponse type
                const mqResponse = MonqadeResponse.fromResponse(r);
                const subjDocument = mqResponse.documents[0];
                console.log(`\ndoUpsertOne (for update) Completed - 
                    Updated document with ID: ${subjDocument._id}
                    createdAt: ${subjDocument.createdAt}, updatedAt ${subjDocument.updatedAt}
                `);            
                doApp('doDeleteOne', subjDocument) ; 
            }).catch(mqError=>{ //MonqadeErro
                console.log('mqError',mqError); 
                closeMongoose();
            });
        break;
        case 'doDeleteOne' :

            userSchema.doDeleteOne(theDocument)
            .then( r => { //MonqadeResponse type
                const mqResponse = MonqadeResponse.fromResponse(r);
                console.log(`\ndoDeleteOne Completed  - no returned document.
                    Response: ${JSON.stringify(r)}
                    need to check meta for  ok=1 or deletedCount==1 - for confirmation.
                `) 
                doApp('doUpsertInsert') ; 
            }).catch(mqError=>{ //MonqadeErro
                console.log('mqError',mqError); 
                closeMongoose();
            });

        break;
        case 'doUpsertInsert':
            const theUpsertInsertDocument =  userSchema.createTestDocumentForInsert();

            userSchema.doUpsertOne(theUpsertInsertDocument)
            .then(mqResponse => { //MonqadeResponse type
            }).catch(e=>{ //MonqadeErro
                
                const mqError = MonqadeError.fromError(e);
                ;
                console.log(`\ndoUpsertOne (Insert) Completed
                    Monqade requires uniqueIndex defined in schema for upsert/Insert
                    This operation completed expectedly with errorCode: ${mqError.code}
                    and message: "${mqError.message}"
                    `); 

                closeMongoose();
            });
        break;        

    }

}


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
