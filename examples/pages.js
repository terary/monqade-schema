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
const datasetBuilderAsPromised = require('./dataset-builder.js').datasetBuilderAsPromised;



const MonqadeResponseMany = require('monqade-shared').MonqadeResponseMany;
const MonqadeError = require('monqade-shared').MonqadeError;


// mongoose.set('useFindAndModify', false); // not a Monqade issue.  Simply tell Mongoose to use MongoDB driver for modifyAndUpdate (mongoose is outdated)

const mqSchema = new MqSchemaSchema(schemaDefinitions.paths,schemaDefinitions.options,mongoose)

const interpreterUserInput = (line) =>{
    const doCode = line[0].toLowerCase();
    switch(doCode){
        case 'f': 
            jumpToPage(pagerParameters.currentPage + 1 );
            console.log(`Page Forward`);
        break;
        case 'b': 
            jumpToPage(pagerParameters.currentPage - 1 );
            console.log(`Page Backward`);
        break;
        case 's': 
            console.log(`finish`);
        break;
        case 'q': 
            closeMongoose()
            break;
        default:
            if(isNumeric(doCode)) {
                console.log(`Jump to page: ${doCode}`);
                jumpToPage(doCode );
            } else {
                userPrompt();
                console.log(`You want to do ? ${doCode}`)
    
            }
    }
}


const pagerParameters = {   
        findCriteria: {constKey:-1}, 
        totalDocuments:-1,
        pageSize:5,
    };

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});
rl.on('line', interpreterUserInput);

const isNumeric = (n) => {
    const x = isNaN(3)
    return ! isNaN(n);
}

const userPrompt = () => {
    const totalPages = parseInt(pagerParameters['totalDocuments'] /pagerParameters['pageSize']);
    console.log(`
        ${JSON.stringify(pagerParameters)}
        (B)ack (F)orward (S)top (n) skip to page n:( 0 .. ${totalPages} ); 
    `);

}




function doApp() {
    const constKey = (new Date())/1;    
    pagerParameters['findCriteria']['constKey'] =constKey;

    datasetBuilderAsPromised(mqSchema, 23 , constKey)
    .then(newDocs => {
        newDocs.forEach(doc=>{
            console.log(`${doc._id} ${doc.sortFieldOne}  ${doc.sortFieldTwo} ${new Date(doc.createdAt)/1} `);
        })        
        console.log(`${newDocs.length} unsorted documents ---^ `);
        pagerParameters['totalDocuments'] =newDocs.length;
        userPrompt();

    }).catch(err => {
        console.log('ERROR: ',err);
    }).finally(()=>{

    });
}

const jumpToPage = (pageNumber = 0) =>{

    pagerParameters.currentPage = pageNumber;
    const findCriteria = pagerParameters.findCriteria;
    const queryOptions = {
        limit: pagerParameters.pageSize,
        sort:{sortFieldOne:-1, sortFieldTwo:1, createdAt: 1}
    };

    if(pagerParameters['totalDocuments'] > -1 ){
        queryOptions['skip']= pageNumber * pagerParameters.pageSize ;
    }

    mqSchema.doFindMany( findCriteria,undefined,queryOptions)
    .then(r=>{

        const mqResponse = MonqadeResponseMany.isThisOne(r) ? MonqadeResponseMany.fromResponse(r) : r; 
        mqResponse.documents.forEach(doc=>{
            console.log(`${doc._id} ${doc.sortFieldOne}  ${doc.sortFieldTwo} ${doc.createdAt/1} `);
        })

        console.log('meta:', mqResponse.meta)
        console.log('appliedQuery:', mqResponse.appliedQuery);
        console.log('records found:', mqResponse.documents.length);
        userPrompt();
        // closeMongoose();
    }).catch(e => {
        if( MonqadeError.isThisOne(e)){
            const mqError = MonqadeError.fromError(e);
            console.log('Find many error:', mqError);
        }else {
            throw(e);
        }

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
    process.exit();
}
mongoose.connect(enviro.MONGO_CONNECT_STRING, enviro.MONGO_CONNECT_OPTIONS);
