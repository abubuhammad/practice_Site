const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Template download route (now properly authenticated)
router.get('/questions/template', (req, res) => {
  console.log('🔍 Template route handler called');
  const path = require('path');
  const fs = require('fs');
  
  const templatePath = path.resolve(__dirname, '../uploads/question-bulk-template.xlsx');
  console.log('📁 Template path resolved to:', templatePath);
  
  // Check if file exists
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Template file not found at:', templatePath);
    return res.status(404).json({ error: 'Template file not found. Please regenerate the template.' });
  }
  
  console.log('✅ Template file found, preparing download');
  // Set proper headers for Excel download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="question-bulk-template.xlsx"');
  
  // Send file
  res.sendFile(templatePath, (err) => {
    if (err) {
      console.error('Template download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download template' });
      }
    }
  });
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Exam Management
router.get('/exams', adminController.getAllExamsAdmin);
router.post('/exams', adminController.createExam);
router.put('/exams/:examId', adminController.updateExam);
router.delete('/exams/:examId', adminController.deleteExam);

// Case Study Management
router.get('/case-studies', adminController.getAllCaseStudies);
router.post('/case-studies', adminController.createCaseStudy);
router.put('/case-studies/:id', adminController.updateCaseStudy);
router.delete('/case-studies/:id', adminController.deleteCaseStudy);

// Question Management
router.get('/questions', adminController.getAllQuestions);
router.get('/questions/:id', adminController.getQuestion);
router.post('/questions', adminController.createQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

// Option Management
router.post('/options', adminController.createOption);
router.put('/options/:id', adminController.updateOption);
router.delete('/options/:id', adminController.deleteOption);

// Bulk Import (file upload)
router.post('/questions/bulk', upload.single('file'), adminController.bulkImportQuestions);

// Bulk Import (JSON body)
router.post('/questions/bulk-json', adminController.bulkImportQuestionsJson);

// Enhanced Bulk Import (supports all question types)
const { enhancedBulkImportQuestions } = require('../controllers/enhancedBulkImport');
router.post('/questions/bulk-enhanced', upload.single('file'), enhancedBulkImportQuestions);

// Debug endpoint to check template status
router.get('/questions/template/status', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  
  const templatePath = path.resolve(__dirname, '../../frontend/public/templates/question-bulk-template.xlsx');
  
  try {
    const exists = fs.existsSync(templatePath);
    const stats = exists ? fs.statSync(templatePath) : null;
    
    res.json({
      exists,
      path: templatePath,
      size: stats ? stats.size : null,
      modified: stats ? stats.mtime : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alternative template download from uploads directory
router.get('/questions/template/alt', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  
  const templatePath = path.resolve(__dirname, '../uploads/question-bulk-template.xlsx');
  
  // Check if file exists
  if (!fs.existsSync(templatePath)) {
    console.error('Alternative template file not found at:', templatePath);
    return res.status(404).json({ error: 'Template file not found in backend directory.' });
  }
  
  // Set proper headers for Excel download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="question-bulk-template.xlsx"');
  
  // Send file
  res.sendFile(templatePath, (err) => {
    if (err) {
      console.error('Alternative template download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download template' });
      }
    }
  });
});

// Enhanced template download (supports all question types)
router.get('/questions/template/enhanced', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  
  const templatePath = path.resolve(__dirname, '../uploads/enhanced-question-template.xlsx');
  
  // Check if file exists
  if (!fs.existsSync(templatePath)) {
    console.error('Enhanced template file not found at:', templatePath);
    return res.status(404).json({ error: 'Enhanced template file not found. Please regenerate the template.' });
  }
  
  // Set proper headers for Excel download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="enhanced-question-template.xlsx"');
  
  // Send file
  res.sendFile(templatePath, (err) => {
    if (err) {
      console.error('Enhanced template download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download enhanced template' });
      }
    }
  });
});

// User Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/role', adminController.updateUserRole);

// Statistics
router.get('/stats', adminController.getAdminStats);

module.exports = router;
