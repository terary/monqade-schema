
let constKey; // an after thought.

const datasetBuilder = (mqSchema, count, done, documents) => {
    const theInsertDocument =  mqSchema.createTestDocumentForInsert();
    if(constKey) {
        theInsertDocument['constKey'] = constKey
    }
 
    if(!documents) {
        documents = [];
    }

    mqSchema.doInsertOne(theInsertDocument)
    .then(mqResponse => { //MonqadeResponse type
        const subjDocument = mqResponse.documents[0];

        documents.push(subjDocument);

        if(count > 1){
            datasetBuilder(mqSchema, --count, done, documents);
        }else {
            done(null, documents);
        }
    }).catch(mqError=>{ //MonqadeErro
        done(mqError);
    });
}  


const datasetBuilderAsPromised = (mqSchema, count, constKeyValue ) => {
    constKey = constKeyValue 
    return new Promise( (resolve, reject) =>{
        datasetBuilder(mqSchema,count,(err,documents) => {
            if(err){
                return reject(err);
            }
            return resolve(documents);
        })

    })

}  

module.exports.datasetBuilder = datasetBuilder;
module.exports.datasetBuilderAsPromised =datasetBuilderAsPromised;
