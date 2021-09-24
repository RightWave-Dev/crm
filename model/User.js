/*
 UserSchema refers to the users collection in our database .
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// noinspection JSValidateTypes
const UserSchema = new Schema({
    companyName: {
        type: String,
        required: true
    },
    companyId: {
        type: Schema.ObjectId,
        ref: 'Company'
    },
    source: {
        type: String,
        required: true,
        default: 'revops2'
    },
    name: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        }
    },
    email: {
        type: String,
        required: true,
    },
    emailVerified: {
        type: Boolean,
        default: false,
        required: false
    },
    password: {
        type: String,
        required: true
    },
    created: {
        type: Date
    },
    updated: {
        type: Date
    },
    lastAccountPeriodEdited: String, // last accountingPeriod user was looking at
    tokens: [{provider: String, accessToken: String}], // for OAUTH2
    termsOfUseApproval: {  // accepted privacy policy and terms of user
        type: Date
    },
    lastLogin: {
        type: Date
    },
    permissions: { /* */
        type: [{type: String}],
        required: false
    },
    ipAddress: {
        type: String
    }

}, { collection: 'users' });

UserSchema.virtual('fullName').get(() => `${this.firstName} ${this.lastName}`);

// noinspection JSUndefinedPropertyAssignment
const User = module.exports = mongoose.model('User',UserSchema);

User.noPassword = 'No Password Set';

// To get the user document on the basis of documentId  
User.get = function(id, callback) {
    if (!callback) {
        return User.findById(id).exec();
    }
    User.findById(id, callback);
};


