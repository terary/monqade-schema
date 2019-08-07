
const MonqadeSchemaBase = require('./classes/MonqadeSchemaBase.js');
const MonqadeShared = require('monqade-shared'); 
const LAMBDAS = MonqadeShared.LAMBDAS;

// const LAMBDAS = MonqadeShared.LAMBDAS;
const MonqadeError = MonqadeShared.MonqadeError;
const MonqadeResponseSearch = MonqadeShared.MonqadeResponseSearch;
const MonqadeResponse = MonqadeShared.MonqadeResponse; 
const schemaVersionKeyPathTemplate =MonqadeShared.schemaVersionKeyPathTemplate;
const systemPathTemplate =MonqadeShared.systemPathTemplate; 

const mongoose = require('mongoose');
const isValidMongoID = mongoose.Types.ObjectId.isValid;

//const defaultPathTemplate = require('./defaultPathSettings.js');


/**
 * Facade for mongoose.. enforce uniformity and simplification of basic CRUD operations
 * 
 * @class MonqadeSchema
 * @description Facade for mongoose.. enforce uniformity and simplification of basic CRUD operations
 * 
 * See [MonqadePath]{@tutorial MonqadePath}, [MonqadeSchemaExample]{@tutorial MonqadeSchemaExample} and {@link https://mongoosejs.com/docs/schematypes.html MongooseSchemaType}.
 * 
 * @param {object} schemaPaths - any MongooseSchemaType + Monqade options
 * @param {object} schemaOptions - any Mongoose schema option + Monqade Schema options
 * @param {Mongoose.Connection} mongooseRef - active/live Mongoose.Connection
 */
class MonqadeSchema extends MonqadeSchemaBase {

    /**
     * Update a single document identified by given systemPaths.
     * @param {document} updateCandidateDoc must contain all systemPaths and any updates
     * @returns {Promise} Promise 
     *      Resolves to {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeResponse-MonqadeResponse.html MonqadeResponse } 
     *          or
     *       Rejects as {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeError-MonqadeError.html MonqadeError}
     * @description 
     * * Update given updateCandidateDoc. 
     * * Will only update paths marked as isUpdatable=true in schema. 
     * * updateCandidateDoc must include system paths to identify the document.
     * 
     * **mutation not applicable**
     *      
     * tmc - completed -  
     */
    doUpdateOne( updateCandidateDoc){

        //findCriteria
        if( ! this._hasValidSystemFields(updateCandidateDoc) ){
            const mqError = new MonqadeError('MissingOrInvalidSystemPaths','Documents are identified by/with the system fields.' )
            return Promise.reject(mqError)
        }
        const findCriteria = LAMBDAS.subDocumentOfPaths(updateCandidateDoc,this.getPathNamesSystem());

        //build update fields
        const theUpdateDoc = LAMBDAS.subDocumentOfPaths(updateCandidateDoc,this.getPathNamesUpdatable())
        if(Object.keys(theUpdateDoc).length == 0){
            const mqError =new MonqadeError('EmptyCandidateDoc','Update contained no updatable fields. No update attempted.' )
            return Promise.reject(mqError)
        }
        const mongooseUpdateOptions = {new:true,runValidators:true};

        return this._findOneAndUpdate(findCriteria,theUpdateDoc,mongooseUpdateOptions);
    }

