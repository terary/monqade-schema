
const ENV = require('../environments')
const chai = require("chai");
const expect = chai.expect;

const MonqadeQueryBuilder = require('monqade-query-builder');

const MonqadeSchemaWithPathAdapter = require('../').MonqadeSchemaWithPathAdapter;

const MonqadeShared = require('../src/monqade-shared.js'); 
const MonqadeError = MonqadeShared.MonqadeError;
const MonqadeResponseSearch = MonqadeShared.MonqadeResponseSearch;
const MonqadeResponse = MonqadeShared.MonqadeResponse; 




const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);  // using findOneAndUpdate - cause an warning
                                          // ' do not use: useFindAndModify' not using anyway
                                          // this silences that warning.. More research
                                          // necessary but it a appears the warning is an a
                                          // non-issue  overlooked by mongoose dev. team.


const CommonTestDependencies = {}

// 
CommonTestDependencies.testRecordSet = [] ; // to be filled in controller - or relocate to here?

//MqSchema Instance
CommonTestDependencies.theMqSchema = {};  // to be instantiated after mongoose connection 

//MqSchema Class
// CommonTestDependencies.MonqadeSchemaWithPathAdapter =MonqadeSchemaWithPathAdapter ;
CommonTestDependencies.MonqadeSchemaWithPathAdapter = require('../src/index'); // MonqadeSchemaWithPathAdapter ;
console.log(` phasing out 'MonqadeSchemaWithPathAdapter' it's become the default/only export  but alias as 'MonqadeSchema' `)
// userSchema = new CommonTestDependencies.MonqadeSchemaWithPathAdapter(schemaDefinition.paths,
//     schemaDefinition.options,
//     mongoose);
//     const  MqSchemaSchema = require('../src/index')


//MqSchema definition - to be 'compiled' into an instance
//CommonTestDependencies.schemaDefinition = MonqadeShared.schemaDefinitions.users;
CommonTestDependencies.schemaDefinition = MonqadeShared.schemaDefinitions.organizations;

// commonly used MqTypes - 
CommonTestDependencies.MonqadeError = MonqadeError;
CommonTestDependencies.MonqadeResponse = MonqadeResponse;
CommonTestDependencies.MonqadeResponseSearch = MonqadeResponseSearch;

//misc. others 
// CommonTestDependencies.enviro =enviro;
CommonTestDependencies.mongoose = mongoose;
CommonTestDependencies.LAMBDAS = MonqadeShared.LAMBDAS;
CommonTestDependencies.MonqadeQueryBuilder = MonqadeQueryBuilder;
CommonTestDependencies.MONGO_CONNECT_STRING = ENV.MONGO_CONNECT_STRING; 
CommonTestDependencies.MONGO_CONNECT_OPTIONS = ENV.MONGO_CONNECT_OPTIONS; 


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


exports.CommonTestDependencies = CommonTestDependencies;
