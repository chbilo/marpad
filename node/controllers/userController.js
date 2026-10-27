const User = require("../models/users")

const serializeUser = (user) => ({
    ...user,
    accountType: user.accountType || 'Student'
})

const getAllUsers = async (req, res) => {
    if (req.user.roles !== "Admin") {
        return res.status(403).json({ message: "Forbidden" })
    }
    const users = await User.find().select("-password").lean()
    res.json(users.map(serializeUser))
}

const getUserById = async (req, res) => {
    const { id } = req.params
    if (req.user.roles === "Admin" || (req.user._id && id === req.user._id.toString())) {
        const user = await User.findById(id).select("-password").lean()
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.json(serializeUser(user))
    }
    return res.status(403).json({ message: "Forbidden" })
}

const updateUser = async (req, res) => {
    const { id, name, className, accountType, balance } = req.body
    if (req.user.roles === "Admin" || (req.user._id && id === req.user._id.toString())) {
        if (!id || !name) {
            return res.status(400).json({ message: "id and name are required" })
        }
        let user = await User.findById(id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        const nextAccountType = req.user.roles === "Admin" && accountType !== undefined
            ? accountType
            : user.accountType
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
            if (nextAccountType === 'Other' && parsedBalance < 0) {
                return res.status(400).json({ message: "חשבון אורח אינו יכול להיות ביתרה שלילית" })
            }
            user.balance = Math.round(parsedBalance * 100) / 100
        }
        if (
            req.user.roles === "Admin"
            && (accountType !== undefined || balance !== undefined)
            && nextAccountType === 'Other'
            && user.balance < 0
        ) {
            return res.status(400).json({ message: "חשבון אורח אינו יכול להיות ביתרה שלילית" })
        }
        await user.save()
        const updatedUser = await User.findById(id).select("-password").lean()
        return res.json(serializeUser(updatedUser))
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