const User = require('../models/User');

// GET /api/users/search?q=username
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' },
      _id: { $ne: req.user._id }, // exclude self
      isSuspended: false,
    })
      .select('username uniqueId avatar bio isOnline lastSeen')
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username uniqueId avatar bio isOnline lastSeen createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/username/:username
const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).select(
      'username uniqueId avatar bio isOnline lastSeen createdAt'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { searchUsers, getUserById, getUserByUsername };
