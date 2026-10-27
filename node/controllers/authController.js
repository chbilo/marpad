const User = require("../models/users")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { normalizeCode, getCodeLookup, isValidCode } = require('../utils/loginCode')

const ADMIN_LOGIN_LIMIT = 5
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000
const failedAdminLogins = new Map()

const createLoginResponse = (res, user) => {
    const userInfo = {
        _id: user._id,
        name: user.name,
        roles: 'User',
        accountType: user.accountType || 'Student',
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

const adminLogin = async (req, res) => {
    const now = Date.now()
    for (const [address, attempts] of failedAdminLogins) {
        if (attempts.resetAt <= now) failedAdminLogins.delete(address)
    }

    const address = req.ip || req.socket.remoteAddress || 'unknown'
    const attempts = failedAdminLogins.get(address)
    if (attempts && attempts.count >= ADMIN_LOGIN_LIMIT) {
        res.set('Retry-After', String(Math.ceil((attempts.resetAt - now) / 1000)))
        return res.status(429).json({ message: 'Too many failed attempts. Try again later.' })
    }

    const codeHash = process.env.ADMIN_CODE_HASH
    if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(codeHash || '')) {
        return res.status(503).json({ message: 'Admin login is not configured' })
    }

    const code = req.body?.code
    const matches = typeof code === 'string'
        && code.length > 0
        && code.length <= 72
        && await bcrypt.compare(code, codeHash)
    if (!matches) {
        const current = failedAdminLogins.get(address)
        failedAdminLogins.set(address, {
            count: (current?.count || 0) + 1,
            resetAt: current?.resetAt || now + ADMIN_LOGIN_WINDOW_MS
        })
        return res.status(401).json({ message: 'Unauthorized' })
    }

    failedAdminLogins.delete(address)
    const userInfo = { name: 'מנהל', roles: 'Admin' }
    const accessToken = jwt.sign(
        { sub: 'admin', roles: 'Admin', authMethod: 'admin-code' },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
    )
    return res.json({ accessToken, userInfo })
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

module.exports = { login, adminLogin, register }
