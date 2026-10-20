const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:7200',
    'http://www.mysite.com'
]

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsOptions 