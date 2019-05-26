"use strict";
// const MonqadeShared = require('monqade-shared'); 
const MonqadeShared = require('./monqade-shared.js'); 

const LAMBDAS = MonqadeShared.LAMBDAS;
const MonqadeError = MonqadeShared.MonqadeError;
const MonqadeResponseSearch = MonqadeShared.MonqadeResponseSearch;
const MonqadeResponse = MonqadeShared.MonqadeResponse; 
const schemaVersionKeyPathTemplate =MonqadeShared.schemaVersionKeyPathTemplate;
const systemPathTemplate =MonqadeShared.systemPathTemplate; 






const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const SYSTEM_PATHS_NAMES = ['createdAt','updatedAt','_id']; // a few more to come.

/**
 * @classdesc **DO NOT USE** only purpose is to trick documentation generator to create groups.
 * @class MonqadeSchemaPrivate
 * @abstract
 * @hideconstructor
 * @description Trick documentation generator make groups.
 * Does not get exported and serves no purpose other to help documentation generator seperate
 * private methods for public methods
 */
 class MonqadeSchemaPrivate {}

/**
 * Facade for mongoose.. enforce uniformity and simplification of basic CRUD operations
 * @class MonqadeSchema
 * @description Facade for mongoose.. enforce uniformity and simplification of basic CRUD operations
 * 
 * See [MonqadePath]{@tutorial MonqadePath}, [MonqadeSchemaExample]{@tutorial MonqadeSchemaExample} and {@link https://mongoosejs.com/docs/schematypes.html MongooseSchemaType}.
 * 
 * @param {JSON} schemaPaths - any MongooseSchemaType + Monqade options
 * @param {JSON} schemaOptions - any Mongoose schema option + Monqade Schema options
 * @param {Mongoose.Connection} mongooseRef - active/live Mongoose.Connection
 */
class MonqadeSchema{
    
    constructor(schemaPaths,schemaOptions,mongooseRef){
        const _schemaPathsActual = Object.assign({},schemaPaths);
//        const sOptions = Object.assign({},schemaOptions);
        this._schemaOptions = Object.assign({},schemaOptions);
        this._schemaOptions['docVersionKeyName'] = this._schemaOptions['versionKey'] || '__v'; 
        //mongoose adds __v (or however it's defiend),  monqade adds '_schemaVersionKey'

        _schemaPathsActual['_schemaVersionKey']=schemaVersionKeyPathTemplate;    

        this._collectionName = schemaOptions['collection'];
        this._systemPathNames =SYSTEM_PATHS_NAMES.slice(); 
        this._systemPathNames.push('_schemaVersionKey');// committed to this name now.
        this._systemPathNames.push(this._schemaOptions['docVersionKeyName']); // committed to this name now.

        // to fit the is[Something] pattern - schema uses 'isRequired'
        // while mongo/ose enforces 'required'
        Object.entries(_schemaPathsActual).forEach(([pathName,path])=>{
            if(path.required || path.isRequired){
                path.required=true;
            }// documentation commits use to !required && !require-> !required
            //  all else required=true;
 
        });
 

        this._mongooseRef = mongooseRef;
        this._mongooseSchema =  new Schema(_schemaPathsActual,this._schemaOptions);
        this._modelClass = undefined;
        this._useRestrictiveSearch=true;

        // this creates the model - but also creates the need for  a singleton (can only compile schema - 1 time)
        this.getMongooseModelClass();   //<-- important. Mongoose only adds doc version path after 
                                        // model has been created.  Querying paths prior to model creation
                                        // results in undefined path for docVersion

        const debug =this._mongooseSchema.paths;
        const debugKeys =Object.keys(this._mongooseSchema.paths);
    
        Object.entries(this._mongooseSchema.paths).forEach(([pathID,path])=>{
            // documentation says, for inspection use
            // [MongooseSchema].path('name')  
            // https://mongoosejs.com/docs/schematypes.html
            // does not say anything about direct edit or replace. 
            //if(! (pathID in _schemaPathsActual) ){
            if(   this._systemPathNames.indexOf(pathID)>=0 ){
                this._mongooseSchema.paths[pathID].options  =Object.assign({name:pathID}, systemPathTemplate,this._mongooseSchema.paths[pathID].options)
            }else{ 
                path.options.isSystem =false;
            }
         });
         const x='3';

     }
     get schemaDocumentation() {
        return this._schemaOptions['documentation'];
     }
     get docVersionKeyName(){
      // mongoose's __v  but name can change by changing schema.options.versionKey
        return this._schemaOptions['docVersionKeyName'];
    } 


