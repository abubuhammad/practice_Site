const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'exam_practice_db';

const migration = `
USE ${DB_NAME};

-- Update question_type enum to include hotspot
ALTER TABLE questions 
MODIFY COLUMN question_type ENUM('single_choice', 'multiple_choice', 'drag_drop', 'hotspot') 
DEFAULT 'single_choice';

-- Add table for hotspot areas (clickable regions)
CREATE TABLE IF NOT EXISTS hotspot_areas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  area_type ENUM('rectangle', 'circle', 'polygon') DEFAULT 'rectangle',
  coordinates JSON NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  label VARCHAR(255),
  explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_question_id (question_id)
);

-- Add table for hotspot question data (images, instructions)
CREATE TABLE IF NOT EXISTS hotspot_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  image_url VARCHAR(500),
  image_width INT DEFAULT 800,
  image_height INT DEFAULT 600,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_question_id (question_id)
);
`;

async function addHotspotSupport() {
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
    console.log('🔄 Adding hotspot support...');

    await connection.query(migration);

    console.log('✅ Migration completed successfully!');
    console.log('📊 Added hotspot support:');
    console.log('   - Updated question_type enum to include "hotspot"');
    console.log('   - Created hotspot_areas table');
    console.log('   - Created hotspot_data table');

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
  addHotspotSupport();
}

module.exports = addHotspotSupport;