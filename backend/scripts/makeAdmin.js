const mysql = require('mysql2/promise');
require('dotenv').config();

async function makeAdmin(email) {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'exam_practice_db'
    });

    console.log('✅ Connected to database');

    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, email, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    const user = users[0];

    if (user.role === 'admin') {
      console.log(`ℹ️  User "${email}" is already an admin`);
      process.exit(0);
    }

    // Update user role to admin
    await connection.query(
      'UPDATE users SET role = ? WHERE email = ?',
      ['admin', email]
    );

    console.log(`✅ User "${email}" is now an admin!`);
    console.log('\n💡 The user needs to log out and log back in for changes to take effect.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
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

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node makeAdmin.js <email>');
  console.error('   Example: node makeAdmin.js user@example.com');
  process.exit(1);
}

// Run the function
makeAdmin(email);