const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: String,
    city: String,
    pinCode: Number,
    schoolId: Number,
    mobile: Number,
    email: String,
    webhookDetails: [
        {
            eventName: String,
            eventEndpointURL: String
        }
    ]
})

const schoolModel = mongoose.model('school', schoolSchema)

exports.schoolModel =  schoolModel 
