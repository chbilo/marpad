const User = require("../models/users")

const getAllUsers = async (req, res) => {
    if (req.user.roles !== "Admin") {
        return res.status(403).json({ message: "Forbidden" })
    }
    const users = await User.find().select("-password").lean()
    res.json(users.map((user) => ({
        ...user,
        accountType: user.accountType || (user.roles === 'Admin' ? 'Staff' : 'Student')
    })))
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
    const { id, name, className, accountType, balance } = req.body
    if (id === req.user._id.toString() || req.user.roles === "Admin") {
        if (!id || !name) {
            return res.status(400).json({ message: "id and name are required" })
        }
        let user = await User.findById(id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        user.name = name
        if (accountType !== undefined && req.user.roles === "Admin") {
            if (!['Student', 'Staff', 'Other'].includes(accountType)) {
                return res.status(400).json({ message: "Account type must be Student, Staff, or Other" })
            }
            user.accountType = accountType
            if (accountType !== 'Student') user.className = ''
        }
        if (className !== undefined && req.user.roles === "Admin") {
            user.className = user.accountType === 'Student' ? String(className).trim() : ''
        }
        if (balance !== undefined && req.user.roles === "Admin") {
            const parsedBalance = Number(balance)
            if (!Number.isFinite(parsedBalance)) {
                return res.status(400).json({ message: "Balance must be a valid number" })
            }
            user.balance = Math.round(parsedBalance * 100) / 100
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