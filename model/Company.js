/*
 The CompanySchema refers to companies collection in database .
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompanySchema = new Schema({
    name: {
        type: String,
        required: false
    },
    type: {
        type: String,
        required: true,
        default: 'root'
    },
    source: {
        type: String,
        required: true,
        default: 'revops2'
    },
    creator: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    created: {
        type: Date
    },
    discarded: { type: Boolean, default: false }, // when the user starts creating new data and then logs in, abandoning it (as well as the associated company)
    updated: {
        type: Date
    },
    users: [{userId: {type: Schema.ObjectId, ref: 'User'}, roles: []}],
    ipAddress: { type: String }
}, { collection: 'companies' });

const Company = module.exports = mongoose.model('Company', CompanySchema);

/*
 To get the Company document on the basis of documentId
@params  ObjectId of  Company document as id
 */
 module.exports.get = (id, callback) => {
    if(!callback){
        return Company.findById(id,callback);
    }
    Company.findById(id,callback);
};
/*
 To save Company document 
@params Company Object as newCompany
 */
Company.add = function(newCompany,callback) {
    newCompany.save(callback);
}
