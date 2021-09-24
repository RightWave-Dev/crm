/*
 The CrmConnectionDetailSchema Schema refers to crmConnectionDetail collection in database .
 This Schema contains the information related to accessing/connecting to a CRM for exporting a lead to the CRM .
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CrmConnectionDetailSchema = new Schema({
   
    crm: {
        type: String,
        required: true
    },
    organizationId: {
        type: Schema.ObjectId,
        required: false
    },
    clientId:{
        type: String,
        required: true
    },
    clientSecret:{
        type: String,
        required: true
    },
    instanceUrl:{
        type: String,
        required: true
    },
    createdDate: {
        type: Date, default: Date.now
    },
   
    updatedDate: {
        type: Date, default: Date.now
    },
  

}, { collection: 'crmConnectionDetail'});

const CrmConnectionDetail = module.exports = mongoose.model('CrmConnectionDetail',CrmConnectionDetailSchema);
/* To get the CrmConnectionDetail on the basis of the documentId
@params  ObjectId of  CrmConnectionDetail document as id
*/
CrmConnectionDetail.get = (id, callback) => {
    if (!callback) {
        return CrmConnectionDetail.findById(id).exec();
    }
    CrmConnectionDetail.findById(id,callback);
};

/* To save the CrmConnectionDetail 
@params CrmConnectionDetail object as CrmConnectionDetail
*/
CrmConnectionDetail.add = (CrmConnectionDetail,callback) => {
    CrmConnectionDetail.save(callback);
};

/* To get the CrmConnectionDetail on the basis of the OrganizationId and crmName 
@params OrganizationId as id , crmName as crmName
*/
CrmConnectionDetail.findByOrganizatioAndCrm = function(id, crmName, callback) {
    const query = { organizationId: id, crm: crmName };
    if (!callback) {
        return CrmConnectionDetail.findOne(query).exec();
    }

    CrmConnectionDetail.findOne(query,callback);
};

