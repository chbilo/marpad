const jwt = require('jsonwebtoken')
const { Server } = require('socket.io')

const configureSocket = (server, corsOptions) => {
    const io = new Server(server, { cors: corsOptions })

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token
        if (!token) {
            return next(new Error('Unauthorized'))
        }
        try {
            socket.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            next()
        } catch {
            next(new Error('Unauthorized'))
        }
    })

    io.on('connection', (socket) => {
        socket.join(`user:${socket.user._id}`)
        if (socket.user.roles === 'Admin') {
            socket.join('admins')
        }
    })

    return io
}

module.exports = configureSocket