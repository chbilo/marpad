const mongoose = require('mongoose')

const chapterSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body:{
        type:String,
        required:true
    }
}, {
    timestamps: true
})

module.exports = chapterSchema