    get systemPathNames(){return this._systemPathNames;}  


    /**
     * 
     * By default Monqade only allows searchMany/findMany
     * to search fields isSearchable=true.
     * 
     * Set this false to override this behavior and search any fields.
     * 
     * **returns** Mongoose's path options for given path name
     * @property {boolean} useRestrictiveSearch - false -> allow search of all fields (not only isSearchable=true)
     */    
    get useRestrictiveSearch(){ return this._useRestrictiveSearch;}
    set useRestrictiveSearch(val){ this._useRestrictiveSearch = val;}

    get DEFAULT_QUERY_OPTIONS(){
        return {
            limit:100
        }
    }
    /**
     * 
     * Helper function to fetch path options for a given path
     * 
     * **non-mutable**
     * 
     * **returns** Mongoose's path options for given path name
     * @param {string} pathName path name
     * @return {object} 
     */
    getPathOptions(pathID){
        return Object.assign({},this._mongooseSchema.paths[pathID].options);
    }

    /**
     * Get all  *searchable*  path names with  their type.
     * 
     * primarily for QueryBuilders.  if useRestrictiveSearch= true (default), 
     *      returns only paths isSearchable=true.  Otherwise returns all paths.
     * 
     * 
     * **returns**  *searchable* path names with type {pathName:type}
     * @return {JSON} {pathName:type}
     */
    getSearchablePathNamesWithTypes(){
        const pathTypes ={}; 

        const searchablePaths = this._getSearchPaths();

        searchablePaths.map(pathID=>{
            pathTypes[pathID] = this._getPathOptions(pathID).type;// _paths[pathID].type;
        });

        return pathTypes;
    }

    /**
     * Get Mongoose.Model class.
     * 
     * returned class is suitable for making model instances
     * 
     * **returns** Mongoose model class (**class** not **instance**)
     * 
     * @example <caption>Example usage of .getMongooseModelClass()</caption>
     * 
     * const TheModel=monqadeSchema.getMongooseModelClass();
     * const myDocument= new TheModel({document});
     * 
     * myDocument.save()
     * // or any other Mongoose model method/property
     *  
     * @return {Mongoose.Model} {class}
     */
    getMongooseModelClass(){
        // can't be a property because accidently calling it
        if(! this._modelClass){
            this._modelClass= this._mongooseRef.model(this._collectionName,this._mongooseSchema);

        }
        return this._modelClass;
    }

    /**
     * Get the collection name.  Should be the same as mongoDB's collection name
     * 
     * 
     * **returns** Get the collection name
     * @return {string} collectionName
     */
    get collectionName(){
        return this._collectionName;
    }

    /**
     * Get the in-use Schema Version Key.
     * 
     * **returns** current schema version
     * @return {string} schemaVersionKey
     */
    get schemaVersionKey(){
        return this._mongooseSchema.options['_schemaVersionKey'];
    }
    

    /**
     * Get all path names
     * 
     * **returns** all names of all the paths
     * @returns {string[]}  
     */
    getPathNamesAll(){
        return Object.keys(this._mongooseSchema.paths);
    }
    getPathNamesUniqueOption(){
        return this._getPathNamesByProperty('unique',true);
    }
        /**
     * 
     * Helper function for getPathNames\[property\]\(\)
     * Get path names with \[property\] set to true|false
     * 
     * 
     * supported properties: [ isSearchable | isProjectable | isUpdatable | isInsertable | isRequired ]
     * 
     * 
     * **returns** path names matching given criteria (is\[Property]=\[true|false\]) 
     * @memberof MonqadeSchemaPrivate
     * @param {string} property supported properties 
     * @param {boolean} isTrueFalse 
     * @return {string[]} Path names 
     * @private    
     */
    _getPathNamesByProperty(property,isTrueFalse=true){  // returns field names with is[Insertable|Updateable|...]
        let propertyKey =property;
        if(!isTrueFalse){
            propertyKey = 'not' + propertyKey;
        } 

        if(this._fieldNamesByProperty[propertyKey] === undefined){
            const fieldNames =[];
            Object.entries(this._mongooseSchema.paths).forEach(([pathName,path])=>{
                if(path.options[property] ===isTrueFalse){
                    fieldNames.push(pathName)
                }
            });
            this._fieldNamesByProperty[propertyKey] = fieldNames;
        } 
        return this._fieldNamesByProperty[propertyKey].slice(); // copyOf
    }

