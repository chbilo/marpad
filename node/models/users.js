const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    loginCodeLookup: {
        type: String,
        unique: true,
        sparse: true
    },
    roles: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User'
    },
    balance: {
        type: Number,
        default: 0
    },
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)