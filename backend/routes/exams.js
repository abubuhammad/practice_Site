const express = require('express');
const router = express.Router();
const examsController = require('../controllers/examsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get all exams (public or authenticated)
router.get('/', optionalAuth, examsController.getAllExams);

// Get exam details
router.get('/:examId', authenticateToken, examsController.getExamDetails);

// Start new exam attempt
router.get('/:examId/start', authenticateToken, examsController.startExam);

// Get exam questions for an attempt
router.get('/:examId/questions', authenticateToken, examsController.getExamQuestions);

module.exports = router;