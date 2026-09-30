const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { authenticate } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLogger');

// Login route triggers audit log after successful completion
router.post('/login', auditLog('USER_LOGIN', 'users'), authController.login);

// Get current user info
router.get('/me', authenticate, authController.getMe);

module.exports = router;
