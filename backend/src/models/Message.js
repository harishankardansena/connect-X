const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'document'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null, // null = never expires (text messages)
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient conversation queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
// Index for auto-delete cron job
messageSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
