
const MonqadeSchema = require("./MonqadeSchema");
//const systemPathTemplate = require('./monqade-base-src/defaults/pathTemplates').systemPath;


/**
 * @classdesc Adds some useful read only paths oriented  functions to MonqadeSchema
 * @class MonqadeSchemaWithPathAdapter
 * @description Adds some useful read only paths oriented  functions to MonqadeSchema.  These are 
 * likely to be more efficient than the getPathNamesQuery option (of parent class) especially
 * heavy use.
 * @param {JSON} schemaPaths - any MongooseSchemaType + Monqade options
 * @param {JSON} schemaOptions - any Mongoose schema option + Monqade Schema options
 * @param {Mongoose.Connection} mongooseRef - active/live Mongoose.Connection
 * @extends MonqadeSchema
 */
class MonqadeSchemaWithPathAdapter extends MonqadeSchema {

    constructor(schemaPaths,schemaOptions,mongooseRef){
        super(schemaPaths,schemaOptions,mongooseRef);
        // done in super
        //const sPaths = Object.assign({},schemaPaths);
        this._fieldNamesByProperty = {};        

        // const sOptions = Object.assign({},schemaOptions);
        // sPaths['schemaVersionKey']=schemaVersionKeyPathTemplate;    

        // // to fit the is[Something] pattern - schema uses 'isRequired'
        // // while mongo/ose enforces 'required'
        // Object.entries(sPaths).forEach(([pathName,path])=>{
        //     path.required=path.isRequired;
        //  });
        //  this._mongooseRef = mongooseRef;
        //  this._mongooseSchema =  new Schema(sPaths,sOptions);
        //  this._modelClass = undefined;

         this._fieldNamesByProperty = {};        
         // paths added by new Schema() are system paths.  
         this._fieldNamesByProperty['isSystem'] = this.systemPathNames;
//         Object.entries(this._mongooseSchema.paths).forEach(([pathName,path])=>{
//             if(pathName === 'schemaVersionKey'){
//                 return;
//             }

//             if(! (pathName in sPaths) ){
//                 this._fieldNamesByProperty['isSystem'].push(pathName)
// //                this._mongooseSchema.paths[pathName].options  =Object.assign( systemPathTemplate,this._mongooseSchema.paths[pathName].options)
//             }else{
// //                path.options.isSystem =false;

//             }
//          });
     }
         /**
     * Get path names that are searchable (isSearchable=true)
     * 
     * **returns** Path names with options isSearchable=true 
     * @return {string[]} 
     */
    getPathNamesSearchable(){
        return this._getPathNamesByProperty('isSearchable')
    }
    /**
     * Get path names that are projectable (isProjectable=true)
     * 
     * **returns** Path names with options isProjectable=true 
     * @return {string[]}  
     */
    getPathNamesProjectable(){
        return this._getPathNamesByProperty('isProjectable')
    }

    /**
     * Get path names that are Updatable (isUpdatable=true)
     * 
     * **returns** Path names with options isUpdatable=true 
     * @return {string[]} Path names indicated as isUpdatable=true 
     */
    getPathNamesUpdatable(){
        return this._getPathNamesByProperty('isUpdatable')
    }
    /**
     * Get path names that are Insertable (isInsertable=true)
     * 
     * **returns** Path names with options isInsertable=true 
     * @return {string[]} Path names indicated as isInsertable=true 
     */
    getPathNamesInsertable(){
        return this._getPathNamesByProperty('isInsertable')
    }

    /**
     * Get path names that are Required (isRequired=true)
     * 
     * **returns** Path names with options isRequired=true 
     * @return {string[]} Path names indicated as isRequired=true 
     */
    getPathNamesRequired(){
        return this._getPathNamesByProperty('isRequired')
    }

    /**
     * Get path names that are  (isSystem=true)
     * @desc *system* paths are added by mongo/ose -- typically 
     * _id, createdAt, updateAt, \[, __v\].  These are defined indirectly with
     * schema options so isSystem is determined indirectly. Hence, isSystem=[true|false] 
     * is not found in the path definition.
     *       
     * **returns** Path names isSystem=true 
     * @return {string[]}  
     */
    getPathNamesSystem(){
        return this._getPathNamesByProperty('isSystem')
    }
    /**
     * Get path names that are NOT Projectable (isProjectable=false)
     * 
     * **returns** pathNames isProjectable=false
     * @returns {string[]} Path names indicated as isProjectable=false 
     */
    getPathNamesNonProjectable(){
        return this._getPathNamesByNonProperty('isProjectable')
    }

        /**
     * Get path names that are NOT Insertable (isInsertable=false)
     * 
     * **returns** path names  isInsertable=false
     * @return {string[]} Path names indicated as isInsertable=false 
     */
    getPathNamesNonInsertable(){
        return this._getPathNamesByNonProperty('isInsertable')
    }

    /**
     * Get path names that are NOT Updatable (isUpdatable=false)
     * 
     * **returns**  Path names with options isUpdatable=false
     * @return {string[]} Path names indicated as isUpdatable=false 
     */
    getPathNamesNonUpdatable(){
        return this._getPathNamesByNonProperty('isUpdatable')
    }
    
    /**
     * Get path names that are NOT Searchable (isSearchable=false)
     * 
     * **returns** Path names with options  isSearchable=false
     * @return {string[]} Path names indicated as isSearchable=false 
     */
    getPathNamesNonSearchable(){
        return this._getPathNamesByNonProperty('isSearchable')
    }

    /**
     * Get path names that are NOT required (isRequired=false)
     * 
     * **returns** Path names with options  isRequired=false
     * @return {string[]} Path names indicated as isRequired=false 
     */
    getPathNamesNonRequired(){
        return this._getPathNamesByNonProperty('isRequired')
    }


    /**
     * 
     * Helper function for getPathNamesNon\[property\]\(\)
     * 
     * Get path names with \[property\] set to false
     * 
     * supported properties: [ isSearchable | isProjectable | isUpdatable | isInsertable | isRequired ]
     * 
     * 
     * @memberof MonqadeSchemaPrivate
     * **returns** path names matching given criteria (is\[Property]==false) 
     * @param {string} property supported properties 
     * @return {string[]} Path names 
     * @private
     */
    _getPathNamesByNonProperty(property){
        return this._getPathNamesByProperty(property,false);
    }
}

module.exports = MonqadeSchemaWithPathAdapter;