"use strict";
/**
 * Useful helper functions.
 * @module monqade-schema
 * 
 * @description
 * A facade/wrapper for Mongoose/MongoDB
 * 
 * Making life 80% better.
 * 
 * Benefits:
 * * Schema Version consistency
 * * CRUD operations consistency and simplicity
 * * Other stuff too
 * 
 * 
 * @example
 * const MonqadeSchema = require('monqade-schema');
 * const childSchema = new MonqadeSchema(pathsDefinition, queryOptions, mongooseRef)
 * 
 * childSchema.doInsertOne(childDocument)
 *      .then(monqadeResponse=>{
 *          ... *do something*
 *      }).catch( monqadeError=>{
 *          ... do something    
 *      })
 * 
 * 
 */



const MonqadeShared = require('monqade-shared'); 
// const MonqadeShared = require('./monqade-shared.js'); 

const LAMBDAS = MonqadeShared.LAMBDAS;
const MonqadeError = MonqadeShared.MonqadeError;
const MonqadeResponseSearch = MonqadeShared.MonqadeResponseSearch;
const MonqadeResponse = MonqadeShared.MonqadeResponse; 
const schemaVersionKeyPathTemplate =MonqadeShared.schemaVersionKeyPathTemplate;
const systemPathTemplate =MonqadeShared.systemPathTemplate; 
const defaultPathTemplate = require('./defaultPathSettings.js');





const mongoose = require('mongoose');
const isValidMongoID = mongoose.Types.ObjectId.isValid;
const Schema = mongoose.Schema;
const SYSTEM_PATHS_NAMES = ['createdAt','updatedAt','_id']; // a few more to come.
const unixtimestamp = () => {
    return (new Date())/1;
}

const defaultSchemaOptions = {
    timestamps:true,
    writeConcern:{ w: 1, j: false},
    versionKey: '_docVersionKey', 
    collection: 'MonqadeNamelessCollection' + unixtimestamp(),
    documentation:'No Schema description supplied.',
    _schemaVersion: 'UNKNOWN'

}



/**
 * Facade for mongoose.. enforce uniformity and simplification of basic CRUD operations
 * 
 * @class MonqadeSchemaBase
 * @description Facade for mongoose.. enforce uniformity and simplification of basic CRUD operations
 * 
 * See [MonqadePath]{@tutorial MonqadePath}, [MonqadeSchemaExample]{@tutorial MonqadeSchemaExample} and {@link https://mongoosejs.com/docs/schematypes.html MongooseSchemaType}.
 * 
 * @param {object} schemaPaths - any MongooseSchemaType + Monqade options
 * @param {object} schemaOptions - any Mongoose schema option + Monqade Schema options
 * @param {Mongoose.Connection} mongooseRef - active/live Mongoose.Connection
 */
class MonqadeSchemaBase {
    
    constructor(schemaPaths,schemaOptions,mongooseRef){
        const _schemaPathsActual = Object.assign({},schemaPaths);
        this._schemaOptions = Object.assign({}, defaultSchemaOptions, schemaOptions);
        this._schemaOptions['docVersionKeyName'] = this._schemaOptions['versionKey'] || '__v'; 
//|| 'UNKNOWN_SCHEMA_VERSION'
        _schemaPathsActual['_schemaVersion']=schemaVersionKeyPathTemplate ;    

        this._collectionName = schemaOptions['collection']   ;

        this._systemPathNames =SYSTEM_PATHS_NAMES.slice(); 
        this._systemPathNames.push('_schemaVersion');// committed to this name now.
        this._systemPathNames.push(this._schemaOptions['docVersionKeyName']); // committed to this name now.

        // to fit the is[Something] pattern - schema uses 'isRequired'
        // while mongo/ose enforces 'required'
        Object.entries(_schemaPathsActual).forEach(([pathName,path])=>{
            if(path.required || path.isRequired){
                path.required=true;
            }// documentation commits use to ( !required && !isRequired ) -> !required
            //  all else required=true;
        });
 

        this._mongooseRef = mongooseRef;

        // not a Monqade issue.  Simply tell Mongoose to use MongoDB driver for modifyAndUpdate (mongoose is outdated)
        this._mongooseRef.set('useFindAndModify', false);


        //forces mongoose to use Mongo's more recent driver
        this._mongooseRef.set('useCreateIndex', true);
    

        this._mongooseSchema =  new Schema(_schemaPathsActual,this._schemaOptions);
        this._modelClass = undefined;

        // this creates the model - but also creates the need for  a singleton (can only compile schema - 1 time)
        this.getMongooseModelClass();   //<-- important. Mongoose only adds doc version path after 
                                        // model has been created.  Querying paths prior to model creation
                                        // results in undefined path for docVersion


    
        Object.entries(this._mongooseSchema.paths).forEach(([pathID,path])=>{
            // documentation says, for inspection use
            // [MongooseSchema].path('name')  
            // https://mongoosejs.com/docs/schematypes.html
            // does not say anything about how to direct edit or replace. 
            if(   this._systemPathNames.indexOf(pathID)>=0 ){
                this._mongooseSchema.paths[pathID].options  =Object.assign({},{name:pathID}, systemPathTemplate,this._mongooseSchema.paths[pathID].options)
            }else{ 
                path.options.isSystem =false;
                // path.options = 
                path.options = Object.assign({},defaultPathTemplate, path.options)
                // defaultPathTemplate
            }
         });
        
        this._fieldNamesByProperty = {};         
        this._fieldNamesByProperty['isSystem'] = this.systemPathNames;

    }

