"use strict";
/**
 * https://docs.mongodb.com/manual/reference/command/find/
 * Mongo calls the sort argument a 'document'. No doubt it's aware that the order of the keys within the document is significant.
 * Monqade will loosely rely on Javascript's key ordering by string type + chronological order
 * 
 * 
 * See also: https://docs.mongodb.com/manual/reference/command/find/  (max, min, batch size ) -- maybe a better way to 'page'
 * 
 * One area of concern - if depending on chronological order - what happens when serializing objects send accross the wire
 * and deserialize object - ?? will order be guaranteed? 
 * 
 */


// const schemaDefinitions = require('./sortedpagable.mqschema');
const parentSchemaDef = require('monqade-dev-schemas').parent;
const childSchemaDef = require('monqade-dev-schemas').child;
const ObjectId = require('mongoose').Types.ObjectId

const mongoose = require('mongoose');
const enviro = require('../environments/env.development')
const MqSchemaSchema = require('../src/index')
const MonqadeResponseMany = require('monqade-shared').MonqadeResponseMany;
const MonqadeError = require('monqade-shared').MonqadeError;
// const datasetBuilder = require('./dataset-builder.js').datasetBuilder;
// const datasetBuilderAsPromised = require('./dataset-builder.js').datasetBuilderAsPromised;
// mongoose.set('useFindAndModify', false); // not a Monqade issue.  Simply tell Mongoose to use MongoDB driver for modifyAndUpdate (mongoose is outdated)

const pSchema = new MqSchemaSchema(parentSchemaDef.paths, parentSchemaDef.options, mongoose)
const cSchema = new MqSchemaSchema(childSchemaDef.paths, childSchemaDef.options, mongoose)

const findManyChildren = (parentID, next = closeMongoose) => {
    console.log("\ndoFindMany");

    const findCriteria ={theParentDocument: parentID} 
    cSchema.doFindMany(findCriteria)
    .then( mqResponse =>{
        console.log( `\tdoFindMany Found ${mqResponse.documents.length} children with a parent ID: '${parentID}'`);
        console.log('\tusing query:', mqResponse._appliedQuery)
    }).catch( mqError => {
        console.log('doFindMany had an error:', mqError)
    }).finally(()=>{
        next(parentID);
    });
}
const queryManyChildren = (parentID, next= closeMongoose) => {
    console.log("\ndoQueryMany");

    const findCriteria ={theParentDocument:{$eq: parentID}};
    cSchema.doQueryMany(findCriteria)
    .then( mqResponse =>{
        console.log( `\tdoQueryMany Found ${mqResponse.documents.length} children with a parent ID: '${parentID}'`);
        console.log('\tusing query:', mqResponse._appliedQuery)
    }).catch( mqError => {
        console.log('doQueryMany had an error:', mqError)
    }).finally(()=>{
        next(parentID);
    });
}


function doApp(doAction ='doInsert', theDocument  ) {
    const pCandidateDoc = pSchema.createTestDocumentForInsert();
    pSchema.doInsertOne(pCandidateDoc)
    .then(mqResponse => {
        const pDoc =mqResponse.documents.pop();
        const pID = pDoc['_id'];
        const children = [];

        children.push(cSchema.createTestDocumentForInsert());
        children.push(cSchema.createTestDocumentForInsert());
        children.push(cSchema.createTestDocumentForInsert());
    
        console.log(`\nInserting children using parent ID: ${pID} `) 
        
        Promise.all(children.map(c=>{c['theParentDocument'] = pID; return cSchema.doInsertOne(c) }))
        .then(r=>{
            r.forEach(mqResponse=>{
                const newDoc = mqResponse.documents[0]; 
                console.log(`\tInserted: child:parent: ${newDoc['_id']}:${newDoc['theParentDocument']}`);
            });
            findManyChildren(pID,queryManyChildren);
        }).catch(e=>{
            console.log("Children insert error",e);
            closeMongoose();
        })

    }).catch(mqError=> {
        console.log('Parent Error:', mqError);
        closeMongoose();
    });
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
