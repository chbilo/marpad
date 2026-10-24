const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const studentImportController = require("../controllers/studentImportController")
const verifyJWT = require("../middleware/verifyJWT")
const multer = require('multer')

const uploadStudentWorkbook = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, callback) => {
		if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
			return callback(new Error('יש להעלות קובץ Excel מסוג ‎.xlsx בלבד.'))
		}
		callback(null, true)
	}
}).single('file')

const parseStudentWorkbookUpload = (req, res, next) => {
	uploadStudentWorkbook(req, res, (error) => {
		if (error) return res.status(400).json({ message: error.message })
		next()
	})
}

const requireAdmin = (req, res, next) => {
	if (req.user.roles !== "Admin") {
		return res.status(403).json({ message: "Forbidden" })
	}
	next()
}

router.use(verifyJWT)
router.get("/", requireAdmin, userController.getAllUsers)
router.post('/import/preview', requireAdmin, parseStudentWorkbookUpload, studentImportController.previewImport)
router.post('/import', requireAdmin, parseStudentWorkbookUpload, studentImportController.importStudents)
router.get('/export', requireAdmin, studentImportController.exportStudents)
router.get("/:id", userController.getUserById)
router.put("/", userController.updateUser)
router.delete("/:id", requireAdmin, userController.deleteUser)


module.exports = router