        /**
     * Insert given candidateDoc  
     * 
     * **mutation not applicable**
     * 
     * @param {document} candidateDoc - document with paths to be inserted.
     * @description
     * * Rejects with 'InsertSystemPathsForbidden' when attempting to insert system paths
     * * Ignores paths isInsertable=false
     * * Will only read paths isInsertale=true
     * * If successful MonqadeResponse.documents will have length 1 and document is simple object (not mongoose document)
     * * Mutation not applicable  
     * 
     * @returns {Promise} Promise 
     *      Resolves to {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeResponse-MonqadeResponse.html MonqadeResponse } 
     *          or
     *       Rejects as {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeError-MonqadeError.html MonqadeError}
     * 
     * tmc - completed - 
     */
    doInsertOne(candidateDoc){
        
        const theNewDoc = LAMBDAS.subDocumentOfPaths(candidateDoc,this.getPathNamesInsertable())
     
        if(Object.keys(theNewDoc).length == 0){
            const mqError =new MonqadeError('EmptyCandidateDoc','Insert document contained no insertable paths. No insert attempted.' )
            return Promise.reject(mqError)
        }
        let hasSystemPaths = false;
        this.getPathNamesSystem().forEach(pathID => {
            if( pathID in candidateDoc){
                hasSystemPaths = true;
            }
        })
        if(hasSystemPaths) {
            const mqError =new MonqadeError('InsertSystemPathsForbidden','Insert document contained system paths' )
            return Promise.reject(mqError)
        }

        // Monqade system guarantee -
        theNewDoc['_schemaVersion'] = this.schemaVersionKey;

        const ModelClass = this.getMongooseModelClass();
        const theModel = new ModelClass(theNewDoc);

        return new Promise((resolve,reject)=>{
            theModel.save({validateBeforeSave:true}).then(savedDoc=>{
                // want simple JSON
                // documentation - leaves this open-ended.
                // isProjection ..?? 
                let simpleJSON = JSON.parse( JSON.stringify(savedDoc.toJSON({flattenMaps:true })));
                return resolve(new MonqadeResponse([simpleJSON])); // monqade always returns Array .. Return Array will be an issue of 

            }).catch(error=>{
                const errorCode =(error.name === 'ValidationError')? 'MongooseValidationError' : 'MongooseOtherError';     
                return reject( new MonqadeError(errorCode,'Mongoose/MongoDB threw validation error' , error) );

            })
        })
    }


    /**
     * Delete a single document identified by given systemPaths.
     * @param {document} deleteCandidateDoc must contain all systemPaths
     * @returns {Promise} Promise 
     *      Resolves to {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeResponse-MonqadeResponse.html MonqadeResponse } 
     *          or
     *       Rejects as {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeError-MonqadeError.html MonqadeError}
     * @description
     *              
     * All system paths are required.
     * 
     * To determine success/failure:
     * 
     * 
     *      MonqadeResponse.meta.ok = 1 && MonqadeResponse.meta.n = 1  <-- success
     *      MonqadeResponse.meta.ok = 1 && MonqadeResponse.meta.n = 0   <-- probably no document found
     *      MonqadeResponse.meta.ok = 0 && MonqadeResponse.meta.n = 0   <-- failure likely
     *       
     * **mutation not applicable**
     *      
     * tmc - completed -  
     */
    doDeleteOne(deleteCandidateDoc){
        
        if( ! this._hasValidSystemFields(deleteCandidateDoc) ){
            // this will require 'updatedAt', 'createdAt', and sometimes '__v' -- seems a bit silly 
            // to remove the requirement without breaking client code simply pad input with {createdAt:,updatedAt:,__v:}
            const mqError = new MonqadeError('MissingOrInvalidSystemPaths','Documents are identified by/with the system fields.' )
//            return LAMBDAS.rejectedPromise(mqError)
            return Promise.reject(mqError)
        }
        const findCriteria = {_id:deleteCandidateDoc['_id'],updatedAt:deleteCandidateDoc['updatedAt']};

        return new Promise((resolve,reject)=>{
        //  n=0, ok=1 -> no records found
        //  n=1,  ok=1 -> successful delete
        //  n=0, ok=0  -> error
        //  n=1, ok=0 --> impossible?
            this.getMongooseModelClass().deleteOne(findCriteria,(error,statusResponse)=>{
                if(error){   // n=0, ok=0  -> error
                    const newError = new MonqadeError('MongooseError','Mongoose/MongoDB threw error model.deleteOne' , error)
                    return reject(newError );
                }
                if(statusResponse.ok == 1 && statusResponse.n == 0 ){   //n=0, ok=1 -> no records found
                    return reject( new MonqadeError("NoMatchingDocumentFound","No Records Found",undefined) ) ;    
                }
 
                //test coverage is squawking -  so removed it, commented-out. kept here to indicate due consideration
                if(statusResponse.ok != 1){ // n=1, ok = 0 --- How could this be? delete a non-document?
                    const newError = new MonqadeError('MongooseOtherError','Delete failed for unknown reason. Check original Error' , error)
                    return reject(newError );
                }
 
                return resolve(new MonqadeResponse([],statusResponse)); // monqade always returns Array of docs  
            });
        });
    }

