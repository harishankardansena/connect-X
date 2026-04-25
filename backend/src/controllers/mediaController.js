const { upload, cloudinary } = require('../config/cloudinary');
const Message = require('../models/Message');

// POST /api/media/upload
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { receiverId } = req.body;
    const senderId = req.user._id;

    // Determine media type
    let type = 'document';
    if (req.file.mimetype.startsWith('image/')) type = 'image';
    else if (req.file.mimetype.startsWith('video/')) type = 'video';

    // Media expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const message = await Message.create({
      senderId,
      receiverId,
      content: '',
      type,
      mediaUrl: req.file.path,            // Cloudinary URL
      cloudinaryPublicId: req.file.filename, // Cloudinary public_id
      expiresAt,
    });

    const populated = await message.populate([
      { path: 'senderId', select: 'username avatar' },
      { path: 'receiverId', select: 'username avatar' },
    ]);

    res.status(201).json({
      success: true,
      message: populated,
      mediaUrl: req.file.path,
      expiresAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
  }
};

module.exports = { uploadMedia, upload };