    /**
     * 
     * Get path names matching property query 
     * @desc This is less efficient but more powerful than the getPathNames\[Property\]
     * 
     * **criteriaQuery** exp: { isUpdate:true, isSelectable:false, ... }
     * 
     * **returns** an array of path names matching given criteria query
     * @param {JSON} criteriaQuery  exp: {isUpdate:true,isSelectable:false,...}
     * @return {string[]}  Path names that match criteriaQuery 
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
     * 
     * Helper function to fetch path options for a given path
     * 
     * **mutable**
     * 
     * **returns** Mongoose's path options for given path name 
     * @memberof MonqadeSchemaPrivate
     * @param {string} pathName path name
     * @return {object} 
     * @private    
     */
    _getPathOptions(pathName){
        return this._mongooseSchema.paths[pathName].options;
        // return this.mongooseSchema.paths[pathName].options;
    }


    /**
     * 
     * Helper function to determine if the document has the required system paths
     * @Desc update/delete require that a request has matching system
     * paths as the document to be effected.  
     * 
     * Simply does the request document have the required system paths
     * @memberof MonqadeSchemaPrivate
     * @param {string} doc request (update/delete) document
     * @return {boolean}  
     * @private    
     */
    _hasValidSystemFields(doc){
        if(!doc){
            return false;
        }
        for(let pathID of this.getPathNamesSystem()){
            if( doc[pathID] === undefined ){
                return false;
            }
        }

        if(! LAMBDAS.isValidMongoID(doc['_id'])) {
            return false;
        }
        return true;        
    }
    /**
     * 
     * Helper function to determine if the document has the required system paths
     * @Desc primary to determin insert-safe
     *   
     * Not really documented
     * 
     * 
     * @param {JSON} doc 
     * @return {boolean}  
     * @private    
     */
    hasAnySystemField(doc) {
        let found = false;
        this.getPathNamesSystem().forEach(pathID=>{
            if(pathID in doc){
                found = true;
            }
        })
        return found;
   }
    /**
     * 
     * Helper function convert projection from array form to object form
     * adding system paths
     * 
     * **Prepends system paths**
     * 
     * **returns** {pathNameA:1, pathNameB:1, ... } 
     * @memberof MonqadeSchemaPrivate
     * @param {string[]} projection
     * @return {JSON}  
     * @private    
     */
    _inflateProjection(proposedProjection = this.getPathNamesProjectable()){
        // prepends systemPaths as required

        const effectiveProject = this.getPathNamesSystem().concat(proposedProjection);
        return  LAMBDAS.objectFromArrayOfKeys(effectiveProject,1);
    }

    /**
     * 
     * Monqade allows only String, Boolean, Date, Number values as search criteria
     * @memberof MonqadeSchemaPrivate
     * @param {any} projection
     * @return {Boolean}  
     * @private    
     */
    _isValidSearchValue(v){
        if(typeof v === 'string'){
            return true;
        }else if(typeof v === 'date'){
             return true;
        }else if(typeof v === 'boolean'){
            return true;
        }else if(typeof v === 'number'){
             return true;
        }
        return false;
     }
 


    /**
     * 
     * Helper function encapsulates Mongoose 'find(..)'
     * 
     * Primarily used with doFindMany and doSearchMany
     * 
     * **returns** Promise that will either resolve as MonqadeResponseSearch 
     * or reject with MonqadeError
     * 
     * @memberof MonqadeSchemaPrivate
     * @param {string[]} pathNames for the return document
     * @return {Promise} document suitable for update
     * @private    
     */
    _promiseToFindMany(findCriteria,projection,options){
        return new Promise((resolve,reject)=>{

            this.getMongooseModelClass().find(findCriteria,projection,options,(error,docs)=>{
                if(error){
                    // console.log('Test validation error\n also try to frame this as a native promise')
                    // return reject(new MonqadeError('MongooseUnknownError','Mongoose/MongoDB threw unknown error' , error));

                    const errorCode =(error.name === 'ValidationError')? 'MongooseValidationError' : 'MongooseOtherError';     
                    return reject( new MonqadeError(errorCode,'Mongoose/MongoDB threw validation error' , error) );

                }
                return resolve(new MonqadeResponseSearch(docs,findCriteria));
            }).lean();      
        });        
    }

