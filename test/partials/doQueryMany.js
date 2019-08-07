"use strict";
/* cSpell:ignore monqade */

const chai = require("chai");
const expect = chai.expect;

const CommonTestDependencies = require("../common");
const MonqadeResponseSearch = CommonTestDependencies.MonqadeResponseSearch;
const MonqadeQueryBuilder = CommonTestDependencies.MonqadeQueryBuilder;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;




const limitOverride = {}; // 
const useDefaultProjection = undefined;  //function sets to default if undefined.

const resolvedManyAsExpected = (mqResponse) =>{
    expect(mqResponse).to.be.an.instanceof(MonqadeResponseSearch);
    expect(mqResponse.documents).to.be.an('array')
}

const makeSearchCriteria = (testRecord,mqSchema)=>{
    // return a single valid search criteria that will
    // guarantee some result from .doQueryMany(...)
    // {pathID}
    const searchForPathID = mqSchema.getPathNamesSearchable().pop();
    return {pathID:searchForPathID,value:testRecord[searchForPathID]}
}

describe('.doQueryMany(queryBuilder [, projection] [, queryOptions])', () => { 
    let theMqSchema, testRecordSet;
    before(function(){
        theMqSchema = CommonTestDependencies.theMqSchema; 
        testRecordSet = CommonTestDependencies.testRecordSet;
    })

    it("Control test - verify works as expected ", function (done) {

        const testDoc = testRecordSet.pop();
        const mqQueryBuilder =new MonqadeQueryBuilder(theMqSchema.getSearchablePathNamesWithTypes());

        mqQueryBuilder.eq('idxBucket', testDoc.idxBucket);

        theMqSchema.doQueryMany(mqQueryBuilder,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            resolvedManyAsExpected(mqSearchResponse)
            done();

        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });
    it("Should support complex queries without QueryBuilder ", function (done) {
        const mqQueryBuilder =new MonqadeQueryBuilder(theMqSchema.getSearchablePathNamesWithTypes());

        mqQueryBuilder.like('city', 'ew');
        mqQueryBuilder.between('memberSinceDate', new Date('1974-06-29T01:30:00Z'), new Date( '2074-06-29T01:30:00Z' ));

        const findCriteria = mqQueryBuilder.toFindObject();
        theMqSchema.doQueryMany(findCriteria,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            resolvedManyAsExpected(mqSearchResponse)
            done();

        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });

    describe('Illegal query options', () => {
        beforeEach(()=>{

        })
        it(`Should reject with IllegalQueryOptionDetected' when encountering unknown search paths`, (done) => {

            const badSearchPath = theMqSchema.getPathNamesNonSearchable()[0];
            const findCriteria ={$and:[ {[badSearchPath]:{$eq:1}} ] };
            const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};


            expect(badSearchPath).to.not.be.undefined; // assure test is doing what is expected.

            theMqSchema.doQueryMany(qb)
            .then(mqSearchResponse => {
                expect(mqSearchResponse).to.be.undefined;
                done();

            }).catch(mqError => {
                rejectedWithErrorCode('IllegalQueryOptionDetected',mqError);
                done(); 

            }).catch(otherError => {
                done(otherError);

            });

        })
        it(`Should reject with 'IllegalQueryOptionDetected' when queries unknown search operators `, (done) => {
            const searchPath = theMqSchema.getPathNamesSearchable()[0];
            const findCriteria ={$and:[ {[searchPath] :{$eqx:1}} ] };
            const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};

            expect(searchPath).to.not.be.undefined;

            theMqSchema.doQueryMany(qb)
            .then(mqSearchResponse => {
                expect(mqSearchResponse).to.be.undefined;
                done();

            }).catch(mqError => {
                rejectedWithErrorCode('IllegalQueryOptionDetected',mqError);
                done(); 

            }).catch(otherError => {
                done(otherError);

            });

        })
        it('Should run queries as expected with both searchPaths and searchOperators are valid ', (done) => {
            const searchPath = theMqSchema.getPathNamesSearchable()[0];
            const findCriteria ={$and:[ {[searchPath]:{$eq:1}} ] };
            const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};

            expect(searchPath).to.not.be.undefined; // make sure actually testing something

            theMqSchema.doQueryMany(qb)
            .then(mqSearchResponse => {
                resolvedManyAsExpected(mqSearchResponse)
                done();

            }).catch(mqError => {
                expect(mqError).to.be.null;
                done(); 

            }).catch(otherError => {
                done(otherError);

            });
        });

        it(`Should reject with 'EmptyFindCriteria' when no search paths supplied, empty query  `, (done) => {
            const findCriteria ={$and:[  ] };
            const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};

            theMqSchema.doQueryMany(qb)
            .then(mqSearchResponse => {
                expect(mqSearchResponse).to.be.undefined;
                done();

            }).catch(mqError => {
                rejectedWithErrorCode('EmptyFindCriteria',mqError);
                done(); 

            }).catch(otherError => {
                done(otherError);

            });
        });
        it(`Should reject with 'EmptyFindCriteria' when createdAt is only supplied criteria  `, (done) => {
            const searchPath = theMqSchema.getPathNamesSearchable()[0];
            expect(searchPath).to.not.be.undefined;

            const findCriteria ={$and:[ {createdAt:{$gte:'1970-01-01T00:00:00Z'}} ] };
            const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};

            theMqSchema.doQueryMany(qb)
            .then(mqSearchResponse => {
                expect(mqSearchResponse).to.be.undefined;
                done();

            }).catch(mqError => {
                rejectedWithErrorCode('EmptyFindCriteria',mqError);
                done(); 

            }).catch(otherError => {
                done(otherError);

            });
        });
        it('Should resolve as expected when using createdAt and any other searchable path +  ', (done) => {
            const findCriteria ={$and:[ {createdAt:{$gte:'1970-01-01T00:00:00Z'}}, {idxBucket:{$lte:9}} ] };
            const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};

            theMqSchema.doQueryMany(qb)
            .then(mqSearchResponse => {
                resolvedManyAsExpected(mqSearchResponse)
                done();

            }).catch(mqError => {
                expect(mqError).to.be.undefined;
                done(); 

            }).catch(otherError => {
                done(otherError);

            });
        });
    })
    it("Should reject with 'EmptyFindCriteria' when passing 'undefined' queryBuilder ", function (done) {
        theMqSchema.doQueryMany(undefined,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqError).to.be.null;
            done();

        }).catch(mqError=>{
            rejectedWithErrorCode('EmptyFindCriteria',mqError);
            done();

        }).catch(otherError=>{
            done(otherError);
        });
    });

    it("Should reject with 'EmptyFindCriteria' when not using queryBuilder interface", function (done) {
        theMqSchema.doQueryMany({},useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            expect(mqError).to.be.null;
            done();

        }).catch(mqError=>{
            rejectedWithErrorCode('EmptyFindCriteria',mqError);
            done();

        }).catch(otherError=>{
            done(otherError);
        });
    });

    it("Should append system paths to projection - always ", function (done) {
        const searchCriteria =makeSearchCriteria(testRecordSet.pop(), theMqSchema);    
        const mqQueryBuilder =new MonqadeQueryBuilder(theMqSchema.getSearchablePathNamesWithTypes());
        const projection = [theMqSchema.getPathNamesProjectable()[0]];

        mqQueryBuilder.eq(searchCriteria.pathID, searchCriteria.value);

        theMqSchema.doQueryMany(mqQueryBuilder, projection, limitOverride)
        .then(mqSearchResponse => {  // is the projection what is expected.
            expect(mqSearchResponse).to.be.an.instanceof(MonqadeResponseSearch);

            const expectedProjection = projection.concat(theMqSchema.getPathNamesSystem());
            const actualProjection = Object.keys( mqSearchResponse.documents[0]);

            expect(expectedProjection).to.have.members(actualProjection );
            expect(actualProjection ).to.have.members(expectedProjection);
            // ^--- if we care about efficiencies. Could test membership a-> b and a.length=b.length
            done();

        }).catch(mqError => {
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });


    it("Should handle more complex queries (queryBuilder in use - not stable) ", function (done) {
        
        const mqQueryBuilder = new MonqadeQueryBuilder(theMqSchema.getSearchablePathNamesWithTypes());
                
        // should  be approximately all documents. 
        mqQueryBuilder.betweeni('idxBucket',0,-3,8,9);
        mqQueryBuilder.betweenx('someDate',new Date('1970-01-01'),new Date());
        mqQueryBuilder.in('state','ME','ca','ne','ut');

        theMqSchema.doQueryMany(mqQueryBuilder,useDefaultProjection,limitOverride)
        .then(mqSearchResponse=>{
            resolvedManyAsExpected(mqSearchResponse)
            done();

        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 

        }).catch(otherError=>{
            done(otherError);

        });
    });
});
describe('.doQueryManyCount(findCriteria)', () => { 
    let theMqSchema, testRecordSet;

    before(function(){
        theMqSchema = CommonTestDependencies.theMqSchema; 
        testRecordSet = CommonTestDependencies.testRecordSet;
    })

    it('Should return count=1 for a specific document',( done )=>{
        const testDoc = testRecordSet.pop();
        const subjectDoc = {};
        theMqSchema.getPathNamesSearchable().forEach(pathName=>{
            subjectDoc[pathName] = testDoc[pathName];
        })
        const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return subjectDoc }};
        theMqSchema.doQueryManyCount(qb)
        .then(mqSearchResponse=>{
            resolvedManyAsExpected(mqSearchResponse)
            expect(mqSearchResponse.documents[0].count).to.equal(1);
            done();
    
        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 
    
        }).catch(otherError=>{
            done(otherError);
    
        }); 
    });
    it('Should return count greater than 1 for a general search documents',( done )=>{
        const findCriteria ={$and:[ {idxBucket:{$gte:1}} ] };
        const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};

        theMqSchema.doQueryManyCount(qb)
        .then(mqSearchResponse=>{
            resolvedManyAsExpected(mqSearchResponse)
            expect(mqSearchResponse.documents[0].count).to.above(1);
            done();
    
        }).catch(mqError=>{
            expect(mqError).to.be.null;
            done(); 
    
        }).catch(otherError=>{
            done(otherError);
    
        }); 
    });
    it(`Should reject with 'EmptyFindCriteria' for only createdAt as search criteria`,( done )=>{
        const testRecord = testRecordSet.pop()
        const findCriteria ={$and:[ {createdAt:testRecord['createdAt']} ] };
        const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};

        theMqSchema.doQueryManyCount(qb)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.null;
            done();
    
        }).catch(mqError=>{
            rejectedWithErrorCode('EmptyFindCriteria',mqError);

            done(); 
    
        }).catch(otherError=>{
            done(otherError);
    
        }); 
    });
    it(`Should reject with 'EmptyFindCriteria' for no search criteria`,( done )=>{
        const findCriteria ={$and:[  ] };
        const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};

        theMqSchema.doQueryManyCount(qb)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.null;
            done();
    
        }).catch(mqError=>{
            rejectedWithErrorCode('EmptyFindCriteria',mqError);
            done(); 
    
        }).catch(otherError=>{
            done(otherError);
    
        }); 
    });
    it(`Should reject with 'EmptyFindCriteria' if createdAt is the only search criteria `,( done )=>{
        const findCriteria ={$and:[{createdAt:{$gte: new Date()}}  ] };
        const qb  = {termCount: ()=> {return 1}, toFindObject: function() {return findCriteria }};

        theMqSchema.doQueryManyCount(qb)
        .then(mqSearchResponse=>{
            expect(mqSearchResponse).to.be.null;
            done();
    
        }).catch(mqError=>{
            rejectedWithErrorCode('EmptyFindCriteria',mqError);
            done(); 
    
        }).catch(otherError=>{
            done(otherError);
    
        }); 
    });
});