    /**
     * Fetches a single document identified by given systemPaths.
     * @param {document} findCriteria must contain all systemPaths
     * @returns {Promise} Promise 
     *      Resolves to {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeResponse-MonqadeResponse.html MonqadeResponse } 
     *          or
     *       Rejects as {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeError-MonqadeError.html MonqadeError}
     * @description
     *              
     * All system paths are required.
     * 
     * **mutation not applicable**
     *      
     * tmc - completed -  
     */
    doFindOne(findCriteria={}){
        const _ID =Object.assign({},findCriteria);
        const systemPathsID = {};
        // isValidMongoID        
        //if(! LAMBDAS.isValidMongoID(_ID['_id'])  ){
        if(! isValidMongoID(_ID['_id'])  ){
            return Promise.reject( new MonqadeError('MissingOrInvalidDocumentIDs',`Supplied _id: '${_ID['_id']}' is not valid` ))

        }
        //findCriteria
        if( ! this._hasValidSystemFields(findCriteria) ){
            const mqError = new MonqadeError('MissingOrInvalidSystemPaths','Documents are identified by/with the system fields.' )
            return Promise.reject(mqError)
        }
        this.getPathNamesSystem().forEach(pathID=>{
            systemPathsID[pathID] = findCriteria[pathID];
        })
         
        return new Promise((resolve,reject)=>{
            this.getMongooseModelClass().find(systemPathsID,(error,doc)=>{
                    
                if(error){
                    return reject(new MonqadeError('MongooseError','Mongoose/MongoDB threw error model.find' , error) );
                }
                if(!doc || !doc.length || doc.length !== 1 ){
                    return reject( new MonqadeError("NoMatchingDocumentFound","No Records Found",undefined) ) ;    
                }
                return resolve(new MonqadeResponse(JSON.parse(JSON.stringify(doc)))); // monqade always returns Array .. Return Array will be an issue of 
        
            }).lean();      
        });
    }

    /**
     * Upsert (update or insert) relevant paths 
     * 
     * 
     * **mutation not applicable**
     * 
     * 
     * @param {document} candidateDoc for upsert document. 
     * @returns {Promise} Promise 
     *      Resolves to {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeResponse-MonqadeResponse.html MonqadeResponse } 
     *          or
     *       Rejects as {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeError-MonqadeError.html MonqadeError}
     * 
     * 
     * @description  **Not recommend for general use.**
     * Given the multi-function nature (insert/update) combined with Monqade's 
     * features - it behaves more like a de/muxer and less like a typical function  
     * 
     * see  {@link http://_MQ_DOC_ROOT_/tutorial-doUpsertOne.html upsert} for extended documentation
     * 
     * tmc - completed
     */
    doUpsertOne( candidateDoc){

        // make find criteria     
        let findCriteria;
        const findUnique = LAMBDAS.subDocumentOfPaths(candidateDoc,this.getPathNamesUniqueOption());
        const findSystem = LAMBDAS.subDocumentOfPaths(candidateDoc,this.getPathNamesSystem());
        if(Object.keys(findSystem).length>0 ){
            findCriteria =findSystem;
        }else {
            findCriteria =findUnique;
        }

        if( Object.keys(findCriteria).length == 0 ){
            const mqError = new MonqadeError('MissingOrInvalidDocumentIDs','At least one \'unique\' path require for upsert' )
            return Promise.reject(mqError)
        }


        //build update fields
        const theUpdateDoc = LAMBDAS.subDocumentOfPaths(candidateDoc,this.getPathNamesAll())
        this.getPathNamesSystem().forEach(pathID=>{
            delete theUpdateDoc[pathID];
        })
        if(Object.keys(theUpdateDoc).length == 0){
            const mqError =new MonqadeError('EmptyCandidateDoc','Update contained no updatable fields. No update attempted.' )
            return Promise.reject(mqError)
        }

        const mongooseUpdateOptions = {new:true,upsert:true,runValidators:true, setDefaultsOnInsert:true,lean:true};

        return this._findOneAndUpdate(findCriteria,theUpdateDoc,mongooseUpdateOptions);
    }

        /**
     * Search collection for documents matching criteria 
     * 
     * **mutation not applicable**
     * 
     * @param {QueryBuilder|complexQuery} findCriteria (see example)
     * @param {string[]} projection standard mongoose projection [pathName1, pathName2, ... ].
     * @param {object} options standard mongoose query options {limit:100,...}, override limit by sending {}.
     * @description Fetches 0 or more documents matching criteria. Criteria has an isSearchable restriction.
     * 
     * * Will return paths in projection that are set isProjectable=true and system paths
     * * Will append systemPaths to projection.
     * * Will search **only** paths in findCriteria that are set isSearchable=true
     * * Search criteria **can be any valid mongoDB operator** ($gt, $regex, $lt, etc )
     * * doFindMany  will search *any* path with *only* equality operator
     * * doQueryMany will search *only* searchable paths with *any* search operator 
     * 
     * * findCriteria can be QueryBuilder or complex query 
     * 
     *         QueryBuilder => { toFindObject:()=>{ [_SOME_QUERY_] }}
     *              
     *              OR
     *              
     *        ComplexQuery => {$and:[ {pathID:{$and:[{$lt:value},{$g:value}]}, ...]}
     * 
     * *Complex Query  -  any query with multiple criteria and/or embedded criteria
     * 
     * *QueryBuilder for reasons of backwards compatibility*
     * 
     * @returns {Promise} Promise 
     *      Resolves to {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeResponse-MonqadeResponse.html MonqadeResponse } 
     *          or
     *       Rejects as {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeError-MonqadeError.html MonqadeError}
     * 
     * tmc - completed - 
     */
    doQueryMany(queryBuilder, projection=this.getPathNamesProjectable(),options=this.DEFAULT_QUERY_OPTIONS) {
        return this._doQueryMany(queryBuilder, projection,options,'find');
    }

        /**
     * Search collection for documents matching criteria 
     * 
     * **mutation not applicable**
     * 
     * @param {document} findCriteria contains key:value document used as search criteria.
     * @param {string[]} projection standard mongoose projection {pathNameA:1,pathNameB:1,...}.
     * @param {object} options standard mongoose query options {limit:100, skip:n, ...}, override limit by sending {}.
     * @description  Fetches 0 or more documents matching criteria. 
     * 
     * * Will return all paths in projection - regardless of 'isProjectable'
     * * Will append systemPaths to projection.
     * * Will search any paths in findCriteria - regardless of 'isSearchable'
     * * Will reject if no findCriteria specified
     * * doFindMany  will search *any* path with *only* equality operator
     * * doQueryMany will search *only* searchable paths with *any* search operator 
     * * Search criteria **must only** be ':' {pathID:value} (can not be:  $gt, regEx, $lt, etc. )
     * 
     * *Exception made for path '**createdAt**' - can use $gt,$gte,$lt,$lte -> {createdAt:{$gt:[some date]}}   
     *              
     * * findCriteria  
     *         {pathID1: value1, pathID2: value2, ... }   or   {pathID1: value1, pathID2: value2, createdAt:{$gte:SOME_DATE}, ...}
     * 
     *      
     * @returns {Promise} Promise 
     *      Resolves to {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeResponse-MonqadeResponse.html MonqadeResponse } 
     *          or
     *       Rejects as {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeError-MonqadeError.html MonqadeError}
     * 
     * tmc - completed -  
     */
    doFindMany(findCriteria={} , projection=this.getPathNamesProjectable(),options=this.DEFAULT_QUERY_OPTIONS){
        return this._doFindMany(findCriteria, projection,options,'find')
    }

