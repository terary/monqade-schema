"use strict";
if(process.env.HOSTNAME == 'terary-msi'){
    module.exports= require('./env.test-dev');

} else if(process.env.MONQADE_RUNTIME == 'travis') {
    module.exports= require('./env.test-dev');

} else {
    const env = require('./env.test-and-examples');

    if(! env.MONGO_CONNECT_STRING  ){
        console.log(`
                **************   Tests and Examples  ************ 
                A) ***Connection string need to be set in environments/env.test-and-examples.js ***

                B) Be advised for examples and test a single database will be used
                with a few collections.  

                Database, collection and documents will persist. There is no
                house cleaning, by design.
                
                Please select a database (or new database) specifically for 
                examples and testing.
        `);
        process.exit(-1)
    }

    module.exports = env;
}

