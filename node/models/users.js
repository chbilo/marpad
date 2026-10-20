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
    roles: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User'
    },
    balance: {
        type: Number,
        default: 0
    },
    pendingTopUps: [{
        amount: {
            type: Number,
            required: true,
            min: 20
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        approvedAt: Date,
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rejectedAt: Date,
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
    ]
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)