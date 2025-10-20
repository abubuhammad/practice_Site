const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { promisePool } = require('../config/database');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user already exists
    const [existingUsers] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await promisePool.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, 'user']
    );

    const user = {
      id: result.insertId,
      email,
      role: 'user'
    };

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await promisePool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Google OAuth (placeholder - requires Google OAuth setup)
exports.googleAuth = async (req, res) => {
  try {
    const { google_token } = req.body;

    // TODO: Verify Google token with Google API
    // For now, return error
    res.status(501).json({ 
      error: 'Google OAuth not yet implemented',
      message: 'Please use email/password authentication'
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const [users] = await promisePool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
};

// Request password reset (placeholder)
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const [users] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    // Always return success (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

    // TODO: Implement email sending with reset token
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
};

// Confirm password reset (placeholder)
exports.confirmPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // TODO: Verify reset token and update password
    res.status(501).json({ 
      error: 'Password reset not yet implemented'
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};