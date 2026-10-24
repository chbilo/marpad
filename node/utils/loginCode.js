const { createHmac } = require('crypto')

const normalizeCode = (code) => String(code ?? '').trim()

const getCodeLookup = (code) => {
    const secret = process.env.ACCESS_TOKEN_SECRET
    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET is required to process login codes')
    }
    return createHmac('sha256', secret)
        .update(`login-code:${normalizeCode(code)}`)
        .digest('hex')
}

const isValidCode = (code) => typeof code === 'string' && /^\d{9}$/.test(code.trim())

module.exports = { normalizeCode, getCodeLookup, isValidCode }
