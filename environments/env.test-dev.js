
const defaultOptions = require('./env.default');

const options= {
    RUN_MODE:"TESTING",
    MONGO_CONNECT_STRING:'mongodb://127.0.0.1:27017/monqade-schema-test',
    MONGO_CONNECT_OPTIONS:{ useNewUrlParser: true, connectTimeoutMS:1000 },
}
module.exports = Object.assign({},defaultOptions,options);