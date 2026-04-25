const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const CallLog = require('../models/CallLog');

// userId → socketId map
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Unauthorized'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || user.isSuspended) return next(new Error('Unauthorized'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🟢 Connected: ${user.username} (${socket.id})`);

    // Track online status
    onlineUsers.set(user._id.toString(), socket.id);
    await User.findByIdAndUpdate(user._id, { isOnline: true, socketId: socket.id });

    // Broadcast online status to all
    io.emit('user:status', { userId: user._id, isOnline: true });

    // ─── CHAT EVENTS ────────────────────────────────────────────────────────

    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content, type = 'text', mediaUrl, cloudinaryPublicId } = data;

        if (!receiverId || (!content && type === 'text')) return;

        const expiresAt = type !== 'text' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

        const message = await Message.create({
          senderId: user._id,
          receiverId,
          content: content?.trim() || '',
          type,
          mediaUrl: mediaUrl || null,
          cloudinaryPublicId: cloudinaryPublicId || null,
          expiresAt,
        });

        const populated = await Message.findById(message._id)
          .populate('senderId', 'username avatar')
          .populate('receiverId', 'username avatar');

        // Send to sender (confirmation)
        socket.emit('message:sent', populated);

        // Deliver to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:receive', populated);
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:seen', async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { seen: true, seenAt: new Date() });

        const senderSocketId = onlineUsers.get(senderId?.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:seen', { messageId });
        }
      } catch (err) {}
    });

    socket.on('typing:start', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:start', { userId: user._id, username: user.username });
      }
    });

    socket.on('typing:stop', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:stop', { userId: user._id });
      }
    });

    // ─── WEBRTC SIGNALING EVENTS ─────────────────────────────────────────────

    socket.on('call:offer', async ({ receiverId, offer, callType }) => {
      try {
        const receiverSocketId = onlineUsers.get(receiverId?.toString());

        // Create a pending call log
        const callLog = await CallLog.create({
          caller: user._id,
          receiver: receiverId,
          type: callType || 'audio',
          status: 'missed',
        });

        if (receiverSocketId) {
          io.to(receiverSocketId).emit('call:incoming', {
            callId: callLog._id,
            callerId: user._id,
            callerName: user.username,
            callerAvatar: user.avatar,
            callType: callType || 'audio',
            offer,
          });
          socket.emit('call:ringing', { callId: callLog._id, receiverId });
        } else {
          // Receiver offline
          socket.emit('call:unavailable', { receiverId });
          await CallLog.findByIdAndUpdate(callLog._id, { status: 'missed' });
        }
      } catch (err) {
        socket.emit('error', { message: 'Call failed' });
      }
    });

    socket.on('call:answer', async ({ callId, callerId, answer }) => {
      try {
        const callerSocketId = onlineUsers.get(callerId?.toString());
        if (callerSocketId) {
          io.to(callerSocketId).emit('call:answered', { answer, callId });
        }
        await CallLog.findByIdAndUpdate(callId, { status: 'answered', startedAt: new Date() });
      } catch (err) {}
    });

    socket.on('call:reject', async ({ callId, callerId }) => {
      try {
        const callerSocketId = onlineUsers.get(callerId?.toString());
        if (callerSocketId) {
          io.to(callerSocketId).emit('call:rejected', { callId });
        }
        await CallLog.findByIdAndUpdate(callId, { status: 'rejected' });
      } catch (err) {}
    });

    socket.on('call:end', async ({ callId, receiverId, duration }) => {
      try {
        const otherSocketId = onlineUsers.get(receiverId?.toString());
        if (otherSocketId) {
          io.to(otherSocketId).emit('call:ended', { callId });
        }
        if (callId) {
          await CallLog.findByIdAndUpdate(callId, {
            endedAt: new Date(),
            duration: duration || 0,
          });
        }
      } catch (err) {}
    });

    socket.on('call:ice-candidate', ({ receiverId, candidate }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('call:ice-candidate', { candidate, senderId: user._id });
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log(`🔴 Disconnected: ${user.username}`);
      onlineUsers.delete(user._id.toString());
      await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date(), socketId: null });
      io.emit('user:status', { userId: user._id, isOnline: false, lastSeen: new Date() });
    });
  });
};

const getOnlineUsers = () => onlineUsers;

module.exports = { initializeSocket, getOnlineUsers };
