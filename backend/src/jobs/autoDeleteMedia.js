const cron = require('node-cron');
const Message = require('../models/Message');
const { cloudinary } = require('../config/cloudinary');

/**
 * Cron Job: Delete expired media every hour
 * Runs at minute 0 of every hour: '0 * * * *'
 */
const startAutoDeleteJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('🗑️  Auto-delete job running...');

    try {
      const expired = await Message.find({
        expiresAt: { $lte: new Date() },
        isDeleted: false,
        type: { $in: ['image', 'video', 'document'] },
        cloudinaryPublicId: { $ne: null },
      });

      console.log(`Found ${expired.length} expired media messages`);

      for (const message of expired) {
        try {
          // Determine resource type for Cloudinary
          let resourceType = 'image';
          if (message.type === 'video') resourceType = 'video';
          else if (message.type === 'document') resourceType = 'raw';

          // Delete from Cloudinary
          await cloudinary.uploader.destroy(message.cloudinaryPublicId, {
            resource_type: resourceType,
          });

          // Mark as deleted in DB
          await Message.findByIdAndUpdate(message._id, {
            isDeleted: true,
            deletedAt: new Date(),
            mediaUrl: null,
            cloudinaryPublicId: null,
            content: '🔥 Media expired and deleted',
          });

          console.log(`✅ Deleted expired media: ${message.cloudinaryPublicId}`);
        } catch (err) {
          console.error(`Failed to delete ${message._id}: ${err.message}`);
        }
      }

      console.log('✅ Auto-delete job completed');
    } catch (err) {
      console.error('Auto-delete job error:', err.message);
    }
  });

  console.log('⏰ Auto-delete cron job scheduled (runs every hour)');
};

module.exports = { startAutoDeleteJob };
