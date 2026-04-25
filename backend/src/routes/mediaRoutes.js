const express = require('express');
const router = express.Router();
const { uploadMedia, upload } = require('../controllers/mediaController');
const { protect } = require('../middleware/auth');

router.post('/upload', protect, upload.single('file'), uploadMedia);

module.exports = router;
