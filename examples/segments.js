"use strict";

console.log(`
    This is likely an example of how *not* to do it.

    It appears Mongo find(...,{sort:{...}})  
        A) Get result
        B) Sort results.
    ** NOT THE SAME AS TSQL: SELECT TOP 3 ... ORDER BY ...
    ** NOT THE SAME AS MySQL: SELECT ... ORDER BY ... LIMIT n

    The difference is the MySQL/MSSQL
        A) SORT
        B) get results 

   hence - paging will be out of order if sorting. If not sorting - all will be honky-dory

    comment-out 'process.exit();' to see an example

    I think this method will work - if change search criteria to gte the last record's values
    another issue that may arise is how mongo will interpreter $gte:'alpha', upper case, b<A, b<B, a>b ?
    
    a few more band-aids and it may work. OR.... 
    just add readOnly nodes as needed go with skip/limit and/or aggregate

    `);
process.exit();

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
            navPages('f' );
            console.log(`Page Forward`);
        break;
        case 'b': 
            navPages('b' );
            console.log(`Page Backward`);
        break;
        case 's': 
            console.log(`finish`);
        break;
        case 'a': 
            navPages('a' );
            console.log(`all`);
        break;
        case 'q': 
            closeMongoose()
            break;
        default:
            if(isNumeric(doCode)) {
                console.log(`Jump to page: ${doCode}`);
                navPages(doCode );
            } else {
                userPrompt();
                console.log(`You want to do ? ${doCode}`)
            }
    }
}

const tomorrow = () => {
    const x = new Date()
    x.setSeconds(x.getSeconds() + 86400);
    return x;
}
const pagerParameters = {   
        findCriteria: {constKey:-1}, 

        firstCreatedAt: new Date(0),
        lastCreatedAt: tomorrow(),

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


const navPages = (forwardBackward ) =>{

    const queryOptions = {
        limit: pagerParameters.pageSize,
        sort:{sortFieldOne:-1, sortFieldTwo:1, createdAt: 1}
    };
    //let findCriteria = Object({},pagerParameters.findCriteria);
    let  findCriteria={$and:[Object.assign({},pagerParameters.findCriteria)]} 

    if(forwardBackward=='a'){
        delete queryOptions['limit']; 
    } else if(forwardBackward=='f'){
        findCriteria['$and'].push({createdAt:{$gte:pagerParameters.lastCreatedAt}})

    }else if (forwardBackward=='b') {
        findCriteria['$and'].push({createdAt:{$lte:pagerParameters.firstCreatedAt}})

    } else { // initialization - first pass 
        findCriteria['$and'].push({createdAt:{$gte:pagerParameters.firstCreatedAt}})
        findCriteria['$and'].push({createdAt:{$lte:pagerParameters.lastCreatedAt}})
    }

    console.log(JSON.stringify(findCriteria));
    const qb = {
        termCount: () => Object.keys(findCriteria), 
        toFindObject:function(){ return findCriteria;}
    };

    mqSchema.doQueryMany( qb,undefined,queryOptions)
    .then(r=>{

        const mqResponse = MonqadeResponseMany.isThisOne(r) ? MonqadeResponseMany.fromResponse(r) : r; 
        const documents = mqResponse.documents;

        documents.forEach(doc=>{
            console.log(`${doc._id} ${doc.sortFieldOne}  ${doc.sortFieldTwo} ${doc.createdAt/1} `);
        })
        if( documents.length>0){
            pagerParameters.lastCreatedAt = documents[documents.length - 1 ].createdAt;
            pagerParameters.firstCreatedAt = documents[0].createdAt;
        }

        console.log('meta:', mqResponse.meta)
        console.log('appliedQuery:', JSON.stringify(mqResponse.appliedQuery));
        console.log('records found:', documents.length);
        console.log('query options:', queryOptions);
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
