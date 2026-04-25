const express = require('express');
const router = express.Router();
const { sendRequest, acceptRequest, rejectRequest } = require('../controllers/connectionController');
const { protect } = require('../middleware/auth');

router.post('/request/:id', protect, sendRequest);
router.post('/accept/:id', protect, acceptRequest);
router.post('/reject/:id', protect, rejectRequest);

module.exports = router;
