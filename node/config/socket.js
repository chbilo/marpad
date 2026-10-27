const jwt = require('jsonwebtoken')
const { Server } = require('socket.io')
const hasAdminAccess = require('../utils/adminAccess')

const configureSocket = (server, corsOptions) => {
    const io = new Server(server, { cors: corsOptions })

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token
        if (!token) {
            return next(new Error('Unauthorized'))
        }
        try {
            socket.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            if (socket.user.roles === 'Admin' && !hasAdminAccess(socket.user)) {
                return next(new Error('Unauthorized'))
            }
            next()
        } catch {
            next(new Error('Unauthorized'))
        }
    })

    io.on('connection', (socket) => {
        if (socket.user._id) socket.join(`user:${socket.user._id}`)
        if (socket.user.roles === 'Admin') {
            socket.join('admins')
        }
    })

    return io
}

module.exports = configureSocket