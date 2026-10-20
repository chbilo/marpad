const User = require("../models/users")

const getAllUsers = async (req, res) => {
    if (req.user.roles !== "Admin") {
        return res.status(403).json({ message: "Forbidden" })
    }
    const users = await User.find().select("-password")
    res.json(users)
}

const getUserById = async (req, res) => {
    const { id } = req.params
    if (id === req.user._id.toString() || req.user.roles === "Admin") {
        const user = await User.findById(id).select("-password")
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.json(user)
    }
    return res.status(403).json({ message: "Forbidden" })
}

const updateUser = async (req, res) => {
    const { id, name, balance } = req.body
    if (id === req.user._id.toString() || req.user.roles === "Admin") {
        if (!id || !name) {
            return res.status(400).json({ message: "id and name are required" })
        }
        let user = await User.findById(id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        user.name = name
        if (balance !== undefined && req.user.roles === "Admin") {
            user.balance = balance
        }
        await user.save()
        const updatedUser = await User.findById(id).select("-password")
        return res.json(updatedUser)
    }
    return res.status(403).json({ message: "Forbidden" })
}

const deleteUser = async (req, res) => {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    await user.deleteOne()
    res.send("erased")
}



module.exports = { getAllUsers, getUserById, updateUser, deleteUser }