const mongoose = require('mongoose')
const todoSchema = new mongoose.Schema({
    title: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    tags: [String],
    complete: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.ObjectId,
        ref:'User'}
}, {
    timestamps: true
})
module.exports = mongoose.model('Todo', todoSchema)