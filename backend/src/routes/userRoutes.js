const express = require('express');
const router = express.Router();
const { searchUsers, getUserById, getUserByUsername } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/search', searchUsers);
router.get('/username/:username', getUserByUsername);
router.get('/:id', getUserById);

module.exports = router;
