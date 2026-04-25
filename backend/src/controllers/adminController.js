const User = require('../models/User');
const Message = require('../models/Message');
const CallLog = require('../models/CallLog');
const { cloudinary } = require('../config/cloudinary');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? { username: { $regex: search, $options: 'i' } }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// PATCH /api/admin/users/:id/suspend
const suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ success: false, message: 'Cannot suspend an admin' });

    user.isSuspended = !user.isSuspended;
    user.suspendedReason = user.isSuspended ? (reason || 'Policy violation') : '';
    await user.save();

    res.json({
      success: true,
      message: user.isSuspended ? 'User suspended' : 'User unsuspended',
      user: user.toPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Action failed' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ success: false, message: 'Cannot delete an admin' });

    // Delete user messages & media
    const messages = await Message.find({
      $or: [{ senderId: user._id }, { receiverId: user._id }],
      cloudinaryPublicId: { $ne: null },
    });

    // Delete media from Cloudinary
    const deletePromises = messages
      .filter((m) => m.cloudinaryPublicId)
      .map((m) =>
        cloudinary.uploader.destroy(m.cloudinaryPublicId, { resource_type: 'auto' }).catch(() => {})
      );
    await Promise.all(deletePromises);

    // Delete all messages
    await Message.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] });
    await CallLog.deleteMany({ $or: [{ caller: user._id }, { receiver: user._id }] });
    await User.findByIdAndDelete(user._id);

    res.json({ success: true, message: 'User and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, suspendedUsers, totalMessages, totalCalls] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isOnline: true }),
      User.countDocuments({ isSuspended: true }),
      Message.countDocuments(),
      CallLog.countDocuments(),
    ]);

    // Recent registrations (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({
      success: true,
      stats: { totalUsers, activeUsers, suspendedUsers, totalMessages, totalCalls, recentUsers },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Stats failed' });
  }
};

// GET /api/admin/call-logs
const getCallLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      CallLog.find()
        .populate('caller', 'username avatar')
        .populate('receiver', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CallLog.countDocuments(),
    ]);

    res.json({ success: true, logs, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch call logs' });
  }
};

module.exports = { getAllUsers, suspendUser, deleteUser, getStats, getCallLogs };
