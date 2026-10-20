const Product = require("../models/product")

const createNewProduct = async (req, res) => {
    const { name, price } = req.body
    if (!name || price === undefined) {
        return res.send("name and price are required")
    }
    const product = await Product.create({ name, price })
    res.json(product)
}

const getAllProducts = async (req, res) => {
    const products = await Product.find()
    res.json(products)
}

const getProductById = async (req, res) => {
    const { id } = req.params
    const product = await Product.findById(id)
    res.json(product)
}

const updateProduct = async (req, res) => {
    const { id, name, price } = req.body
    if (!id || !name || price === undefined) {
        return res.send("id, name and price are required")
    }
    const product = await Product.findById(id)
    product.name = name
    product.price = price
    await product.save()
    res.json(product)
}

const deleteProduct = async (req, res) => {
    const { id } = req.params
    const product = await Product.findById(id)
    await product.deleteOne()
    res.send("erased")
}

module.exports = { createNewProduct, getAllProducts, getProductById, updateProduct, deleteProduct }
