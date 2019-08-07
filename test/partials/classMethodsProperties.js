/* cSpell:ignore monqade */

"use strict";
const chai = require("chai");
const expect = chai.expect;

const  CommonTestDependencies = require("../common");
const MonqadeResponse = CommonTestDependencies.MonqadeResponse;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;


let theMqSchema, testRecordSet;
before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;
})



describe(`getPathNames[<property>]`, () => {
    ['getPathNamesNonSearchable', 'getPathNamesNonUpdatable', 'getPathNamesNonInsertable',
    'getPathNamesNonProjectable', 'getPathNamesSystem', 'getPathNamesRequired',
    'getPathNamesInsertable', 'getPathNamesUpdatable', 'getPathNamesSearchable',
    'getPathNamesProjectable', 'getPathNamesUniqueOption', 'getPathNamesAll',
    'getPathNamesNonRequired'].forEach(func=>{
        it(`${func} should return an array of path names`, function () {
            expect(theMqSchema[func]()).to.be.an('array');
        });
    
    });
    
})

describe(`_inflateProjection(thingy)`,()=>{
    it('Should return an empty object for any arguments not array or object', () =>{
        expect(theMqSchema._inflateProjection('not a thingy')).to.deep.equal({});
    })
    it('Should return an object in the form {pathIDb:1, pathIDa:1, ...} for arguments of an array type', () =>{
        expect(theMqSchema._inflateProjection(theMqSchema.getPathNamesProjectable())).to.be.an('object');
    })
    it('should return an object in the form {pathIDb:1, pathIDa:1, ...} for arguments of an object type', () =>{
        expect(theMqSchema._inflateProjection({path:1})).to.be.an('object');
    })
});
describe(`Schema specific properties. Testing to satisfy coverage reports`, ()=>{
    describe(`.schemaVersion`, ()=>{
        it('Should never be undefined', ()=>{
            expect(theMqSchema.schemaVersion).to.not.be.undefined;
        });
    })
    
    describe(`.collectionName`, ()=>{
        it('Should never be undefined', ()=>{
            expect(theMqSchema.collectionName).to.not.be.undefined;
        });
    })
    describe(`.schemaDocumentation`, ()=>{
        it('Should never be undefined', ()=>{
            expect(theMqSchema.schemaDocumentation).to.not.be.undefined;
        });
    })
    describe(`.schemaDocumentation`, ()=>{
        it('Should always return an array ', ()=>{
            expect(theMqSchema.getPathNamesQuery()).to.be.an('array');
        });
    })
    describe(`._sanitizeProjection`, ()=>{
        it('Should always return an object ', ()=>{
            expect(theMqSchema._sanitizeProjection()).to.be.an('object');
        });
    })
    
    
})
