// Quick script to check if user has admin role
const mysql = require('mysql2/promise');

async function checkAdmin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'exam_system'
  });

  try {
    const [users] = await connection.query('SELECT id, email, role FROM users');
    console.log('\n=== All Users ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    const [exams] = await connection.query('SELECT id, title FROM exams');
    console.log('\n=== All Exams ===');
    exams.forEach(exam => {
      console.log(`ID: ${exam.id}, Title: ${exam.title}`);
    });
    
    const [questions] = await connection.query('SELECT id, exam_id, text FROM questions LIMIT 5');
    console.log('\n=== Sample Questions ===');
    questions.forEach(q => {
      console.log(`ID: ${q.id}, Exam ID: ${q.exam_id}, Text: ${q.text.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdmin();