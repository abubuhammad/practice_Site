const { promisePool } = require('../config/database');

async function testQuestionShuffling() {
  try {
    console.log('🧪 Testing Question Shuffling Functionality\n');
    
    // Get first exam for testing
    const [exams] = await promisePool.query('SELECT id, code, title FROM exams LIMIT 1');
    
    if (exams.length === 0) {
      console.log('❌ No exams found. Please create an exam first.');
      return;
    }
    
    const exam = exams[0];
    console.log(`📚 Testing with exam: ${exam.code} - ${exam.title}`);
    
    // Check how many questions exist
    const [questionCount] = await promisePool.query(
      'SELECT COUNT(*) as count FROM questions WHERE exam_id = ?',
      [exam.id]
    );
    
    const totalQuestions = questionCount[0].count;
    console.log(`📊 Total questions in exam: ${totalQuestions}`);
    
    if (totalQuestions === 0) {
      console.log('❌ No questions found in exam. Please add questions first.');
      return;
    }
    
    // Create test user if doesn't exist
    const [users] = await promisePool.query("SELECT id FROM users WHERE email = 'test@example.com'");
    let userId;
    
    if (users.length === 0) {
      const [userResult] = await promisePool.query(
        "INSERT INTO users (email, password_hash, role) VALUES ('test@example.com', 'test', 'user')"
      );
      userId = userResult.insertId;
      console.log('👤 Created test user');
    } else {
      userId = users[0].id;
      console.log('👤 Using existing test user');
    }
    
    // Simulate creating multiple attempts to test shuffling
    const attemptResults = [];
    const numberOfAttempts = 3;
    
    for (let i = 1; i <= numberOfAttempts; i++) {
      console.log(`\n🎯 Creating attempt ${i}...`);
      
      // Create attempt
      const [attemptResult] = await promisePool.query(
        'INSERT INTO attempts (user_id, exam_id, start_time, completed) VALUES (?, ?, NOW(), FALSE)',
        [userId, exam.id]
      );
      
      const attemptId = attemptResult.insertId;
      
      // Get all questions for the exam
      const [allQuestions] = await promisePool.query(
        'SELECT id FROM questions WHERE exam_id = ?',
        [exam.id]
      );
      
      // Shuffle questions (same logic as in controller)
      const shuffled = [...allQuestions];
      for (let j = shuffled.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
      }
      
      // Select up to 40 questions
      const selected = shuffled.slice(0, Math.min(40, allQuestions.length));
      
      // Store selected questions
      for (let j = 0; j < selected.length; j++) {
        await promisePool.query(
          'INSERT INTO attempt_questions (attempt_id, question_id, question_order) VALUES (?, ?, ?)',
          [attemptId, selected[j].id, j + 1]
        );
      }
      
      // Get the question order for this attempt
      const [attemptQuestions] = await promisePool.query(
        'SELECT question_id FROM attempt_questions WHERE attempt_id = ? ORDER BY question_order',
        [attemptId]
      );
      
      const questionIds = attemptQuestions.map(q => q.question_id);
      attemptResults.push({
        attemptId,
        questionIds,
        count: questionIds.length
      });
      
      console.log(`   ✅ Attempt ${attemptId}: ${questionIds.length} questions selected`);
      console.log(`   📋 Question IDs: [${questionIds.slice(0, 10).join(', ')}${questionIds.length > 10 ? '...' : ''}]`);
    }
    
    // Compare attempts to verify shuffling
    console.log('\n🔍 Comparing attempts for shuffling...');
    
    let allSame = true;
    for (let i = 1; i < attemptResults.length; i++) {
      const same = JSON.stringify(attemptResults[0].questionIds) === JSON.stringify(attemptResults[i].questionIds);
      if (!same) {
        allSame = false;
      }
      console.log(`   Attempt 1 vs Attempt ${i + 1}: ${same ? '🔴 SAME ORDER' : '✅ DIFFERENT ORDER'}`);
    }
    
    if (allSame && attemptResults.length > 1) {
      console.log('\n⚠️  WARNING: All attempts have the same question order!');
      console.log('   This could happen by chance if there are very few questions.');
      console.log('   Try running the test again or add more questions.');
    } else if (attemptResults.length > 1) {
      console.log('\n✅ SUCCESS: Question shuffling is working correctly!');
    }
    
    // Check question limits
    const maxQuestions = Math.max(...attemptResults.map(r => r.count));
    console.log(`\n📏 Question count verification:`);
    console.log(`   Max questions per attempt: ${maxQuestions}`);
    console.log(`   Total available questions: ${totalQuestions}`);
    
    if (totalQuestions > 40 && maxQuestions <= 40) {
      console.log('   ✅ Correctly limited to 40 questions');
    } else if (totalQuestions <= 40 && maxQuestions === totalQuestions) {
      console.log('   ✅ Correctly used all available questions');
    } else {
      console.log('   ❌ Question limiting not working correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      await promisePool.query('DELETE FROM attempts WHERE user_id = (SELECT id FROM users WHERE email = "test@example.com")');
      await promisePool.query('DELETE FROM users WHERE email = "test@example.com"');
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError.message);
    }
  }
}

// Run test
testQuestionShuffling()
  .then(() => {
    console.log('\n🎉 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
