const User = require('../models/User');

// POST /api/connections/request/:id
const sendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const targetId = req.params.id;

    if (senderId.toString() === targetId) {
      return res.status(400).json({ success: false, message: 'You cannot connect with yourself' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sender = await User.findById(senderId);

    if (sender.connections.includes(targetId)) {
      return res.status(400).json({ success: false, message: 'Already connected' });
    }
    if (sender.sentRequests.includes(targetId)) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    // Add to sender's sentRequests
    sender.sentRequests.push(targetId);
    await sender.save();

    // Add to target's pendingRequests
    targetUser.pendingRequests.push(senderId);
    await targetUser.save();

    // Emit socket event if target is online
    const { io } = require('../../server');
    const { getOnlineUsers } = require('../socket/socketHandler');
    const onlineUsers = getOnlineUsers();
    const targetSocketId = onlineUsers.get(targetId.toString());
    
    if (targetSocketId && io) {
      io.to(targetSocketId).emit('connection:request', { senderId, username: sender.username });
    }

    res.status(200).json({ success: true, message: 'Connection request sent', user: sender.toPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send request' });
  }
};

// POST /api/connections/accept/:id
const acceptRequest = async (req, res) => {
  try {
    const receiverId = req.user._id; // The one who received the request
    const senderId = req.params.id;  // The one who sent it

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver.pendingRequests.includes(senderId)) {
      return res.status(400).json({ success: false, message: 'No pending request from this user' });
    }

    // Move from pending to connections
    receiver.pendingRequests = receiver.pendingRequests.filter(id => id.toString() !== senderId.toString());
    receiver.connections.push(senderId);
    await receiver.save();

    // Move from sent to connections
    if (sender) {
      sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== receiverId.toString());
      sender.connections.push(receiverId);
      await sender.save();
    }

    // Emit socket event
    const { io } = require('../../server');
    const { getOnlineUsers } = require('../socket/socketHandler');
    const onlineUsers = getOnlineUsers();
    const senderSocketId = onlineUsers.get(senderId.toString());
    
    if (senderSocketId && io) {
      io.to(senderSocketId).emit('connection:accepted', { receiverId, username: receiver.username });
    }

    res.status(200).json({ success: true, message: 'Request accepted', user: receiver.toPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept request' });
  }
};

// POST /api/connections/reject/:id
const rejectRequest = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const senderId = req.params.id;

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    // Remove from receiver's pending
    receiver.pendingRequests = receiver.pendingRequests.filter(id => id.toString() !== senderId.toString());
    await receiver.save();

    // Remove from sender's sent
    if (sender) {
      sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== receiverId.toString());
      await sender.save();
    }

    res.status(200).json({ success: true, message: 'Request rejected', user: receiver.toPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
};

module.exports = { sendRequest, acceptRequest, rejectRequest };
