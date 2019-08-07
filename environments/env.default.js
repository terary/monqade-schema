
const NOT_SET_MESSAGE = `Value has not been sent up in the environment config`;

module.exports = {
    MONGO_CONNECT_STRING:NOT_SET_MESSAGE,
    MONGO_CONNECT_OPTIONS:{ useNewUrlParser: true, connectTimeoutMS:1000 },
}