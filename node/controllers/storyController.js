const Story = require("../models/story")

const createNewStory = async (req, res) => {
    const { title, chapters } = req.body
    if (!title) {
        return res.send("title is required")
    }
    const story = await Story.create({ title, chapters, user: req.user._id })
    res.json(story)
}

const getAllStorys = async (req, res) => {
    const storys = await Story.find({ user: req.user._id })
    res.json(storys)
}

const getStoryById = async (req, res) => {
    const { id } = req.params
    const story = await Story.findById(id)
    if (story.user == req.user._id)
        return res.json(story)
    res.send("Unauthorized")
}

const updateStory = async (req, res) => {
    const { id, title, chapters } = req.body
    if (!id || !title) {
        return res.send("id and title is required")
    }
    let story = await Story.findById(id)
    if (story.user != req.user._id)
        return res.send("Unauthorized")
    story.title = title
    story.chapters=chapters
    await story.save()
    res.json(story)
}

const deleteStory = async (req, res) => {
    const { id } = req.params
    const story = await Story.findById(id)
    if (story.user != req.user._id)
        return res.send("Unauthorized")
    await story.deleteOne()
    res.send("erased")
}

const addChapter = async (req,res) =>{
    const {id,chapter} =req.body
    const story = await Story.findById(id)
    if (story.user != req.user._id)
        return res.send("Unauthorized")
    story.chapters.push(chapter)
    await story.save()
    res.json(story)
}



module.exports = { createNewStory, getAllStorys, getStoryById, updateStory, deleteStory,addChapter }