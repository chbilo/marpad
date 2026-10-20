const express = require("express")
const router = express.Router()
const todoController = require("../controllers/todosController")

router.post("/", todoController.createNewTodo)
router.get("/", todoController.getAllTodos)
router.get("/:id", todoController.getTodoById)
router.put("/", todoController.updateTodo)
router.delete("/:id", todoController.deleteTodo)

module.exports = router