//
//            this.getMongooseModelClass().countDocuments(qry,(error,count)=>{
describe(`Mongoose returns unanticipated error`, ()=>{
    const schemaDefinition = CommonTestDependencies.schemaDefinition;
    let badMongooseSchema;
    let fakeMongoose = {   
        set:()=>{},
        model:()=>{return {countDocuments:(findCriteria,callback)=>{
            callback('some error',null);
        }}},
        _model:{}
    }
    before(()=>{
        badMongooseSchema = new CommonTestDependencies.MonqadeSchema(
                                schemaDefinition.paths,
                                schemaDefinition.options,
                                fakeMongoose                
                                );
    
    })
    //IllegalQueryOptionDetected
    it(`Should reject with 'IllegalQueryOptionDetected' when a encountering an unknown mongoose error`,()=>{
        expect(badMongooseSchema).to.not.be.null;
        const findObject = CommonTestDependencies.testRecordSet.pop(); 
        badMongooseSchema.doQueryManyCount(findObject)
            .then(mqResponse=>{
                expect(mqResponse).to.be.null;

            })
            .catch(mqError=>{
                rejectedWithErrorCode('IllegalQueryOptionDetected',mqError);
                expect(mqError).to.not.be.null;
            }).catch(otherError=>{
                done(otherError);
            });
    });
})
describe(`Mongoose returns unanticipated error`, ()=>{
    const schemaDefinition = CommonTestDependencies.schemaDefinition;
    let badMongooseSchema;
    let fakeMongoose = {   
        set:()=>{},
        model:()=>{return {countDocuments:(findCriteria,callback)=>{
            callback({error:'some error',name:'ValidationError'},null);
        }}},
        _model:{}
    }
    before(()=>{
        badMongooseSchema = new CommonTestDependencies.MonqadeSchema(
                                schemaDefinition.paths,
                                schemaDefinition.options,
                                fakeMongoose                
                                );
    
    })
    it(`Should reject with 'MongooseValidationError' when a encountering an unknown mongoose error`,(done)=>{
        expect(badMongooseSchema).to.not.be.null;
        const findObject = {}  ;
        const testRecord = CommonTestDependencies.testRecordSet.pop();
        badMongooseSchema.getPathNamesSearchable().forEach(pathID => {
            findObject[pathID] = testRecord[pathID];
        });
        badMongooseSchema.doQueryManyCount(findObject)
            .then(mqResponse=>{
                expect(mqResponse).to.be.null;
                done();
            })
            .catch(mqError=>{
                rejectedWithErrorCode('MongooseValidationError',mqError);
                done();
                // expect(mqError).to.not.be.null;
            }).catch(otherError => {
                done(otherError);
            });
    });
})

