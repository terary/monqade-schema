const common = require("../common");
const chai = require("chai");
expect = chai.expect;

const CommonTestDependencies = require("../common").CommonTestDependencies;
const MonqadeResponseSearch = CommonTestDependencies.MonqadeResponseSearch;
const MonqadeError = CommonTestDependencies.MonqadeError; 

// const MonqadeResponseSearch = common.MonqadeResponseSearch;
// const MonqadeError = common.MonqadeError; 
// const MonqadeQueryBuilder = common.MonqadeQueryBuilder;

const limitOverride = {}; // 
const useDefaultProjection = undefined;  //function sets to default if undefined.

const resolvedManyAsExpected = (mqResponse) =>{
    expect(mqResponse).to.be.an.instanceof(MonqadeResponseSearch);
    expect(mqResponse.documents).to.be.an('array')
}

const rejectedWithErrorCode = (errorCode, mqError)=>{
    expect(mqError).to.not.be.null;
    if( ! MonqadeError.isThisOne(mqError)){
        throw(mqError);
    }
    // expect(mqError).to.be.an.instanceof(MonqadeError);
    expect(mqError.code).to.eq(errorCode);  
}

it.skip("Expect of all paths from file to equal all paths minus(schemaVersionKey + systemPaths + __v ) ", function () {
    const schemaVersionKeyPathNameCount =1;
    const docVersionKeyCount = 1 ; //__v

    const theMqSchema = common.theMqSchema;
    const allPathsActual = theMqSchema.getPathNamesAll();
    const allPathsActualCount = allPathsActual.length;

    const systemPathsActual =  theMqSchema.getPathNamesSystem();
    const systemPathsActualCount = systemPathsActual.length;

    const theRawSchema = common.schemaFromFile;
    const mostPathsExpected = theRawSchema.getPathNamesArray(); 
    const mostPathsExpectedCount = mostPathsExpected.length; 

    const allPathsExpectedCount = mostPathsExpectedCount + systemPathsActualCount + schemaVersionKeyPathNameCount + docVersionKeyCount;


    expect( allPathsExpectedCount,`expected path count ${ allPathsExpectedCount}, actual path count ${allPathsActualCount}`).to.be.equal(allPathsActualCount)


});
it.skip("expect createTestDocumentForInsert to have no undefined fields", function () {
    const theMqSchema = common.theMqSchema;
    const insertTestDocument = theMqSchema.createTestDocumentForInsert();
    let foundUndefined = false;
    Object.entries(insertTestDocument).forEach(([fieldID,fieldValue])=>{
        if(fieldValue === undefined ){
            foundUndefined= true;
        }
    });
    expect( foundUndefined,`Found undefined fields in insert test document`).to.be.false;


});
it.skip("expect createTestDocumentForUpdate to have no undefined fields", function () {
    const theMqSchema = common.theMqSchema;
    const insertTestDocument = theMqSchema.createTestDocumentForUpdatable();
    let foundUndefined = false;
    Object.entries(insertTestDocument).forEach(([fieldID,fieldValue])=>{
        if(fieldValue === undefined ){
            foundUndefined= true;
        }
    });
    expect( foundUndefined,`Found undefined fields in Update test document`).to.be.false;
});

it.skip("SearchPathsWithTypes (restrictive/not restrictive) should have different field counts", function () {
    const theMqSchema = common.theMqSchema;
    const searchPathsRestrictive = theMqSchema.getSearchablePathNamesWithTypes();
    theMqSchema.useRestrictiveSearch = false;

    const searchPathsNonRestrictive = theMqSchema.getSearchablePathNamesWithTypes();

    const insertTestDocument = theMqSchema.createTestDocumentForUpdatable();
    let foundUndefined = false;
    Object.entries(insertTestDocument).forEach(([fieldID,fieldValue])=>{
        if(fieldValue === undefined ){
            foundUndefined= true;
        }
    });
    expect( searchPathsRestrictive,`Restrictive searchable paths, non restrictive should be different`).to.not.equal(searchPathsNonRestrictive);
});
describe('hasValidSystemFields',()=>{
    let theMqSchema;
    before(function(){
        theMqSchema = common.CommonTestDependencies.theMqSchema;
        // theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
        // testRecordSet = CommonTestDependencies.testRecordSet;
    
    })
    it('should return true for document with ANY systemIDs',()=>{
        theMqSchema.getPathNamesSystem().forEach( pathID => {
            console.log(`pathID:${pathID}`)
            let doc = {};
            doc[pathID] = 'anything';
            expect(theMqSchema.hasAnySystemField(doc)).to.be.true;
        })
    
    });
    it('should return false for document without ANY systemIDs',()=>{
        const document = {};
        document['k1'] = 'v1';
        document['k2'] = 'v2';
        document['k3'] = 'v3';
        
        expect(theMqSchema.hasAnySystemField(document)).to.be.false;
    
    });

})