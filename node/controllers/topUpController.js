const mongoose = require('mongoose')
const User = require('../models/users')

const serializeRequest = (user, request) => ({
    id: request._id.toString(),
    customerName: user.name,
    amount: request.amount,
    createdAt: request.requestedAt
})

const createRequest = async (req, res) => {
    const amount = Math.round(Number(req.body.amount) * 100) / 100
    if (!Number.isFinite(amount) || amount < 20) {
        return res.status(400).json({ message: 'A top-up of at least 20 is required' })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
        return res.status(404).json({ message: 'User not found' })
    }

    user.pendingTopUps.push({ amount })
    await user.save()
    const request = serializeRequest(user, user.pendingTopUps[user.pendingTopUps.length - 1])
    req.app.get('io').to('admins').emit('topup:requested', request)

    res.status(201).json({ request })
}

const getPendingRequests = async (req, res) => {
    const users = await User.find({ 'pendingTopUps.status': 'pending' })
        .select('name pendingTopUps')
        .lean()
    const requests = users.flatMap((user) => (user.pendingTopUps || [])
        .filter((request) => request.status === 'pending')
        .map((request) => serializeRequest(user, request)))

    requests.sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))
    res.json(requests)
}

const approveRequest = async (req, res) => {
    const { requestId } = req.params
    if (!mongoose.isValidObjectId(requestId)) {
        return res.status(400).json({ message: 'Invalid top-up request id' })
    }

    const user = await User.findOne({ 'pendingTopUps._id': requestId })
        .select('name pendingTopUps')
    if (!user) {
        return res.status(404).json({ message: 'Top-up request not found' })
    }

    const request = user.pendingTopUps.id(requestId)
    if (!request || request.status !== 'pending') {
        return res.status(409).json({ message: 'Top-up request was already handled' })
    }

    const updatedUser = await User.findOneAndUpdate(
        {
            _id: user._id,
            pendingTopUps: { $elemMatch: { _id: request._id, status: 'pending' } }
        },
        {
            $inc: { balance: request.amount },
            $set: {
                'pendingTopUps.$.status': 'approved',
                'pendingTopUps.$.approvedAt': new Date(),
                'pendingTopUps.$.approvedBy': req.user._id
            }
        },
        { returnDocument: 'after' }
    ).select('name balance')

    if (!updatedUser) {
        return res.status(409).json({ message: 'Top-up request was already handled' })
    }

    const result = {
        requestId,
        customerName: updatedUser.name,
        amount: request.amount,
        balance: updatedUser.balance
    }
    req.app.get('io').to(`user:${user._id}`).emit('topup:approved', result)
    req.app.get('io').to('admins').emit('topup:approved', result)
    res.json(result)
}

const rejectRequest = async (req, res) => {
    const { requestId } = req.params
    if (!mongoose.isValidObjectId(requestId)) {
        return res.status(400).json({ message: 'Invalid top-up request id' })
    }

    const user = await User.findOne({ 'pendingTopUps._id': requestId })
        .select('name pendingTopUps')
    if (!user) {
        return res.status(404).json({ message: 'Top-up request not found' })
    }

    const request = user.pendingTopUps.id(requestId)
    if (!request || request.status !== 'pending') {
        return res.status(409).json({ message: 'Top-up request was already handled' })
    }

    const updatedUser = await User.findOneAndUpdate(
        {
            _id: user._id,
            pendingTopUps: { $elemMatch: { _id: request._id, status: 'pending' } }
        },
        {
            $set: {
                'pendingTopUps.$.status': 'rejected',
                'pendingTopUps.$.rejectedAt': new Date(),
                'pendingTopUps.$.rejectedBy': req.user._id
            }
        },
        { returnDocument: 'after' }
    ).select('name')

    if (!updatedUser) {
        return res.status(409).json({ message: 'Top-up request was already handled' })
    }

    const result = {
        requestId,
        customerName: updatedUser.name,
        amount: request.amount
    }
    req.app.get('io').to(`user:${user._id}`).emit('topup:rejected', result)
    req.app.get('io').to('admins').emit('topup:rejected', result)
    res.json(result)
}

module.exports = { createRequest, getPendingRequests, approveRequest, rejectRequest }