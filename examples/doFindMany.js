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
const schemaDefinitions = require('monqade-dev-schemas').sortablePagable;

const mongoose = require('mongoose');
const enviro = require('../environments/env.development')
const MqSchemaSchema = require('../src/index')
const datasetBuilder = require('./dataset-builder.js').datasetBuilder;
const datasetBuilderAsPromised = require('./dataset-builder.js').datasetBuilderAsPromised;



const MonqadeResponseMany = require('monqade-shared').MonqadeResponseMany;
const MonqadeError = require('monqade-shared').MonqadeError;


mongoose.set('useFindAndModify', false); // not a Monqade issue.  Simply tell Mongoose to use MongoDB driver for modifyAndUpdate (mongoose is outdated)

const mqSchema = new MqSchemaSchema(schemaDefinitions.paths,schemaDefinitions.options,mongoose)


function doApp(doAction ='doInsert', theDocument  ) {

    datasetBuilderAsPromised(mqSchema, 25)
    .then(documents => {
        console.log(`created ${documents.length} documents.\n\nThat's all folks`);
        // console.log(`${JSON.stringify(documents[0])}`)
        mqSchema.doFindMany( {constKey: 'MY_FINDABLE_VALUE'},undefined,{sort:{sortFieldOne:-1, sortFieldTwo:1, createdAt:1}} )
        .then(r=>{

            // make sure to add this schema to the repo
            // This works well
            // Take out the 'createdAt' - its ugly 
            // create new expample - pager 
            
            const mqResponse = MonqadeResponseMany.isThisOne(r) ? MonqadeResponseMany.fromResponse(r) : r; 

            mqResponse.documents.forEach(doc=>{
                console.log(`${doc._id} ${doc.sortFieldOne}  ${doc.sortFieldTwo} ${doc.createdAt} `);
            })
            console.log('meta:', mqResponse.meta)
            console.log('appliedQuery:', mqResponse.appliedQuery);
            console.log('records found:', mqResponse.documents.length);
            console.log(`
                Today's example was brought to you by doFindMany - with sort options set
            `)
            closeMongoose();
        }).catch(e => {
            if( MonqadeError.isThisOne(e)){
                const mqError = MonqadeError.fromError(e);
                console.log('Find many error:', mqError);
            }else {
                throw(e);
            }

        });

    }).catch(err => {
        console.log('ERROR: ',err);
    }).finally(()=>{

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
