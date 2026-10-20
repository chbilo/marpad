const express = require("express")
const router = express.Router()
const productController = require("../controllers/productController")
const verifyJWT = require("../middleware/verifyJWT")

const requireAdmin = (req, res, next) => {
    if (req.user.roles !== "Admin") {
        return res.status(403).json({ message: "Forbidden" })
    }
    next()
}

router.post("/", verifyJWT, requireAdmin, productController.createNewProduct)
router.get("/", productController.getAllProducts)
router.get("/:id", productController.getProductById)
router.put("/", verifyJWT, requireAdmin, productController.updateProduct)
router.delete("/:id", verifyJWT, requireAdmin, productController.deleteProduct)

module.exports = router