        /**
     * 
     * Create document with test data for doInsertOne
     * 
     * **Testing Purposes Only**
     * 
     * **returns** JSON document to be used for doInsertOne(...)
     * @return {JSON} document suitable for insert 
     */
    createTestDocumentForInsert(){
        return this._createTestRecord(this.getPathNamesQuery({isInsertable:true}));
    }
    /**
     * 
     * Create document with test data for doUpdateOne
     * 
     * **Testing Purposes Only**
     * 
     * **returns** JSON document to be used for doUpdateOne(...)
     * @return {JSON} document suitable for update
     */
    createTestDocumentForUpdatable(){
        
        return this._createTestRecord(this.getPathNamesQuery({isUpdatable:true}));
    }
    createTestDocumentForUpdate(){
        return this.createTestDocumentForUpdatable();
    }
    /**
     * 
     * Create document with test data
     * 
     * **Testing Purposes Only**
     * 
     * **Caution** paths without a 'makeTestData()' will be set to null
     * Use with caution.  Better to use createTestDocumentForInsert 
     * or createTestDocumentForUpdate 
     * 
     * **returns** JSON document 
     * @return {JSON} document 
     */
    createTestDocument(){
        
        return this._createTestRecord(this.getPathNamesAll());
    }

    /**
     * 
     * Create document with test data of pathIDs
     * 
     * **Testing Purposes Only**
     * 
     * **Caution** paths without a 'makeTestData()' will be set to null
     * Use with caution.  Better to use createTestDocumentForInsert 
     * or createTestDocumentForUpdate 
     * 
     * **returns** JSON document 
     * @return {JSON} document 
     */
    createTestDocumentWithPathIDs(pathIDs){
        
        return this._createTestRecord(pathIDs);
    }

    /**
     * 
     * Helper function for creating documents with test data.
     * 
     * **returns** JSON document suitable for test purposes
     * @memberof MonqadeSchemaPrivate
     * @param {string[]} pathNames - Path names to include in return document
     * @return {JSON}
     * @private    
     */
    _createTestRecord(pathNames){
        const testRecord = {};
        pathNames.forEach( pathName => {
            if(this._getPathOptions(pathName).makeTestData){
                testRecord[pathName] = this._getPathOptions(pathName).makeTestData();
            }else {
                testRecord[pathName] = null;

            }
        });

        return testRecord;
    }

