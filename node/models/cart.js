const mongoose = require('mongoose')

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1,
        required: true
    }
}, { _id: false })

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema]
}, { timestamps: true })

module.exports = mongoose.model('Cart', cartSchema)
