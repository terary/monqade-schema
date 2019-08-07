/* cSpell:ignore monqade */

const ENV = require('../environments')
const chai = require("chai");
const expect = chai.expect;

// const MonqadeQueryBuilder = require('monqade-query-builder');


// const MonqadeShared = require('monqade-shared'); 
const MonqadeShared = require('monqade-shared'); 
const MonqadeError = MonqadeShared.MonqadeError;
const MonqadeResponseSearch = MonqadeShared.MonqadeResponseSearch;
const MonqadeResponse = MonqadeShared.MonqadeResponse; 
const LAMBDAS = MonqadeShared.LAMBDAS; 

//const mongoose = require('mongoose');

//mongoose.set('useFindAndModify', false);  // using findOneAndUpdate - cause an warning
                                          // ' do not use: useFindAndModify' not using anyway
                                          // this silences that warning.. More research
                                          // necessary but it a appears the warning is an a
                                          // non-issue  overlooked by mongoose dev. team.


const CommonTestDependencies = {

    // will be used by most files involved in tested 
    // will just require them here
    MonqadeSchema: require('../src/index'), // this package
    mongoose: require('mongoose'),  // reference to mongoos 
    schemaDefinition : require('monqade-dev-schemas').chaos,  // our testing schema definition
    MonqadeQueryBuilder: require('monqade-query-builder'), // assists in building more complex queries.  Deprecated now. 

    //used within this file to define other functions
    // hence can't be required here
    MonqadeError: MonqadeError,
    MonqadeResponse: MonqadeResponse,
    MonqadeResponseSearch: MonqadeResponseSearch,
    LAMBDAS: LAMBDAS, // commonly used pure functions 


    MONGO_CONNECT_STRING: ENV.MONGO_CONNECT_STRING,
    MONGO_CONNECT_OPTIONS: ENV.MONGO_CONNECT_OPTIONS,

    // control.test.js will use before() and after() for set-up and tear-down
    // these will be handled there- but require project/test scoping so declared here
    testRecordSet: [], // to be populated in controller
    theMqSchema: null,  // to be instantiated after mongoose connection 


}
CommonTestDependencies.schemaDefinition.options._schemaVersion='001';
console.log('Chaos schema does not set this, intentionally. Now need to set it or 1 test fails.  Further investigation required')



// commonly used test outcome
CommonTestDependencies.resolvedAsExpected = (mqResponse) =>{
    expect(mqResponse).to.be.an.instanceof(MonqadeResponse);
    expect(mqResponse.documents.length, `documents should be one. returned ${mqResponse.documents.length}`).to.equal(1 );// . equal(1);
}

// commonly used test outcome
CommonTestDependencies.rejectedWithErrorCode = (errorCode, mqError)=>{
    // most test will reject with known MonqadeError.errorCode
    expect(mqError).to.not.be.null;
    if( ! MonqadeError.isThisOne(mqError)){
        throw(mqError);
    }
    expect(mqError).to.be.an.instanceof(MonqadeError);
    expect(mqError.code).to.eq(errorCode);  
}

// commonly used test outcome
CommonTestDependencies.skipThisTest= function( message){
    this.test.title =  message+' ' + this.test.title;  
    this.skip();
}


// to create test data - populate mongodb collection
const buildDocCollection= (mqSchema,docCollection, count,done)=>{
    const testRecord = mqSchema.createTestDocumentForInsert();
    mqSchema.doInsertOne(testRecord )
        .then(newDoc=>{
            // testRecordSetCount++;
            //CommonTestDependencies.testRecordSet.push(newDoc.documents.pop())
            docCollection.push(newDoc.documents.pop());
            if(docCollection.length < count){
                buildDocCollection(mqSchema,docCollection, count,done);
            }else {
                done();
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
//Seems that it needs to be defined and assigned this way, some sort of scoping issue. 
CommonTestDependencies.buildDocCollection = buildDocCollection; 
module.exports = CommonTestDependencies;
