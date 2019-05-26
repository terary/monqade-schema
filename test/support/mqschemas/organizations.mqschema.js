"use strict"
const md5 = require('md5')
const ObjectId='ObjectId'; // calling code will need to replace
                           // because 'common' file location unable to load mongoose within this file
const randomElement = (ary)=>{
 return ary[Math.floor(Math.random() * ary.length)];
}


module.exports = {
  paths:{
    orgID: {
      name: "orgID",
      isSearchable:true,
      isProjectable: false,
      isUpdatable: false,
      isInsertable: true,
      isRequired: true ,
      required:true,
      type: "String",
      makeTestData: ()=>{return 'OrgID:' + Math.random()},
      notes: {
        "purpose": "This field is used for: ...",
        "restriction": "max length, min value, explaination of validate "
      },
      maxlength: 50,
      minlength: 3
    },
    companyName: {
      name: "companyName",
      isSearchable: true,
      isProjectable: true,
      isUpdatable: true,
      isInsertable: true,
      isRequired: true,
      type: "String",
      makeTestData: ()=>{return 'The ABC Co.' + Math.random();},
      notes: {
        "purpose": "This field is used for: ...",
        "restriction": "max length, min value, explaination of validate "
      },
      maxlength: 50,
      minlength: 3
    },
    city: {
      name: "city",
      isSearchable: true,
      isProjectable: true,
      isUpdatable: true,
      isInsertable: true,
      isRequired: false,
      type: "String",
      makeTestData: ()=>{return 'Lewiston ' + Math.random();},
      notes: {
        "purpose": "Instead of 'delete' deactive",
        "restriction": "true or false"
      },
      maxlength: 100,
      minlength: 2
    },
    "state": {
      name: "state",
      isSearchable: true,
      isProjectable: true,
      isUpdatable: false,
      isInsertable: true,
      isRequired: false,
      type: "String",
      makeTestData: ()=>{return randomElement(['ME','CA','NE','LA','NY','MN','TX','CO','OR','FL','NC','UT','NV','WA','OH'])},
      notes: {
        "purpose": "Instead of 'delete' deactive",
        "restriction": "true or false"
      },
      maxlength: 2,
      minlength: 2
    },
    foreignID: {
      name: "foreignID",
      isSearchable: true,
      isProjectable: true,
      isUpdatable: true,
      isInsertable: true,
      isRequired: true,
      unique:true,
      type: "String",
      makeTestData: ()=>{return (new Date()/1) + Math.random() ;},
      //makeTestData: ()=>{return  ;},
      notes: {
        "purpose": "This field is used for: ...",
        "restriction": "max length, min value, explaination of validate "
      },
      maxlength: 50,
      minlength: 3
    },

    webSite: {
      name: "webSite",
      isSearchable: true,
      isProjectable: true,
      isUpdatable: true,
      isInsertable: true,
      isRequired: true,
      type: "String",
      makeTestData: ()=>{return 'www.example' + Math.random() + '.com';},
      notes: {
        "purpose": "This field is used for: ...",
        "restriction": "max length, min value, explaination of validate "
      },
      maxlength: 50,
      minlength: 3
    },
    authKey: {
      name: "authKey",
      isSearchable: false,
      isProjectable: false,
      isUpdatable: true,
      isInsertable: true,
      isRequired: true,
      type: "String",
      makeTestData: ()=>{return md5( Math.random());},
      notes: {
        "purpose": "This field is used for: ...",
        "restriction": "max length, min value, explaination of validate "
      },
      maxlength: 50,
      minlength: 3
    },
    yearsInBusiness: {
      name: "yearsInBusiness",
      isSearchable: false,
      isProjectable: false,
      isUpdatable: true,
      isInsertable: true,
      isRequired: false,
      type: "Number",
      makeTestData: ()=>{return Math.floor(200 * Math.random())},
      notes: {
        "purpose": "Instead of 'delete' deactive",
        "restriction": "true or false"
      },
      "max": 300
    },
    memberSinceDate: {
      name: "memberSinceDate",
      isSearchable: true,
      isProjectable: false,
      isUpdatable: false,
      isInsertable: false,
      isRequired: true,
      default: ()=>{return new Date()},
      type: "Date",
      makeTestData: ()=>{return new Date()},
      notes: {
        "purpose": "Instead of 'delete' deactive",
        "restriction": "true or false"
      }
    },
    isActive: {
      name: "isActive",
      isSearchable: true,
      isProjectable: true,
      isUpdatable: true,
      isInsertable: true,
      isRequired: true,
      type: "Boolean",
      makeTestData: ()=>{return (Math.random()<0.5) ? true : false;},
      notes: {
        "purpose": "Instead of 'delete' deactive",
        "restriction": "true or false"
      }
    }
  
  },
  systemPaths:{},
  
  
  options:
    {
      documentation:`some document stuff goes here`,
      collection: 'organizations',
      timestamps:true,
      writeConcern:{ w: 1, j: false},
      versionKey: '_docVersionKey', 
      _schemaVersionKey:'0001'
    }
  };


  