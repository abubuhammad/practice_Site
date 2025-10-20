const express = require('express');
const router = express.Router();
const attemptsController = require('../controllers/attemptsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Save/update answer for a question
router.post('/:attemptId/answers', attemptsController.saveAnswer);

// Get current attempt progress
router.get('/:attemptId/progress', attemptsController.getProgress);

// Submit exam for grading
router.post('/:attemptId/submit', attemptsController.submitExam);

// Get attempt details (after completion)
router.get('/:attemptId', attemptsController.getAttemptDetails);

module.exports = router;