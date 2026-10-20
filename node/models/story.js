const mongoose = require('mongoose')
const chapterSchema = require('./chapter')

const storySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    chapters:{
        type:[chapterSchema],
        default:[]
    },
    user: {
        type: mongoose.ObjectId,
        ref:'User'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Story', storySchema)