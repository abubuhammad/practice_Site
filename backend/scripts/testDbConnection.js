const { promisePool } = require('../config/database');

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    const [rows] = await promisePool.query('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    // Check if users table exists
    console.log('🔍 Checking users table...');
    const [tableInfo] = await promisePool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'exam_practice_db']);
    
    if (tableInfo.length === 0) {
      console.log('❌ Users table does not exist');
      console.log('💡 Run: npm run db:init');
      return;
    }
    
    console.log('✅ Users table exists with columns:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : '(required)'}`);
    });
    
    // Check if there are any users
    const [userCount] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Current user count: ${userCount[0].count}`);
    
    // Test a simple insert (and rollback)
    console.log('🧪 Testing user insertion...');
    const connection = await promisePool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [insertResult] = await connection.query(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        ['test@test.com', 'test_hash', 'user']
      );
      
      console.log('✅ User insertion test successful');
      
      await connection.rollback(); // Don't actually save the test user
      console.log('🔄 Test data rolled back');
      
    } catch (insertError) {
      await connection.rollback();
      console.error('❌ User insertion test failed:', insertError.message);
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure XAMPP MySQL is running!');
      console.log('   1. Open XAMPP Control Panel as Administrator');
      console.log('   2. Start MySQL service');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Database does not exist. Run: npm run db:init');
    }
  }
}

testDatabaseConnection()
  .then(() => {
    console.log('\n🎉 Database test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });