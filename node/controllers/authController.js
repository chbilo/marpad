const User = require("../models/users")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const login = async (req, res) => {
    const { name, password } = req.body
    if (!name || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }
    const foundUser = await User.findOne({ name }).lean()
    if (!foundUser) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    const match = await bcrypt.compare(password, foundUser.password)
    if (!match) return res.status(401).json({ message: 'Unauthorized' })
    const userInfo = {
        _id: foundUser._id, 
        name: foundUser.name,
        roles: foundUser.roles, 
        balance: foundUser.balance ?? 0
    }
    const accessToken = jwt.sign(userInfo,process.env.ACCESS_TOKEN_SECRET)
    res.json({accessToken:accessToken, userInfo:userInfo})
}


const register = async (req, res) => {
    const { name, password } = req.body
    if (!name || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }
    const duplicate = await User.findOne({ name }).lean()
    if (duplicate) {
        return res.status(409).json({ message: "Duplicate name" })
    }
    const hashedPwd = await bcrypt.hash(password, 10)
    const userObject = { name, password: hashedPwd }
    const user = await User.create(userObject)
    if (user) {
        return res.status(201).json({ message: `New user ${user.name} created` })
    }
    else {
        return res.status(400).json({ message: 'Invalid user received' })
    }
}

module.exports = { login, register }