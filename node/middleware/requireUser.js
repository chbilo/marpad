const requireUser = (req, res, next) => {
    if (!req.user?._id) {
        return res.status(403).json({ message: 'A user account is required' })
    }
    next()
}

module.exports = requireUser