    /**
     * Fetches single document with single key 'count' representing the number or documents
     * that would be find using same findCriteria with doFindMany 
     * 
     * **mutation not applicable**
     * 
     * @param {document} findCriteria contains key:value document used as search criteria.
     * @description  Fetches single document containing key:value pair {count:N}
     * where N is the number of documents doFindMany would return given same findCriteria
     * 
     *     MonqadeResponse.documents[0] -> {count:N}
     * 
     * **see doFindMany** for details about findCriteria
     * 
     * * Not very efficient - should be used with caution.
     *      
     * @returns {Promise} Promise 
     *      Resolves to {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeResponse-MonqadeResponse.html MonqadeResponse } 
     *          or
     *       Rejects as {@link http://_MQ_DOC_ROOT_/module-monqade-shared_MonqadeError-MonqadeError.html MonqadeError}
     * 
     * tmc - completed -  
     */
    doFindManyCount(findCriteria={} ){
        return this._doFindMany(findCriteria,undefined,undefined,'countDocuments');
    }

    /**
     * Fetches single document with single key 'count'
     * 
     * \{count:N\}  N is the number of documents doQueryMany will return if running the same findCriteria
     * 
     * * Not very efficient - should be used with caution.
     * * findCriteria has same restrictions as doQueryMany
     * 
     * see {doQueryMany} for further detials.
     * 
     * **mutation not applicable**
     * 
     * 
     * @link {MonqadeResponse}
     * @link {MonqadeError}
     * 
     * @param {QueryBuilder|complexQuery} findCriteria (see {doQueryMany})
     * @returns {Promise} Promise Resolves to {MonqadeResponse} or Rejects as {MonqadeError}
     * 
     * tmc -completed
     */
    doQueryManyCount(queryBuilder ){
        return this._doQueryMany(queryBuilder,undefined,undefined,'countDocuments')
    }


        /**
     * Get all searchable path names with data type.
     * @returns {object} *{pathName: dataType, ...}* All searchable paths data type
     * @description
     * 
     * **mutability: returns a copy**
     * 
     * Primarily for QueryBuilders.
     * 
     * tmc - completed
     */
    getSearchablePathNamesWithTypes(){
        const pathTypes ={}; 

        const searchablePaths = this.getPathNamesSearchable();
        searchablePaths.forEach(pathID=>{
            pathTypes[pathID] = this._getPathOptions(pathID).type;// _paths[pathID].type;
        });

        return pathTypes;
    }
        /**
     * Create document with test data for doInsertOne
     * @returns {document}
     * @description To assist developer with test data generation
     * 
     *      const newDoc = mqSchema.createTestDocumentForInsert();
     *      mqSchema.doInsertOne(newDoc)
     *          .then(mqResponse => { ... stuff })
     *          .catch(mqError => { ... other stuff});
     * 
     * **mutability: returns generated document**
     * tmc -completed
     */
    createTestDocumentForInsert(){
        return this._createTestRecord(this.getPathNamesQuery({isInsertable:true}));
    }

    /**
     * Create document with test data for doUpdateOne
     * @returns {document}
     * @description To assist developer with test data generation
     * 
     *      const newDoc = mqSchema.createTestDocumentForUpdate();
     *      mqSchema.doUpdateOne(newDoc)
     *          .then(mqResponse => { ... stuff })
     *          .catch(mqError => { ... other stuff});
     * 
     * **mutability: returns generated document**
     * tmc -completed
     */
    createTestDocumentForUpdate(){
        return this._createTestRecord(this.getPathNamesQuery({isUpdatable:true}));
    }

    /**
     * Create document with test data 
     * @returns {document}
     * @description To assist developer with test data generation 
     *      
     * **mutability: returns generated document**
     * tmc -completed
     */
    createTestDocument(){
        return this._createTestRecord(this.getPathNamesAll());
    }

