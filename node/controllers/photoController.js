const Photos = require("../models/photos")

const createNewPhoto = async (req, res) => {
    const { title, imageUrl } = req.body
    if (!title) {
        return res.send("title is required")
    }
    const photo = await Photos.create({ title, imageUrl })
    res.json(photo)
}

const getAllPhotos = async (req,res)=>{
    const photos= await Photos.find()
    res.json(photos)
}

const getPhotoById = async (req,res) =>{
    const {id}= req.params
    const photo= await Photos.findById(id)
    res.json(photo)
}

const updatePhoto = async (req,res) =>{
    const {id,title, imageUrl} =req.body
    if(!id || !title){
        return res.send("id and title is required")
    }
    let photo= await Photos.findById(id)
    photo.id=id
    photo.title=title
    photo.imageUrl=imageUrl
    await photo.save()
    res.json(photo) 
}

const deletePhoto= async (req,res) =>{
    const {id}=req.params
    const photo=await Photos.findById(id)
    await photo.deleteOne()
    res.send("erased")
}



module.exports = { createNewPhoto ,getAllPhotos, getPhotoById,updatePhoto,deletePhoto}