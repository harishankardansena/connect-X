const express = require('express');
const router = express.Router();
const { getAllUsers, suspendUser, deleteUser, getStats, getCallLogs } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);
router.get('/call-logs', getCallLogs);

module.exports = router;
