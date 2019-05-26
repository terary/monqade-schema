
const defaultOptions = require('./env.default');

const options= {
    RUN_MODE:"PRODUCTION"

    // should be provided by the production environment
    // MONGO_CONNECT_STRING:"mongo://something",
    // MONGO_CONNECT_OPTIONS:{}
}
module.exports = Object.assign(defaultOptions,options);