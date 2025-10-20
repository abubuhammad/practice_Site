const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  authController.register
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  authController.login
);

// Google OAuth
router.post('/google', authController.googleAuth);

// Get current user
router.get('/me', authenticateToken, authController.getCurrentUser);

// Password reset request
router.post('/password-reset',
  [body('email').isEmail().normalizeEmail()],
  authController.requestPasswordReset
);

// Password reset confirm
router.post('/password-reset/confirm',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  authController.confirmPasswordReset
);

module.exports = router;