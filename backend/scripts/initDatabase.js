const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'exam_practice_db';

const schema = `
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
USE ${DB_NAME};

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_google_id (google_id)
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  path VARCHAR(50) NOT NULL,
  time_limit_minutes INT NOT NULL,
  passing_score INT NOT NULL DEFAULT 700,
  total_questions INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_path (path)
);

-- Case Studies table
CREATE TABLE IF NOT EXISTS case_studies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  exam_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  scenario_text TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  INDEX idx_exam_id (exam_id)
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  exam_id INT NOT NULL,
  case_study_id INT,
  text TEXT NOT NULL,
  explanation TEXT,
  question_type ENUM('single_choice', 'multiple_choice', 'drag_drop') DEFAULT 'single_choice',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE SET NULL,
  INDEX idx_exam_id (exam_id),
  INDEX idx_case_study_id (case_study_id)
);

-- Options table
CREATE TABLE IF NOT EXISTS options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  order_index INT NOT NULL DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_question_id (question_id)
);

-- Attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  exam_id INT NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL,
  score INT NULL,
  completed BOOLEAN DEFAULT FALSE,
  time_remaining_seconds INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_exam_id (exam_id),
  INDEX idx_completed (completed)
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option_ids JSON,
  is_correct BOOLEAN DEFAULT FALSE,
  marked_for_review BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_attempt_id (attempt_id),
  INDEX idx_question_id (question_id),
  UNIQUE KEY unique_attempt_question (attempt_id, question_id)
);
`;

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    
    // Connect without database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');
    console.log('🔄 Creating database and tables...');

    // Execute schema
    await connection.query(schema);

    console.log('✅ Database initialized successfully!');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log('📝 Tables created:');
    console.log('   - users');
    console.log('   - exams');
    console.log('   - case_studies');
    console.log('   - questions');
    console.log('   - options');
    console.log('   - attempts');
    console.log('   - answers');
    console.log('\n💡 Next step: Run "npm run db:seed" to add sample data');

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure XAMPP MySQL is running!');
      console.error('   1. Open XAMPP Control Panel as Administrator');
      console.error('   2. Start MySQL service');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;