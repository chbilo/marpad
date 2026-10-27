const express = require('express')
const router = express.Router()
const verifyJWT = require('../middleware/verifyJWT')
const requireUser = require('../middleware/requireUser')
const topUpController = require('../controllers/topUpController')

const requireAdmin = (req, res, next) => {
    if (req.user.roles !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden' })
    }
    next()
}

router.use(verifyJWT)
router.post('/', requireUser, topUpController.createRequest)
router.get('/pending', requireAdmin, topUpController.getPendingRequests)
router.post('/:requestId/approve', requireAdmin, topUpController.approveRequest)
router.post('/:requestId/reject', requireAdmin, topUpController.rejectRequest)

module.exports = router