    /**
     * Schema documentation (defined with schema)
     * 
     * tmc - completed
     * @type string
     * @readonly
     */
     get schemaDocumentation() {
        return this._schemaOptions['documentation'];
    }

    /**
     * document version key name 
     * Usually '__v' but name can change by setting schema.options.versionKey
     * 
     * tmc - completed
     * @type string
     * @readonly
     */
    get docVersionKeyName(){
      // mongoose's __v  but name can change by changing schema.options.versionKey
        return this._schemaOptions['docVersionKeyName'];
    } 

    /**
     * systemPaths names
     * @type string[] 
     * @description
     * **mutability: returns a copy**
     * 
     * tmc - completed
     * @readonly
     */
    get systemPathNames(){return this._systemPathNames.slice();}  

    /**
     * Default query options
     * 
     * tmc - completed
     * @type object
     * @readonly
     */
    get DEFAULT_QUERY_OPTIONS(){
        return {
            limit:100
        }
    }

    /**
     * collection name used within MonogoDB
     * 
     * tmc - completed
     * @type string
     * @readonly
     */
    get collectionName(){
        return this._collectionName;
    }

    /**
     * Current Schema Version
     * tmc - completed
     * @type string
     * @readonly
     */
    get schemaVersionKey(){
        return this._mongooseSchema.options['_schemaVersion'];
    }
    get schemaVersion(){
        return this._mongooseSchema.options['_schemaVersion'];
    }



    /**
     * Helper function to get path options for a given path
     * @param {string} pathID path name
     * @return {object} see {PathOptions} for more information
     * @desc
     * **mutability: returns a copy**
     * tmc - completed
     */
    getPathOptions(pathID){
        return Object.assign({},this._mongooseSchema.paths[pathID].options);
    }



    /**
     * Class reference to the underlying Mongoose.Model
     * @returns {Mongoose.Model.Reference}
     * @description
     * Exposes **class reference** suitable for making model **instances**
     * **mutability:objectRef**  (by necessity, not by design)
     * 
     * @example
     * 
     * const TheModel=monqadeSchema.getMongooseModelClass();
     * const myDocument= new TheModel({document});
     * 
     * myDocument.save()
     * // or any other Mongoose model method/property
     * 
     * 
     * tmc - completed
     */
    getMongooseModelClass(){
        // can't be a property because of accidentally calling it
        if(! this._modelClass){
            this._modelClass= this._mongooseRef.model(this._collectionName,this._mongooseSchema);

        }
        return this._modelClass;
    }



    /**
     * Helper function to fetch path options for a given path
     * @param {string} pathName path name
     * @returns {objectRef} to the path's options
     * @description
     * **mutability:objectRef**
     * tmc - completed
     * @private
     */
    _getPathOptions(pathName){
        return this._mongooseSchema.paths[pathName].options;
    }


    /**
     * Helper function to determine if the given document has the required system paths
     * @param {object} doc 
     * @return {boolean}  
     * @description  
     *   
     * **mutability:primative type**
     * tmc - completed
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
        
        //if(! LAMBDAS.isValidMongoID(doc['_id'])) {
        if(! isValidMongoID(doc['_id'])) {
            return false;
        }
        if( doc['_schemaVersion'] != this.schemaVersionKey){
            return false;
        }
        return true;        
    }



   /**
     * Helper function convert array projection to object  
     * @param {string[]} projection
     * @return {object} 
     * @description 
     * * Return object is in the form <code>{pathIDa: 1, pathIDb: 1, ...}</code> - value always 1
     * * Does appends system paths
     * 
     * **mutability:new Object**
     * tmc - completed
     * @private    
     */
    _inflateProjection(proposedProjection = this.getPathNamesProjectable()){
        // prepends systemPaths as required
        if(Array.isArray(proposedProjection)) {
            const effectiveProject = this.getPathNamesSystem().concat(proposedProjection);
            return  LAMBDAS.objectFromArrayOfKeys(effectiveProject,1);
        }
        if(LAMBDAS.isObject(proposedProjection)){
            //const effectiveProject = this.getPathNamesSystem();
            const systProj = LAMBDAS.objectFromArrayOfKeys( this.getPathNamesSystem(),1);
            return Object.assign({},proposedProjection,systProj)
        }
        return {}; // I wonder if this is the best course of action.
    }


