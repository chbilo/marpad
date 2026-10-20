const Posts = require("../models/post")

const createNewPost = async (req, res) => {
    const { title,body } = req.body
    if (!title) {
        return res.send("title is required")
    }
    const post = await Posts.create({ title,body })
    res.json(post)
}

const getAllPosts = async (req,res)=>{
    const posts= await Posts.find()
    res.json(posts)
}

const getPostById = async (req,res) =>{
    const {id}= req.params
    const post= await Posts.findById(id)
    res.json(post)
}

const updatePost = async (req,res) =>{
    const {id,title,body} =req.body
    if(!id || !title){
        return res.send("id and title is required")
    }
    let post= await Posts.findById(id)
    post.id=id
    post.title=title
    post.body=body
    await post.save()
    res.json(post) 
}

const deletePost= async (req,res) =>{
    const {id}=req.params
    const post=await Posts.findById(id)
    await post.deleteOne()
    res.send("erased")
}



module.exports = { createNewPost ,getAllPosts, getPostById,updatePost,deletePost}