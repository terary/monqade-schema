
// module.exports = require('../src-internal/monqade-share-src');

const ENV = require('../environments');
//MONQADE_SHARED_NAME:'monqade-shared',
// '/mypart/tmc/my-node-modules/monqade/monqade-schema/src-internal/monqade-shared-src'
// module.exports = require(ENV['MONQADE_SHARED_NAME']);
// module.exports = require('/mypart/tmc/my-node-modules/monqade/monqade-schema/src-internal/monqade-shared-src/');

if(ENV['RUN_MODE']==='DEVELOPMENT' ||ENV['RUN_MODE']==='TESTING'  ){
    module.exports = require('/mypart/tmc/my-node-modules/monqade/monqade-schema/src-internal/monqade-shared-src/');
}else {
    module.exports = require('monqade-shared');
}
