/* cSpell:ignore monqade */

/**
 * A) Connect database - set test wide mongoose ref
 * B) Build dataset to be used for all tests
 * C) Call all tests.
 * 
 * Gotcha - most all tests will use the schema/dataset listed here.  Some tests require specialized
 * schema and those will be handled within those tests. 
 * 
 */

const  CommonTestDependencies = require("./common");
const mongoose = CommonTestDependencies.mongoose;
const  buildDocCollection = CommonTestDependencies.buildDocCollection



const importTest = (name, path,skipTest=false) => {
    describe(name, function () {
        require(path);
    });
}


describe("MonqadeSchema Tests", function () {

    before(function (done) {
        console.log("\t*Set-up");

        mongoose.connect(CommonTestDependencies.MONGO_CONNECT_STRING, CommonTestDependencies.MONGO_CONNECT_OPTIONS);
        CommonTestDependencies.mongoose = mongoose;

        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error'));
        db.once('open', function() {
    
            console.log('\t*We are connected to test database!');
                const schemaDefinition = CommonTestDependencies.schemaDefinition;
                mqSchema = new CommonTestDependencies.MonqadeSchema(
                                        schemaDefinition.paths,
                                        schemaDefinition.options,
                                        mongoose);

                CommonTestDependencies.theMqSchema= mqSchema 
                console.log(`\t*userSchema created successfully.\n`);

                buildDocCollection(
                    CommonTestDependencies.theMqSchema,
                    CommonTestDependencies.testRecordSet, 
                    100,done);    
        });        
     });// end before(...)

     beforeEach(function () {
       // console.log("running something before each test");
    });


    //done 
    importTest(".doUpdateOne", './partials/doUpdateOne.js' );
    importTest(".doInsertOne", './partials/doInsertOne.js' ) ;
    importTest(".doDeleteOne", './partials/doDeleteOne.js' );
    importTest(".doFindOne", './partials/doFindOne.js' );
    importTest(".doUpsertOne", './partials/doUpsertOne.js');
    importTest(".doQueryMany", './partials/doQueryMany.js');

    importTest(".properties", './partials/classMethodsProperties.js');
    importTest(".doFindMany", './partials/doFindMany.js' );

    

    after(function (done) {
        console.log("\n\t*Tear-down");
        mongoose.disconnect(done); // preferred for tear-down
        console.log("\t*Mongoose connection closed.");
    });
});