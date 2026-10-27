const express = require('express')
const router = express.Router()
const verifyJWT = require('../middleware/verifyJWT')
const requireUser = require('../middleware/requireUser')
const cartController = require('../controllers/cartController')

router.use(verifyJWT, requireUser)
router.get('/', cartController.getCart)
router.post('/items', cartController.addToCart)
router.put('/items', cartController.updateCartItem)
router.delete('/items/:productId', cartController.removeFromCart)
router.delete('/', cartController.clearCart)
router.post('/checkout', cartController.checkout)

module.exports = router
