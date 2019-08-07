
const defaultOptions = require('./env.default');

/// example test string:   'mongodb://127.0.0.1:27017/monqade-schema-test',
 
const options= {

    MONGO_CONNECT_STRING:undefined


}
module.exports = Object.assign({}, defaultOptions,options);