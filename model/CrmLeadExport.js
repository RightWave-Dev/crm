/*
 The CrmLeadExport Schema refers to crmLeadExport collection in database .
 This Schema contains all the information related to the lead that needs to be exported to marketo .
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CrmLeadExportSchema = new Schema({
    templateId: {
        type: Schema.ObjectId,
        required: true
    },
    crm: {
        type: String,
        required: true
    },
    sourceCollection: [{
        collectionId: { type: Schema.ObjectId , required:true},
        collectionName: { type: String , required:true},
          
    },],
    organizationId: {
        type: Schema.ObjectId,
        required: true,
    },
    status: {
        type: String,
        required: true
    },
    updatedDate: {
        type: Date, default: Date.now
    },
   retryCount : {
       type: Number ,
       default:0
       
   },
   failureResponse:[{
       requestId :{type:String},
       response:  {type: Array}
    }],
   successResponse :{
        requestId :{type:String},
        response:  {type: Array}
     }   
   
}, { collection: 'crmLeadExport'});

const CrmLeadExport = module.exports = mongoose.model('CrmLeadExport',CrmLeadExportSchema);

/* To get the crmLeadExport on the basis  of documentId
@param ObjectId of the CrmLeadExport as id
*/
CrmLeadExport.get = (id, callback) => {
    if (!callback) {
        return CrmLeadExport.findById(id).exec();
    }
    CrmLeadExport.findById(id,callback);
};

/* To save the crmLeadExport 
@param Object of the CrmLeadExport as CrmLeadExport
*/
CrmLeadExport.add = (CrmLeadExport,callback) => {
    CrmLeadExport.save(callback);
};

/* 
To update the crmLeadExport on the basis of documentId of the crmLeadExport
@param object of the CrmLeadExport as crmLead
*/
CrmLeadExport.update = (crmLead) => {
    console.log("inside CrmLeadExport update method ..")
    const filter = {_id: crmLead._id};
    crmLead.updatedDate=Date.now();
    console.log(filter);
     CrmLeadExport.findOneAndUpdate(filter,crmLead,{ new: true },(err,c) => {
        if (err) {
            console.error(`after CrmLeadExport.update  , unable to update CrmLeadExport(${err}): ${JSON.stringify(crmLead)}`);
           
        }
        if (c){
            console.log('CrmLeadExport  successfully updated '+c);
         
        }
    });
}
