/*
 The PropertySchema  refers to properties collection in database .
 This Schema contains the information related to credentials and details connecting to the RabbitMq  .
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PropertySchema = new Schema({
    created: {
        type: Date,
        required: true,
    },
    updated: {
        type: Date, default: Date.now,
        required: true
    },
    namespace: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: false
    },

}, { collection: 'properties'});

const Property = module.exports = mongoose.model('Property',PropertySchema);

Property.findByNamespaceAndKey = function(namespace, key, callback) {
    const query = {namespace: namespace, key: key};
    if (!callback) {
        return Property.findOne(query).exec();
    }
    Property.findOne(query,callback);
};

Property.findAllByNamespace = function(namespace, callback) {
    const query = {namespace: namespace};
    if (!callback) {
        return Property.find(query).exec();
    }
    Property.find(query,callback);
};

Property.findAllByNamespaceAsMap = async (namespace) => {
    const query = {namespace: namespace};
    return Property.find(query).exec().then( results => {
        const map = {};
        for(let i = 0; i < results.length; i++) {
            const r = results[i];
            map[r.key] = r.value;
        }
      
        return map;
    });
};

Property.list = function(callback) {
    const query = { };
    if (!callback) {
        return Property.find(query).exec();
    }
    Property.find(query,callback);
};

Property.add = (property, callback) => {
    property.save(callback);
};