    /**
     * Get path names matching property query 
     * @param {Object} criteriaQuery  exp: {isUpdate:true,isSelectable:false,...}
     * @return {string[]}  Path names that match criteriaQuery 
     * **mutability: returns a copy**
     * 
     * @desc This is less efficient but more powerful than the getPathNames\[Property\]\(\)
     * 
     * **criteriaQuery** exp: 
     * 
     *      mqSchema.getPathNamesQuery({isSearchable:true,isProjectable:false})
     * 
     * tmc - completed 
     */
    getPathNamesQuery(criteriaQuery={}){
        //const criteriaQuery = {isUpdatable:true,isInsertable:false, ... }

        const fieldNames =[];


        Object.entries(this._mongooseSchema.paths).forEach(([pathName,path])=>{
            if(LAMBDAS.objectIsSubset(criteriaQuery,path.options)){
                fieldNames.push(pathName)
            }
        });
        
        return fieldNames;
    }
    /**
     * Get all path names
     * @returns {string[]}
     * 
     * **mutability: returns a copy**
     * tmc - completed
     */
    getPathNamesAll(){
        return Object.keys(this._mongooseSchema.paths);
    }
    /**
     * Get path names having the 'unique' options set true
     * @returns {string[]}
     * 
     * **mutability: returns a copy**
     * 
     * 
     * tmc - completed
     */
    getPathNamesUniqueOption(){
        return this._getPathNamesByProperty('unique',true);
    }
    /**
     * Get path names having isProjectable set true
     * @returns {string[]} pathNames
     * @desc
     * **immutable**
     * 
     * tmc - completed 
     */
    getPathNamesProjectable(){
        return this._getPathNamesByProperty('isProjectable')
    }
    /**
     * Get path names having isSearchable set true
     * @returns {string[]}  names of paths
     * @desc
     * **mutability: returns a copy**
     * 
     * 
     * tmc - completed 
     */
    getPathNamesSearchable(){
        return this._getPathNamesByProperty('isSearchable')
    }

    /**
     * Get path names having isUpdatable set true
     * @returns {string[]}  names of paths
     * @desc
     * **mutability: returns a copy**
     * 
     * 
     * tmc - completed 
     */
    getPathNamesUpdatable(){
        return this._getPathNamesByProperty('isUpdatable')
    }
    /**
     * Get path names having isInsertable set true
     * @returns {string[]}  names of paths
     * @desc
     * **mutability: returns a copy**
     * 
     * tmc - completed 
     */
    getPathNamesInsertable(){
        return this._getPathNamesByProperty('isInsertable')
    }

    /**
     * Get path names having isRequired or required property set to true
     * @returns {string[]}  names of paths
     * @desc
     * **mutability: returns a copy**
     * 
     * tmc - completed 
     */
    getPathNamesRequired(){
        return this._getPathNamesByProperty('isRequired')
    }

    /**
     * Get path names of all systemFields 
     * @returns {string[]}  names of paths
     * @desc
     * **mutability: returns a copy**
     * 
     * tmc - completed 
     */
    getPathNamesSystem(){
        return this._getPathNamesByProperty('isSystem')
    }

    /**
     * Get path names having isProjectable set false
     * @returns {string[]}  names of paths
     * @desc
     * **mutability: returns a copy**
     * 
     * tmc - completed 
     */
    getPathNamesNonProjectable(){
        return this._getPathNamesByNonProperty('isProjectable')
    }
    /**
     * Get path names having isInsertable set false
     * @returns {string[]}  names of paths
     * @desc
     * **mutability: returns a copy**
     * 
     * tmc - completed 
     */
    getPathNamesNonInsertable(){
        return this._getPathNamesByNonProperty('isInsertable')
    }
    /**
     * Get path names having isUpdatable set false
     * @returns {string[]}  names of paths
     * @desc
     * **mutability: returns a copy**
     * 
     * tmc - completed 
     */
    getPathNamesNonUpdatable(){
        return this._getPathNamesByNonProperty('isUpdatable')
    }
    /**
     * Get path names having isSearchable set false
     * @returns {string[]}  names of paths
     * @desc
     * **mutability: returns a copy**
     * 
     * tmc - completed 
     */
    getPathNamesNonSearchable(){
        return this._getPathNamesByNonProperty('isSearchable')
    }
    /**
     * Get path names having isRequired set false
     * @returns {string[]}  names of paths
     * @desc
     * Note:  (isRequire==true || require==true) -> isRequired is true
     * anything else isRequired is false
     * 
     * **mutability: returns a copy**
     * tmc ** not complete - need to verify isRequire vs required logic
     */
    getPathNamesNonRequired(){
        return this._getPathNamesByNonProperty('isRequired')
    }


}

module.exports =MonqadeSchema;