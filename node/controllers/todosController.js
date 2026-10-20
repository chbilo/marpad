const Todo = require("../models/todos")

const createNewTodo = async (req, res) => {
    const { title,tags,complete  } = req.body
    if (!title) {
        return res.send("title is required")
    }
    const todo = await Todo.create({title,tags,complete,user:req.user._id })
    res.json(todo)
}

const getAllTodos = async (req,res)=>{
    const todos= await Todo.find({user:req.user._id })
    res.json(todos)
}

const getTodoById = async (req,res) =>{
    const {id}= req.params
    const todo= await Todo.findById(id)
    res.json(todo)
}

const updateTodo = async (req,res) =>{
    const {id,title,tags,complete} =req.body
    if(!id || !title){
        return res.send("id and title is required")
    }
    let todo= await Todo.findById(id)
    todo.title=title
    todo.tags=tags
    todo.complete=complete
    await todo.save()
    res.json(todo) 
}

const deleteTodo= async (req,res) =>{
    const {id}=req.params
    const todo=await Todo.findById(id)
    await todo.deleteOne()
    res.send("erased")
}



module.exports = { createNewTodo ,getAllTodos, getTodoById,updateTodo,deleteTodo}