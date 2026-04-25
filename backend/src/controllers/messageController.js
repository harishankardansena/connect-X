const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/messages/:userId — get conversation history
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar');

    // Mark unseen messages as seen
    await Message.updateMany(
      { senderId: userId, receiverId: myId, seen: false },
      { seen: true, seenAt: new Date() }
    );

    res.json({ success: true, messages: messages.reverse(), page, hasMore: messages.length === limit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversation' });
  }
};

// GET /api/messages/conversations — get all recent conversations (contact list)
const getConversations = async (req, res) => {
  try {
    const myId = req.user._id;

    // Get latest message per conversation partner
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: myId }, { receiverId: myId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$senderId', myId] },
              then: '$receiverId',
              else: '$senderId',
            },
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverId', myId] }, { $eq: ['$seen', false] }] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 50 },
    ]);

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// POST /api/messages/send — send a text message (via HTTP fallback)
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type = 'text', mediaUrl, cloudinaryPublicId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver is required' });
    }

    if (type === 'text' && !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    // Set expiry for media messages
    const expiresAt = type !== 'text' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    const message = await Message.create({
      senderId,
      receiverId,
      content: content?.trim() || '',
      type,
      mediaUrl: mediaUrl || null,
      cloudinaryPublicId: cloudinaryPublicId || null,
      expiresAt,
    });

    const populated = await message.populate([
      { path: 'senderId', select: 'username avatar' },
      { path: 'receiverId', select: 'username avatar' },
    ]);

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// DELETE /api/messages/:messageId — delete a message (sender only)
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '';
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

// DELETE /api/messages/chat/:userId — delete entire chat with a user
const deleteChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId },
      ],
    });

    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete chat' });
  }
};

module.exports = { getConversation, getConversations, sendMessage, deleteMessage, deleteChat };
