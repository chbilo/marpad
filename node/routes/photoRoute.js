const express = require("express")
const router = express.Router()
const photoController = require("../controllers/photoController")

router.post("/",photoController.createNewPhoto )
router.get("/",photoController.getAllPhotos)
router.get("/:id",photoController.getPhotoById)
router.put("/",photoController.updatePhoto)
router.delete("/:id",photoController.deletePhoto)


module.exports = router