    /**
     * Monqade allows only String, Boolean, Date, Number values as search criteria
     * @param {any} v search value to examine 
     * @return {boolean} 
     * @description 
     * **mutability: primitive type**
     * tmc -completed
     * @private    
     */
    _isValidSearchValue(v){
        const tOf = typeof v; 
        const allowTypes = ['string','date','boolean','number']
        if(allowTypes.indexOf(tOf) != -1) {
            return true;
        }
        return false;
     }
 


    /**
     * Wrapper to encapsulate Mongoose's 'find(..)'
     * @param {document} findCriteria for the return document
     * @param {string[]} projection desired paths
     * @param {object} options query option (mongoose standard options)
     * @return {Promise} resolves to MonqadeResponseSearch or reject {MonqadeError} 
     * 
     * **mutability: returns a promise -guess it's mutable**
     * 
     * tmc -completed
     * @private    
     */
    _promiseToFindMany(findCriteria,projection,options, findFunctionName ='find' ){
        const theArgs = [];
        findFunctionName = (findFunctionName == 'countDocuments')? 'countDocuments' : 'find';
                
        theArgs.push(findCriteria);

        if(findFunctionName=== 'find'){
            theArgs.push(projection);
            theArgs.push(options);
        }
        return new Promise((resolve,reject)=>{
            //this.getMongooseModelClass().find(findCriteria,projection,options,(error,docs)=>{

            this.getMongooseModelClass()[findFunctionName]( ...theArgs, (error,docs)=>{
                    //findFunction.call(this,findCriteria,projection,options,(error,docs)=>{
                if(error){
                    const errorCode =(error.name === 'ValidationError')? 'MongooseValidationError' : 'MongooseOtherError';     
                    return reject( new MonqadeError(errorCode,'Mongoose/MongoDB threw validation error' , error) );
                }
                if(findFunctionName === 'countDocuments'){
                    return resolve(new MonqadeResponseSearch([{count:docs}],findCriteria));
                }
                return resolve(new MonqadeResponseSearch(docs,findCriteria));

            }).lean();      
        });        
    }

    /**
     * Create document with test data 
     * @param {string[]} pathNames - Path names to include in return document
     * @returns {document}
     * @description Generate document suitable for test/dev purposes
     *      
     * **mutability: returns generated document**
     * tmc -completed
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


    _doFindMany(findCriteria, projection, options, findFunctionName='find'){

        //const qry = Object.create({});
        const prj =this._inflateProjection(projection); //Object.assign(projection);

        const qry = this._buildFindManyFindCriteria(findCriteria);
        // if(qry === undefined ){  currently _buildFindManyFindCriteria always returns a object - need to refactor with *count
        //     // return undefined;
        //     return Promise.reject(new MonqadeError('EmptyFindCriteria','findMany no searchable fields supplied' ))
        // }

        // want to make the distinction between
        if(Object.keys(qry).length == 0){
            return Promise.reject(new MonqadeError('EmptyFindCriteria','findMany no searchable fields supplied' ))
        }
        if(Object.keys(qry).length == 1 && qry['createdAt']){
            return Promise.reject(new MonqadeError('EmptyFindCriteria','findMany no searchable fields supplied' ))
        }

        // return findManyFunction.call(this,qry,prj,options);
        return this._promiseToFindMany(qry,prj,options,findFunctionName);
    }

    /**
     * Helper function generate/filter findCriteria based on input.
     * 
     * * Shared by doFindMany() and doFindManyCount()
     * * Returns undefined on error
     * * Monqade policy - empty findCriteria not allowed - ({}, undefined)
     * 
     * @param {document} findCriteria keyValue pairs 
     * @returns {document|undefined}  keyValue pairs appropriate for doFindMany and doFindManyCount
     * tmc - completed
     * @private
     */
    _buildFindManyFindCriteria(findCriteria) {
        const qry = Object.create({});
        this.getPathNamesAll().forEach((pathName)=>{
            if( this._isValidSearchValue(findCriteria[pathName]) ){
                qry[pathName] = findCriteria[pathName];
            }
        });

        // the only operator allows other than eq (:)
        if(findCriteria['createdAt']){
            qry['createdAt'] = findCriteria['createdAt'];
        }
        // if(Object.keys(qry).length == 0){
        //     return undefined;
        // }
        // if(Object.keys(qry).length == 1 && qry['createdAt']){
        //     return undefined;
        // }

        return qry;
    }




