
`
To use:
    launch.json:
        "configurations": [
            {
                "type": "node",
                "request": "launch",
                "name": "index ",
                "env": {"MONQADE_ENV":"testing"},
                "program": "\${workspaceFolder}/index.js"
            },  ...

    package.json:
        "scripts": {
            "test": "echo \"Error: no test specified\" && exit 1",
            "doit": "MONQADE_ENV=test  node index.js"
        },
    command line:
        MONQADE_ENV=test node script.js

-----
const ENV = require('./environments');
console.log(ENV['RUN_MODE'])

`

const RUN_MODE = process.env.MONQADE_ENV || 'PRODUCTION';

switch(RUN_MODE.toUpperCase()){
    case 'TESTING' :
    case 'TEST' :
        module.exports= require('./env.test');
        break;

    case 'DEV' :
    case 'DEVELOPMENT' :
        module.exports= require('./env.development');
        break;

    default :  // production
        module.exports= require('./env.production');
        break;

}
