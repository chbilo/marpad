const mongoose = require('mongoose')
const Cart = require('../models/cart')
const Product = require('../models/product')
const User = require('../models/users')

const getCart = async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product')
    res.json(cart || { user: req.user._id, items: [] })
}

const addToCart = async (req, res) => {
    const { productId, quantity = 1 } = req.body
    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'A valid productId and positive quantity are required' })
    }
    const product = await Product.findById(productId)
    if (!product) {
        return res.status(404).json({ message: 'Product not found' })
    }

    let cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] })
    }
    const item = cart.items.find((entry) => entry.product.toString() === productId)
    if (item) {
        item.quantity += quantity
    } else {
        cart.items.push({ product: productId, quantity })
    }
    await cart.save()
    await cart.populate('items.product')
    res.json(cart)
}

const updateCartItem = async (req, res) => {
    const { productId, quantity } = req.body
    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'A valid productId and positive quantity are required' })
    }

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' })
    }
    const item = cart.items.find((entry) => entry.product.toString() === productId)
    if (!item) {
        return res.status(404).json({ message: 'Product is not in the cart' })
    }
    item.quantity = quantity
    await cart.save()
    await cart.populate('items.product')
    res.json(cart)
}

const removeFromCart = async (req, res) => {
    const { productId } = req.params
    if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: 'Invalid product id' })
    }

    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' })
    }
    cart.items = cart.items.filter((item) => item.product.toString() !== productId)
    await cart.save()
    await cart.populate('items.product')
    res.json(cart)
}

const clearCart = async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
        return res.json({ user: req.user._id, items: [] })
    }
    cart.items = []
    await cart.save()
    res.json(cart)
}

const checkout = async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product')
    const requestedAdditionalAmount = Number(req.body?.additionalAmount ?? 0)
    if (!Number.isFinite(requestedAdditionalAmount) || requestedAdditionalAmount < 0) {
        return res.status(400).json({ message: 'Additional amount must be a non-negative number' })
    }
    const additionalAmount = Math.round(requestedAdditionalAmount * 100) / 100
    if ((!cart || cart.items.length === 0) && additionalAmount <= 0) {
        return res.status(400).json({ message: 'Cart is empty' })
    }

    const subtotal = (cart?.items || []).reduce((sum, item) => {
        return sum + (item.product ? Number(item.product.price) * item.quantity : 0)
    }, 0)
    const total = Math.round((subtotal + additionalAmount) * 100) / 100
    if (!Number.isFinite(total) || total <= 0) {
        return res.status(400).json({ message: 'Cart total is invalid' })
    }

    const user = await User.findOneAndUpdate(
        {
            _id: req.user._id,
            $or: [
                { accountType: { $ne: 'Other' } },
                { accountType: 'Other', balance: { $gte: total } }
            ]
        },
        { $inc: { balance: -total } },
        { returnDocument: 'after', runValidators: true }
    )
    if (!user) {
        const existingUser = await User.exists({ _id: req.user._id })
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' })
        }
        return res.status(400).json({
            code: 'INSUFFICIENT_GUEST_BALANCE',
            message: 'Guests must have sufficient balance to complete a purchase'
        })
    }

    const purchasedItems = (cart?.items || []).map((item) => ({
        product: item.product ? {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price
        } : null,
        quantity: item.quantity
    }))

    if (cart) {
        cart.items = []
        await cart.save()
    }

    res.json({
        message: 'Purchase completed',
        total,
        additionalAmount,
        balance: Math.round(user.balance * 100) / 100,
        items: purchasedItems
    })
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, checkout }