    _doQueryMany(queryBuilder, projection,options, findFunctionName='find') {
        findFunctionName = (findFunctionName == 'countDocuments')? 'countDocuments' : 'find';

        const qry = this._buildQueryManyFindCriteria(queryBuilder);
        const queryKeysAndOps =  LAMBDAS.keysDeep(qry);

        if(! this._isValidQueryOpsAndPaths(queryKeysAndOps)) {
            return Promise.reject(new MonqadeError('IllegalQueryOptionDetected',
                    `QueryBuilder or Query contained an illegal operator or no searchable path` ));
        }   

        const queryPaths = this._extractSearchPathsFromComplexQuery(qry);
        if(queryPaths.indexOf('createdAt')>-1 && queryPaths.length === 1 ){
            return Promise.reject(new MonqadeError('EmptyFindCriteria','queryMany no searchable fields supplied' ))
        }
        if(queryPaths.indexOf('createdAt') === -1 && queryPaths.length ==0 ){
            return Promise.reject(new MonqadeError('EmptyFindCriteria','queryMany no searchable fields supplied' ))
        }

        const prj =this._sanitizeProjection( this._inflateProjection(projection));        
        
        return this._promiseToFindMany(qry,prj,options,findFunctionName);
    }

    /**
     * Helper function generate/filter findCriteria based on input.
     * 
     * * Shared by doQueryMany() and doQueryManyCount()
     * * Returns undefined on error
     * * Monqade policy - empty findCriteria not allowed - ({}, undefined)
     * 
     * @param {document} findCriteria keyValue pairs 
     * @returns {document|undefined}  keyValue pairs appropriate for doQueryMany and doQueryManyCount
     * tmc - completed
     * @private
     */
    _buildQueryManyFindCriteria(queryBuilder) {
        if(queryBuilder && typeof queryBuilder.toFindObject  === 'function'){
            return Object.assign({},queryBuilder.toFindObject());
        }
        return  Object.assign({},queryBuilder);
    }


    /**
     * Get search paths IDs from a given complex query
     * @param {object} qry complex query (recursive object)
     * @returns {string[]} pathIDs
     * 
     * 
     * tmc - completed 
     * @private
     */
    _extractSearchPathsFromComplexQuery(qry){
        const queryKeysAndOps =   LAMBDAS.keysDeep(qry);
        const searchablePaths = this.getPathNamesSearchable().concat(['createdAt']); 
        return searchablePaths.filter(x => queryKeysAndOps.indexOf(x)>-1); 
    }

    /**
     * Tests that the qryKeys are all valid paths or search operators
     * @param {string[]} qryKeys keys of a complex query  
     * @returns {boolean} 
     * 
     * 
     * tmc - completed 
     * @private
     */
    _isValidQueryOpsAndPaths( qryKeys) {
        // createdAt should always be 'safe' path for queries 
        const validOps = ['$eq','$regex','$lt','$lte','$gt','$gte','$in','$and','$or','createdAt'];
        const validPathAndOpts = validOps.concat(this.getPathNamesSearchable() );
        let isValid = true;
        qryKeys.forEach(k => {
            if(validPathAndOpts.indexOf(k) == -1 ){
                isValid = false;
            }
        })
        return isValid;
    }
  
    /**
     * Filters out any non-permissible projection paths
     * @param {object} proposedProjection keys of a complex query  
     * @returns {object} all allowable projection paths in the form: {pathID1:1, pathID2:1, ...} 
     * 
     * tmc - completed 
     * @private
     */
    _sanitizeProjection(proposedProjection = {}) {
        const allowedPaths = this.getPathNamesSystem().concat(this.getPathNamesProjectable());
        const allowedProjection = {};
        allowedPaths.forEach(pathID => {
            if(pathID in proposedProjection ){
                allowedProjection[pathID]=1;
            }
        });
        return  allowedProjection;
    }



     
    /**
     * Helper function for getPathNames\[property\]()
     * 
     * supported properties: [ isSearchable | isProjectable | isUpdatable | isInsertable | isRequired ]
     * 
     * **mutability: returns a copy**
     * 
     *      this._getPathNamesByProperty('isSearchable',true)
     * 
     * @param {string} property supported properties 
     * @param {boolean} isTrueFalse 
     * @returns {string[]} path names matching given criteria (is\[Property]=\[true|false\])
     * 
     * tmc - completed 
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
     * Helper function for getPathNamesNon\[property\]\(\)
     * @param {string} property supported properties 
     * @returns {string[]} path names matching with given property set to false
     * @desc
     * Get path names with \[property\] set to false
     * 
     * supported properties: [ isSearchable | isProjectable | isUpdatable | isInsertable | isRequired ]
     * 
     * **mutability: returns a copy**
     * 
     *      this._getPathNamesByNonProperty('isSearchable')
     * 
     * 
     * tmc - completed 
     * @private
     */
    _getPathNamesByNonProperty(property){
        return this._getPathNamesByProperty(property,false);
    }


} 


module.exports = MonqadeSchemaBase;