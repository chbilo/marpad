const express = require("express")
const router = express.Router()
const storyController = require("../controllers/storyController")

router.post("/", storyController.createNewStory)
router.get("/", storyController.getAllStorys)
router.get("/:id", storyController.getStoryById)
router.put("/", storyController.updateStory)
router.delete("/:id", storyController.deleteStory)
router.put("/add-chapter", storyController.addChapter)

module.exports = router