require('dotenv').config();
const { promisePool } = require('../config/database');

async function checkExamData() {
  try {
    console.log('🔍 Checking exam data...\n');
    
    // Check exams
    const [exams] = await promisePool.query('SELECT id, code, title, total_questions FROM exams ORDER BY id');
    console.log('📚 Exams in database:');
    console.table(exams);
    
    // Check questions count per exam
    const [questionCounts] = await promisePool.query(`
      SELECT e.id, e.code, e.title, COUNT(q.id) as question_count 
      FROM exams e 
      LEFT JOIN questions q ON e.id = q.exam_id 
      GROUP BY e.id, e.code, e.title 
      ORDER BY e.id
    `);
    console.log('\n📝 Question counts per exam:');
    console.table(questionCounts);
    
    // Check if there are any questions at all
    const [totalQuestions] = await promisePool.query('SELECT COUNT(*) as total FROM questions');
    console.log(`\n📊 Total questions in database: ${totalQuestions[0].total}`);
    
    if (totalQuestions[0].total === 0) {
      console.log('\n⚠️  No questions found in the database. You may need to:');
      console.log('   1. Seed the database with sample questions');
      console.log('   2. Upload questions via the admin interface');
      console.log('   3. Run: npm run db:seed');
    }
    
  } catch (error) {
    console.error('Error checking exam data:', error);
  } finally {
    await promisePool.end();
  }
}

checkExamData();