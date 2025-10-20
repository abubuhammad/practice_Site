const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'exam_practice_db';

const migration = `
USE ${DB_NAME};

-- Create attempt_questions table to store shuffled questions for each attempt
CREATE TABLE IF NOT EXISTS attempt_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  question_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_attempt_id (attempt_id),
  INDEX idx_question_id (question_id),
  INDEX idx_question_order (question_order),
  UNIQUE KEY unique_attempt_question (attempt_id, question_id)
);
`;

async function addAttemptQuestionsTable() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');
    console.log('🔄 Adding attempt_questions table...');

    await connection.query(migration);

    console.log('✅ Migration completed successfully!');
    console.log('📊 Added table: attempt_questions');
    console.log('💡 This table will store shuffled questions for each exam attempt');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure XAMPP MySQL is running!');
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
  addAttemptQuestionsTable();
}

module.exports = addAttemptQuestionsTable;