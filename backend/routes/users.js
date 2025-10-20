const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get current user's attempts
router.get('/me/attempts', usersController.getUserAttempts);

// Get user statistics
router.get('/me/stats', usersController.getUserStats);

module.exports = router;