const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const verifyJWT = require("../middleware/verifyJWT")

const requireAdmin = (req, res, next) => {
	if (req.user.roles !== "Admin") {
		return res.status(403).json({ message: "Forbidden" })
	}
	next()
}

router.use(verifyJWT)
router.get("/", requireAdmin, userController.getAllUsers)
router.get("/:id", userController.getUserById)
router.put("/", userController.updateUser)
router.delete("/:id", requireAdmin, userController.deleteUser)


module.exports = router