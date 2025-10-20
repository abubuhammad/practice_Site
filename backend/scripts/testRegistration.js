const axios = require('axios');
const { promisePool } = require('../config/database');

const API_BASE_URL = 'http://localhost:5000/api';

async function testRegistration() {
  try {
    console.log('🧪 Testing User Registration\n');
    
    // Generate unique email for testing
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'password123';
    
    console.log(`📧 Test email: ${testEmail}`);
    console.log(`🔐 Test password: ${testPassword}\n`);
    
    // Test 1: Valid registration
    console.log('🎯 Test 1: Valid registration');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword
      });
      
      console.log('✅ Registration successful!');
      console.log('📊 Response status:', response.status);
      console.log('👤 User created:', response.data.user);
      console.log('🎫 Token received:', response.data.token ? 'Yes' : 'No');
      
      // Verify user was created in database
      const [users] = await promisePool.query(
        'SELECT id, email, role, created_at FROM users WHERE email = ?',
        [testEmail]
      );
      
      if (users.length > 0) {
        console.log('✅ User verified in database:', users[0]);
      } else {
        console.log('❌ User not found in database');
      }
      
    } catch (error) {
      console.log('❌ Registration failed!');
      if (error.response) {
        console.log('📊 Status:', error.response.status);
        console.log('💬 Error:', error.response.data);
      } else {
        console.log('🔥 Network/Server Error:', error.message);
      }
    }
    
    // Test 2: Duplicate email registration
    console.log('\n🎯 Test 2: Duplicate email registration');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword
      });
      
      console.log('❌ Duplicate registration should have failed but succeeded');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected duplicate email');
        console.log('💬 Error message:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error for duplicate email');
        console.log('💬 Error:', error.response ? error.response.data : error.message);
      }
    }
    
    // Test 3: Invalid email format
    console.log('\n🎯 Test 3: Invalid email format');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: 'invalid-email',
        password: testPassword,
        confirmPassword: testPassword
      });
      
      console.log('❌ Invalid email should have failed but succeeded');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected invalid email');
        console.log('💬 Validation errors:', error.response.data.errors);
      } else {
        console.log('❌ Unexpected error for invalid email');
        console.log('💬 Error:', error.response ? error.response.data : error.message);
      }
    }
    
    // Test 4: Password too short
    console.log('\n🎯 Test 4: Password too short');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `short${timestamp}@example.com`,
        password: '123',
        confirmPassword: '123'
      });
      
      console.log('❌ Short password should have failed but succeeded');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected short password');
        console.log('💬 Validation errors:', error.response.data.errors);
      } else {
        console.log('❌ Unexpected error for short password');
        console.log('💬 Error:', error.response ? error.response.data : error.message);
      }
    }
    
    // Test 5: Password mismatch
    console.log('\n🎯 Test 5: Password mismatch');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `mismatch${timestamp}@example.com`,
        password: testPassword,
        confirmPassword: 'differentpassword'
      });
      
      console.log('❌ Password mismatch should have failed but succeeded');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected password mismatch');
        console.log('💬 Validation errors:', error.response.data.errors);
      } else {
        console.log('❌ Unexpected error for password mismatch');
        console.log('💬 Error:', error.response ? error.response.data : error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      const timestamp = Date.now();
      await promisePool.query(
        'DELETE FROM users WHERE email LIKE ? OR email LIKE ? OR email LIKE ?',
        [`test${timestamp}@example.com`, `short${timestamp}@example.com`, `mismatch${timestamp}@example.com`]
      );
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError.message);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer invalid_token' }
    });
    return true;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Server is running (returned 401 for invalid token)
      return true;
    }
    return false;
  }
}

// Main execution
(async () => {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:5000');
    console.log('💡 Please start the server first:');
    console.log('   cd backend');
    console.log('   npm start');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  
  await testRegistration();
  
  console.log('\n🎉 Registration tests completed!');
  process.exit(0);
})().catch((error) => {
  console.error('💥 Test crashed:', error.message);
  process.exit(1);
});