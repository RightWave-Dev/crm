const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// noinspection JSValidateTypes
const FinanceSchema = new Schema({
    companyId: {
        type: Schema.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
    userId: {
        type: Schema.ObjectId,
        ref: 'User',
        required: false // we'll fill it in if we have it
    },
    source: {
        type: String,
        required: true,
        default: 'revops2'
    },
    dataset: {
        type: String,
        required: true
    },
    accountingPeriod: { type: String, index: true, required: true },
    createDate: { type: Date },
    discarded: { type: Boolean, default: false}, // when the user starts creating new data and then logs in, abandoning it
    updateDate: { type: Date },
    validated: { type: Boolean, default: null }, // neither validated nor invalidated
    ipAddress: {
        type: String
    },
    leadSent: {
        type: Boolean,
        default: false,
        required: false
    },
    sentThankYou: {
        type: Boolean,
        default: false,
        required: false
    }
}, { collection: 'finances', strict: false });


// noinspection JSUndefinedPropertyAssignment
const Finance = module.exports = mongoose.model('Finance', FinanceSchema);

Finance.findAllByAccountingPeriodAndCompanyId = (accountingPeriod,companyId, callback) => {
    const query = {"accountingPeriod": accountingPeriod, "companyId": companyId};
    if (!callback) {
        return Finance.find(query).exec();
    }
    Finance.find(query,callback);
};

Finance.findAllByCompanyId = (companyId, callback) => {
    const query = {"companyId": companyId};
    if (!callback) {
        return Finance.find(query).exec();
    }
    Finance.find(query,callback);
};

Finance.findAllByDatasetAndCompanyId = (dataset,companyId, callback) => {
    const query = {"companyId": companyId, "dataset":dataset};
    if (!callback) {
        return Finance.find(query).exec();
    }
    Finance.find(query,callback);
};

Finance.findByAccountingPeriodAndCompanyIdAndDataset = (accountingPeriod,companyId, dataset, callback) => {
    const query = {"accountingPeriod": accountingPeriod, "companyId": companyId, "dataset":dataset};
    if (!callback) {
        return Finance.findOne(query).exec();
    }
    Finance.findOne(query,callback);
};

Finance.get = function(id, callback) {
    if (!callback) {
        return Finance.findById(id).exec();
    }
    Finance.findById(id, callback);
};

Finance.add = function(newFinance, callback) {
    newFinance.save(callback);
};