    /**
     *
     * Update relevant paths to existing document
     * @link {MonqadeResponse}
     * @link {MonqadeError}
     * @param {JSON} updateCandidateDoc contains JSON for update document 
     * @description updateCandidateDoc a JSON doc. Only paths marked as 'isUpdated' eg .getPathNamesUpdatable() 
     * will be updated
     * @memberof MonqadeSchema
     * @returns {Promise} Promise Resolves to {MonqadeResponse} or Rejects as {MonqadeError}
     */
    doUpdateOne( updateCandidateDoc){

        //findCriteria
        if( ! this._hasValidSystemFields(updateCandidateDoc) ){
            const mqError = new MonqadeError('MissingOrInvalidSystemPaths','Documents are identified by/with the system fields.' )
            //return LAMBDAS.rejectedPromise(mqError)
            return Promise.reject(mqError)
        }
        const findCriteria = LAMBDAS.subDocumentOfPaths(updateCandidateDoc,this.getPathNamesSystem());

        //build update fields
        const theUpdateDoc = LAMBDAS.subDocumentOfPaths(updateCandidateDoc,this.getPathNamesUpdatable())
        if(Object.keys(theUpdateDoc).length == 0){
            const mqError =new MonqadeError('EmptyCandidateDoc','Update contained no updatable fields. No update attempted.' )
            //return LAMBDAS.rejectedPromise(mqError)
            return Promise.reject(mqError)
        }
        const mongooseUpdateOptions = {new:true,runValidators:true};

        return this._findOneAndUpdate(findCriteria,theUpdateDoc,mongooseUpdateOptions);
    }
    /**
     *
     * Upsert (update or insert) relevant paths 
     * @link {MonqadeResponse}
     * @link {MonqadeError}
     * @param {JSON} candidateDoc contains JSON for upsert document 
     * @description candidateDoc a JSON doc. **Caution** this feature/function undermines
     * the purpose of doInsertOne (isInsertable) and doUpdateOne (isUpdatable).  **RoadMap**
     * make 'doUpdateOne' conditional on 'useRestrictive'.  **Caution** should use 
     * some field with the unique property
     *  + will fail if no foreignID is provided
     *  + will update if foreignID provided, exists, and path values are different (check this)
     *  + will insert if foreignID provided, and does not exist
     * 
     * 
     * @memberof MonqadeSchema
     * @returns {Promise} Promise Resolves to {MonqadeResponse} or Rejects as {MonqadeError}
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

    _findOneAndUpdate(findCriteria, theUpdateDoc, mongooseUpdateOptions){
        return new Promise((resolve,reject)=>{
            this.getMongooseModelClass().findOneAndUpdate(findCriteria,theUpdateDoc,mongooseUpdateOptions)
                .then((modifiedDoc) =>{
                    if(!modifiedDoc){
                        const err = new MonqadeError('NoMatchingDocumentFound',
                                    '_id, updatedAt, createdAt, __v,  failed match. ');
                        return reject(err );
                    }
                    const modifiedDocJSON = JSON.parse( JSON.stringify(modifiedDoc));
                    return resolve(new MonqadeResponse([modifiedDocJSON])); // monqade always returns Array 

                }).catch(error=>{
                    const errorCode =(error.name === 'ValidationError')? 'MongooseValidationError' : 'MongooseOtherError';     
                    return reject( new MonqadeError(errorCode,'Mongoose/MongoDB threw validation error' , error) );
          
                });
        }); // returned promise
    }

    /**
     *
     * Insert a document
     * @link {MonqadeResponse}
     * @link {MonqadeError}
     * @param {JSON} candidateDoc contains key:value JSON document to be inserted. 
     * @description candidateDoc a JSON doc. 
     * @memberof MonqadeSchema
     * @returns {Promise} Promise Resolves to {MonqadeResponse} or Rejects as {MonqadeError}
     */
    doInsertOne(candidateDoc){
        // Similar to Mongoose 'strict' mode.  Insert only paths indicated with isInsertable=true.
        // extending Mongoose's feature we have the ability to 'hide' fields that are system insertable
        // but not part of outward-facing API.  

        // EmptyCandidateDoc -> insertable but not required? default.
        const theNewDoc = LAMBDAS.subDocumentOfPaths(candidateDoc,this.getPathNamesInsertable())
        if(Object.keys(theNewDoc).length == 0){
            const mqError =new MonqadeError('EmptyCandidateDoc','Insert document contained no insertable paths. No insert attempted.' )
            //return LAMBDAS.rejectedPromise(mqError);
            return Promise.reject(mqError)

        }

        // Monqade system guarantee -
        theNewDoc['_schemaVersionKey'] = this.schemaVersionKey;

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

    _getSearchPaths(){
        if(this.useRestrictiveSearch){
            return this.getPathNamesQuery({isSearchable:true}); 
        }else{
            return  this.getPathNamesAll(); 
        }
    }

    /**
     *
     * FindMany will search *ANY* path 
     * QueryMany will search only searchable paths
     * 
     * Fetches 0 or more documents matching criteria
     * Criteria has an equality restriction.  (no:  greater than, like, lt, etc. )
     * @link {MonqadeResponse}
     * @link {MonqadeError}
     * @param {JSON} findCriteria contains key:value document used as search criteria.
     * @param {JSON} projection standard mongoose projection {pathNameA:1,pathNameB:1,...}.
     * @param {JSON} options standard mongoose query options {limit:100,...}, override limit by sending {}.
     * @description Fetches 0 or more documents matching criteria. Criteria has an equality restriction.  
     *              (no:  greater than, like, lt, etc. )
     *              mongoose will quietly disregard nonPaths in projection but allow any valid paths
     *              monqade will quietly disregard nonProjectables in the projection effectively allow for hidden fields.
     * 
     * -quietly disregard search values that are not: String, Boolean, Number, Date
     * 
     * @memberof MonqadeSchema
     * @returns {Promise} Promise Resolves to {MonqadeResponse} or Rejects as {MonqadeError}
     */
    doFindMany(findCriteria={} , projection=this.getPathNamesProjectable(),options=this.DEFAULT_QUERY_OPTIONS){

        const qry = Object.create({});
        const prj =this._inflateProjection(projection); //Object.assign(projection);

        // const searchPaths =  this._getSearchPaths();
        const searchPaths =this.getPathNamesAll(); //

        searchPaths.forEach((pathName)=>{
            if( this._isValidSearchValue(findCriteria[pathName]) ){
                qry[pathName] = findCriteria[pathName];
            }
        });

        if(Object.keys(qry).length == 0){
            //return LAMBDAS.rejectedPromise(new MonqadeError('EmptyFindCriteria','findMany no searchable fields supplied' ));
            return Promise.reject(new MonqadeError('EmptyFindCriteria','findMany no searchable fields supplied' ))

        }

        return this._promiseToFindMany(qry,prj,options);
    }





    /**
     *
     * Fetches 0 or more documents specified with QueryBuilder.toFindObject()
     * QueryBuilder's implement a pseudo interface and believed to be 'trusted' that
     * no non-searchable fields will be used.  *Warning* This is a bit of unintended back-door.
     * 
     * @link {MonqadeResponse}
     * @link {MonqadeError}
     * @param {QueryBuilder} queryBuilder QueryBuilder's implement a pseudo interface .
     * @param {JSON} projection standard mongoose projection [pathNameA, pathNameB, ...]
     * @param {JSON} options standard mongoose query options {limit:100,...}, override limit by sending {}.
     * @description Fetches 0 or more documents specified with QueryBuilder.toFindObject()
     *              QueryBuilder's implement a pseudo interface and believed to be 'trusted' that
     *              no non-searchable fields will be used.  *Warning* This is a bit of unintended back-door.
     *              pseudo interface  will pass: MonqadeSchema.isTrustedQueryBuilder(queryBuilder).
     * 
     *              doQueryMany is mean to move the more complex search from this MonqadeSchema
     *              to other independent extensions. As such the method does some minimal verification
     *
     *              All queryBuilders are required to implement the pseudo interface MonqadeSchema.isTrustedQueryBuilder(queryBuilder).
     * 
     * @memberof MonqadeSchema
     * @returns {Promise} Promise Resolves to {MonqadeResponse} or Rejects as {MonqadeError}
     */
     doQueryMany(queryBuilder, projection=this.getPathNamesProjectable(),options=this.DEFAULT_QUERY_OPTIONS){

        if(! MonqadeSchema.isTrustedQueryBuilder(queryBuilder)){
            //return LAMBDAS.rejectedPromise( new MonqadeError('NonTrustedQueryBuilder','Given query builder fails test:MonqadeSchema.isTrustedQueryBuilder(queryBuilder)'  ));
            return Promise.reject( new MonqadeError('NonTrustedQueryBuilder','Given query builder fails test: MonqadeSchema.isTrustedQueryBuilder(queryBuilder)'  ))

        }

        if(queryBuilder.termCount() == 0){
            //return LAMBDAS.rejectedPromise(new MonqadeError('EmptyFindCriteria','queryMany no searchable fields supplied' ))
            return Promise.reject(new MonqadeError('EmptyFindCriteria','queryMany no searchable fields supplied' ))

        }

        const qry = Object.assign(queryBuilder.toFindObject());
        const prj = this._inflateProjection(Object.assign(projection));        


        return this._promiseToFindMany(qry,prj,options);
    }

    /**
     *
     * Fetches a single JSON document identified by '_id';
     * 
     * @link {MonqadeResponse}
     * @link {MonqadeError}
     * @param {JSON} idObject {_id:VALID_MONGO_ID}
     * @description  none supplied
     *              
     *              
     * @memberof MonqadeSchema
     * @returns {Promise} Promise Resolves to {MonqadeResponse} or Rejects as {MonqadeError}
     */
    doFindOne(idObject={}){
        const _ID =Object.assign(idObject);// {_id:idObject['_id']};

        if(! LAMBDAS.isValidMongoID(_ID['_id'])  ){
            return Promise.reject( new MonqadeError('MissingOrInvalidDocumentIDs',`Supplied _id: '${_ID['_id']}' is not valid` ))

        }

        return new Promise((resolve,reject)=>{
                // const ModelClass = this.getMongooseModelClass();
            this.getMongooseModelClass().findById(_ID,(error,doc)=>{
                    
                if(error){
                    return reject(new MonqadeError('MongooseError','Mongoose/MongoDB threw error model.find' , error) );
                }

                if(LAMBDAS.isObject(doc) ){ 
                    // dont love the parse(stringify(doc)) but can seem to get simple JSON any other way
                    return resolve(new MonqadeResponse([JSON.parse(JSON.stringify(doc))])); // monqade always returns Array .. Return Array will be an issue of 
                }

                // by definition of findByID - only 1 document is returned - will not test
                if(!doc){
                    return reject( new MonqadeError("NoMatchingDocumentFound","No Records Found",undefined) ) ;    
                }
        
            }).lean();      
        });
    }


    /**
     *
     * Deletes a single document identified by {_id:...,createdAt:..., updatedAt:... [,__v:...]};
     * 
     * @link {MonqadeResponse}
     * @link {MonqadeError}
     * @param {JSON} deleteCandidateDoc {_id:...,createdAt:..., updatedAt:... [,__v:...]}
     * @description Deletes 1 or 0 specified by deleteCandidateDoc
     *              Finding 0 documents is not an error. If confirmation required check 
     *              MonqadeResponse.meta.n (MonqadeResponse.meta is the raw return from mongoose)
     *              MonqadeResponse.documents will be empty array. 
     * @memberof MonqadeSchema
     * @returns {Promise} Promise Resolves to {MonqadeResponse} or Rejects as {MonqadeError}
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

            this.getMongooseModelClass().deleteOne(findCriteria,(error,statusResponse)=>{
                if(error){
                    const newError = new MonqadeError('MongooseError','Mongoose/MongoDB threw error model.deleteOne' , error)
                    return reject(newError );
                }
                if(statusResponse.ok == 1 && statusResponse.n == 0 ){
                    // const newError = new MonqadeError('MongooseError','Delete failed for unknown reason. Check original Error' , error)
                    // return reject(newError );
                    return reject( new MonqadeError("NoMatchingDocumentFound","No Records Found",undefined) ) ;    

                }
 
                if(statusResponse.ok != 1){
                    const newError = new MonqadeError('MongooseError','Delete failed for unknown reason. Check original Error' , error)
                    return reject(newError );
                }
                // delete successful n=1, ok=1 
                // can delete a non document .. n=0, ok=1.  But that is not important for our concerns
                return resolve(new MonqadeResponse([],statusResponse)); // monqade always returns Array of docs  
            });
        });
    }

        /**
     * Pseudo-Interface Checker
     * @memberof module:lambdas
     * @desc
     * *Monqade.doQueryMany()* - allows for third party query builders 
     * to construct the search criteria for a 'find(searchCriteria,...)' call.
     * 
     * .doQueryMany() will use both 'toFindObject()' and 'termCount()'
     * for it's purposes.
     * 
     * **termCount()** -> number of search terms
     * 
     * **toFindObject()** ->  some valid search expression:
     * 
     * search expression like:  {pathID:{$and:{$gt:x,$lt:y}}  - Appropriate
     * 'findCriteria' for mongoose/mongoDB  
     * 
     * **returns** Boolean - true qb implements 'termCount' and 'toFindObject'
     * @param {object} qb - test subject
     * @returns {Boolean}  true if aSubset exists aSuperset, false otherwise
     */
    static isTrustedQueryBuilder(qb){
        // javascript pseudo-interface 
        // Assumption that any object implementing the
        // methods 'termCount' and 'toFindObject' is trusted and
        // little error detection/prevention is done. 
            if(!qb){
                return false;
            }
            // let x = "termCount" in qb ;         
            // let y = "toFindObject" in qb ;         
            if("termCount" in qb && "toFindObject" in qb ){
                return true;
            }
            return false;
        }

} 


module.exports = MonqadeSchema;