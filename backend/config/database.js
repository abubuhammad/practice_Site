const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'exam_practice_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get promise-based pool
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('💡 Make sure XAMPP MySQL is running!');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Database does not exist. Run: npm run db:init');
    }
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
  }
});

module.exports = { pool, promisePool };