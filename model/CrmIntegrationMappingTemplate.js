/*
 The CrmIntegrationMappingTemplateSchema Schema refers to crmIntegrationMappingTemplate collection in database .
 This Schema contains the information related sourceData and fieldMapping .
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CrmIntegrationMappingTemplateSchema = new Schema({
   
    organizationId: {
        type: Schema.ObjectId,
        required: false
    },
    crm: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    sourceData:[
		{
		  collectionName:{ type : String , required:true },
		  dataset :  { type : String , required:true },
		  sources :[ { type:String } ]  ,
		}    
    ],
    platform : {
        type: String,
        required: true
    },
    programName :{
        type: String,
        required: true
    },
    fieldMappings :[
	  {
		sourceObject :{ type:String , required:true},
        sourceFieldName :{ type:String , required:true},
        sourceDatatype :{ type:String , required:true},
        destinationFieldName :{ type:String , required:true}, 		
		  
	  }   
    ]

}, { collection: 'crmIntegrationMappingTemplate'});

const CrmIntegrationMappingTemplate = module.exports = mongoose.model('CrmIntegrationMappingTemplate',CrmIntegrationMappingTemplateSchema);

/*
To get the CrmIntegrationMappingTemplate document on the basis of the documentId
@params  ObjectId of CrmIntegrationMappingTemplate document as id
*/
CrmIntegrationMappingTemplate.get = (id, callback) => {
    if (!callback) {
        return CrmIntegrationMappingTemplate.findById(id).exec();
    }
    CrmIntegrationMappingTemplate.findById(id,callback);
};

/* To save the CrmIntegrationMappingTemplate 
@params CrmIntegrationMappingTemplate Object as CrmIntegrationMappingTemplate
*/
CrmIntegrationMappingTemplate.add = (CrmIntegrationMappingTemplate,callback) => {
    CrmIntegrationMappingTemplate.save(callback);
};

