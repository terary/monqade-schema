
const  CommonTestDependencies = require("./common").CommonTestDependencies;
const mongoose = CommonTestDependencies.mongoose;

function importTest(name, path,skipTest=false) {
    if(skipTest){
        describe.skip(name, function () {
            require(path);
        });
    }else {
        describe(name, function () {
            require(path);
        });
    }
}
//const testRecords = [];
const testRecordSetCount=0;
insertTestRecords = (mqSchema, count,done)=>{
    const testRecord = mqSchema.createTestDocumentForInsert();
    

    mqSchema.doInsertOne(testRecord )
        .then(newDoc=>{
            // testRecordSetCount++;
            CommonTestDependencies.testRecordSet.push(newDoc.documents.pop())
            if(count<=0){
                done();
            }else {
                insertTestRecords(mqSchema, --count,done);
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

describe("Monqade Schema Tests", function () {

    before(function (done) {
        console.log("\t*Set-up");
        // console.log("running something before each test");
        mongoose.connect(CommonTestDependencies.MONGO_CONNECT_STRING, CommonTestDependencies.MONGO_CONNECT_OPTIONS);
        CommonTestDependencies.mongoose

        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error'));
        db.once('open', function() {
    
            console.log('\t*We are connected to test database!');
                const schemaDefinition = CommonTestDependencies.schemaDefinition;
                userSchema = new CommonTestDependencies.MonqadeSchemaWithPathAdapter(schemaDefinition.paths,
                    schemaDefinition.options,
                    mongoose);

                CommonTestDependencies.theMqSchema= userSchema 
                console.log(`\t*userSchema created successfully.\n`);

                insertTestRecords(CommonTestDependencies.theMqSchema, 25,done);    

            
        });
     });// end before(...)

     beforeEach(function () {
       // console.log("running something before each test");
    });


    const skipTest = true;
    importTest(".doInsertOne", './partials/doInsertOne.js',   ! skipTest) ;
    importTest(".doUpsertOne", './partials/doUpsertOne.js', !  skipTest);
    importTest(".doUpdateOne", './partials/doUpdateOne.js', !  skipTest);
    importTest(".doFindOne", './partials/doFindOne.js', ! skipTest);
    importTest(".doDeleteOne", './partials/doDeleteOne.js', ! skipTest);
    importTest(".doFindMany", './partials/doFindMany.js', !  skipTest);
    importTest(".doQueryMany", './partials/doQueryMany.js', ! skipTest);
    importTest("unit", './partials/unit.js', ! skipTest);


    it.skip(`consider how the shared schemas work.. could be better making repository? `)
    it.skip(`fix the export, its a fucking mess to try use.. import this, and that, then another how they all go together??`);
    it.skip(`add options 'label' to schema`);
    after(function (done) {
        console.log("\n\t*Tear-down");
        mongoose.connection.close(done);
        console.log("\t*Mongoose connection closed.");

    });
});