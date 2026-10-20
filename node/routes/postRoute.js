const express = require("express")
const router = express.Router()
const postController = require("../controllers/postsController")

router.post("/", postController.createNewPost)
router.get("/", postController.getAllPosts)
router.get("/:id", postController.getPostById)
router.put("/", postController.updatePost)
router.delete("/:id", postController.deletePost)

module.exports = router