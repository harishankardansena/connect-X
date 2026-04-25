const express = require('express');
const router = express.Router();
const { getConversation, getConversations, sendMessage, deleteMessage, deleteChat } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:userId', getConversation);
router.post('/send', sendMessage);
router.delete('/chat/:userId', deleteChat);
router.delete('/:messageId', deleteMessage);


module.exports = router;
