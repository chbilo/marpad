const User = require("../models/users")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { createHmac } = require('crypto')

const normalizeCode = (code) => code.trim()

const getCodeLookup = (code) => createHmac('sha256', process.env.ACCESS_TOKEN_SECRET)
    .update(`login-code:${normalizeCode(code)}`)
    .digest('hex')

const isValidCode = (code) => typeof code === 'string' && /^\d{9}$/.test(code.trim())

const createLoginResponse = (res, user) => {
    const userInfo = {
        _id: user._id,
        name: user.name,
        roles: user.roles,
        balance: user.balance ?? -(user.debt ?? 0)
    }
    const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET)
    return res.json({ accessToken, userInfo })
}

const login = async (req, res) => {
    const { code } = req.body
    if (!isValidCode(code)) {
        return res.status(400).json({ message: 'Israeli ID must contain exactly 9 digits' })
    }
    const foundUser = await User.findOne({ loginCodeLookup: getCodeLookup(code) }).lean()
    if (!foundUser) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    const match = await bcrypt.compare(normalizeCode(code), foundUser.password)
    if (!match) return res.status(401).json({ message: 'Unauthorized' })

    return createLoginResponse(res, foundUser)
}

const register = async (req, res) => {
    const { name, code } = req.body
    if (!name || !isValidCode(code)) {
        return res.status(400).json({ message: 'Name and a valid 9-digit Israeli ID are required' })
    }

    const normalizedCode = normalizeCode(code)
    const loginCodeLookup = getCodeLookup(normalizedCode)
    if (await User.exists({ loginCodeLookup })) {
        return res.status(409).json({ message: 'This login code is already in use' })
    }

    try {
        const user = await User.create({
            name,
            password: await bcrypt.hash(normalizedCode, 10),
            loginCodeLookup
        })
        return res.status(201).json({ message: `New user ${user.name} created` })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'This login code is already in use' })
        }
        throw error
    }
}

module.exports = { login, register }