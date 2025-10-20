const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'exam_practice_db';

async function addOptionShuffleSupport() {
  let connection;

  try {
    console.log('🔄 Connecting to MySQL...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: DB_NAME
    });

    console.log('✅ Connected to MySQL');
    console.log('🔍 Checking for existing options_order column...');

    const [cols] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attempt_questions' AND COLUMN_NAME = 'options_order'`,
      [DB_NAME]
    );

    if (cols.length === 0) {
      console.log('🔄 Adding options_order column to attempt_questions...');
      await connection.query(
        `ALTER TABLE attempt_questions ADD COLUMN options_order JSON NULL AFTER question_order`
      );
      console.log('✅ Added column: attempt_questions.options_order (JSON)');
    } else {
      console.log('ℹ️ options_order column already exists. Skipping.');
    }

    console.log('✅ Migration completed successfully!');
    console.log('💡 This persists per-attempt shuffled option order for consistency across fetches');
  } catch (error) {
    console.error('❌ Error running migration:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure MySQL is running!');
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
  addOptionShuffleSupport();
}

module.exports = addOptionShuffleSupport;
