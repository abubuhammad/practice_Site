const mysql = require('mysql2');
require('dotenv').config();

// Prefer explicit DB_* vars, then fall back to popular managed provider envs (Railway, etc.)
const DB_HOST = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
const DB_USER = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
const DB_NAME = process.env.DB_NAME || process.env.MYSQLDATABASE || 'exam_practice_db';
const DB_PORT = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);

// Create connection pool
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
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
      console.error('💡 Ensure your MySQL instance is reachable at', `${DB_HOST}:${DB_PORT}`);
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
