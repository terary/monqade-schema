/* cSpell:ignore monqade */

"use strict";
const chai = require("chai");
const expect = chai.expect;

const CommonTestDependencies = require("../common");
const MonqadeResponse = CommonTestDependencies.MonqadeResponse;
const rejectedWithErrorCode = CommonTestDependencies.rejectedWithErrorCode;
const mongoose = CommonTestDependencies.mongoose;

let theMqSchema, testRecordSet;
before(function(){
    theMqSchema = CommonTestDependencies.theMqSchema; // scoping issues require this is done inside 'it'
    testRecordSet = CommonTestDependencies.testRecordSet;
})




it("Verify works as expected.  Should delete a record indicated as (mqResponse.meta.n=1 and mqResponse.meta.ok=1 ) ", function (done) {

    const testRecord = testRecordSet.pop(); 
    theMqSchema.doDeleteOne(testRecord)
    .then(mqResponse=>{
        expect(mqResponse).to.be.an.instanceof(MonqadeResponse);
        expect(mqResponse.documents.length, `doDeleteOne should return empty array. returned ${mqResponse.documents.length}`).to.equal(0 );
        expect(mqResponse.meta.ok).to.eq(1);  
        expect(mqResponse.meta.n).to.eq(1);  
        done();
    }).catch(mqError=>{
        expect(mqError).to.be.null;
        done(); 
    }).catch(otherError=>{
        done(otherError);
    });
});
// it("how to test (mqResponse.meta.n=0 and mqResponse.meta.ok != 1  ) ", function (done) {
//  n=0, ok=1 -> no records found
//  n=1,  ok=1 -> successful delete
//  n=0, ok=0  -> error
//  n=1, ok=0 --> impossible?
// 
//     const testRecord = testRecordSet.pop(); 
//     testRecord['_id'] =mongoose.Types.ObjectId();
//     theMqSchema.doDeleteOne(testRecord)
//     .then(mqResponse=>{
//         expect(mqResponse).to.be.an.instanceof(MonqadeResponse);
//         expect(mqResponse.documents.length, `doDeleteOne should return empty array. returned ${mqResponse.documents.length}`).to.equal(0 );
//         expect(mqResponse.meta.ok).to.eq(1);  
//         expect(mqResponse.meta.n).to.eq(1);  
//         done();
//     }).catch(mqError=>{
//         expect(mqError).to.be.null;
//         done(); 
//     }).catch(otherError=>{
//         done(otherError);
//     });
// });

it("Should reject with 'MissingOrInvalidSystemPaths' when  systemPaths are missing or malformed", function (done) {
    const findObject ={_id:2}     
    theMqSchema.doDeleteOne(findObject)
    .then(mqResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});
it("Should reject with 'MissingOrInvalidSystemPaths' when using wrong schema version", function (done) {
    const testRecord = testRecordSet.pop(); 
    testRecord['_schemaVersion'] = 'wrong_schema_key'

    theMqSchema.doDeleteOne(testRecord)
    .then(mqResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("Will reject with 'MissingOrInvalidSystemPaths' for empty systemPaths ", function (done) {
    const findObject ={}     
    theMqSchema.doDeleteOne(findObject)
    .then(mqSearchResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("Should reject 'MissingOrInvalidSystemPaths' when attempted to delete an 'undefined' document ", function (done) {
    const findObject =undefined; 
    theMqSchema.doDeleteOne(findObject)
    .then(mqSearchResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('MissingOrInvalidSystemPaths',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});

it("Will reject with 'NoMatchingDocumentFound'  systemPaths have not matching document ", function (done) {
    const findObject ={_id:'5bc2ee63086f322373756e70',
        updatedAt:'2018-12-15T20:48:11.359Z',
        createdAt:'2018-12-15T20:48:11.359Z',
        _schemaVersion:'001'}; 
     findObject[ theMqSchema.docVersionKeyName] ='-3' ;

    theMqSchema.doDeleteOne(findObject)
    .then(mqResponse=>{
        expect(mqResponse).to.be.null;
        done();
    
    }).catch(mqError=>{
        rejectedWithErrorCode('NoMatchingDocumentFound',mqError);
        done();

    }).catch(otherError=>{
        done(otherError);
    });
});
describe('When mongoose returns error when call deleteOne - maybe broken connection?', ()=>{
    const schemaDefinition = CommonTestDependencies.schemaDefinition;
    let delSchema;
    let fakeMongoose = {   
        set:()=>{},
        model:()=>{return {deleteOne:(findCriteria,callback)=>{
            callback('this is an error',null);
        }}},
        _model:{}
    }
    beforeEach(()=>{
        delSchema = new CommonTestDependencies.MonqadeSchema(
                                schemaDefinition.paths,
                                schemaDefinition.options,
                                fakeMongoose                
                                );
                            //this.getMongooseModelClass().deleteOne(findCriteria,(error,statusResponse)=>{
    
    })
    it(`should be schema`,()=>{
        expect(delSchema).to.not.be.null;
        const findObject = testRecordSet.pop(); 
        delSchema.doDeleteOne(findObject)
            .then(mqResponse=>{
                expect(mqResponse).to.be.null;

            })
            .catch(mqError=>{
                rejectedWithErrorCode('MongooseError',mqError);
 
            });
    });
})
describe('What happens when mongoose delete returns with error=null, {n:1,ok=0}. How does this even happen? ', ()=>{
    const schemaDefinition = CommonTestDependencies.schemaDefinition;
    let delSchema;
    let fakeMongoose = {   
        set:()=>{},
        model:()=>{return {deleteOne:(findCriteria,callback)=>{
            callback(null,{n:1,ok:0});
        }}},
        _model:{}
    }
    before(()=>{
        delSchema = new CommonTestDependencies.MonqadeSchema(
                                schemaDefinition.paths,
                                schemaDefinition.options,
                                fakeMongoose                
                                );
    
    })
    it(`Should `,()=>{
        expect(delSchema).to.not.be.null;
        const findObject = testRecordSet.pop(); 
        delSchema.doDeleteOne(findObject)
            .then(mqResponse=>{
                expect(mqResponse).to.be.null;

            })
            .catch(mqError=>{
                rejectedWithErrorCode('MongooseOtherError',mqError);
                expect(mqError).to.not.be.null;
            });
    });
})


