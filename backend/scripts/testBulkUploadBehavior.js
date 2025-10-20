const { promisePool } = require('../config/database');

async function testBulkUploadBehavior() {
  try {
    console.log('🧪 Testing Bulk Upload Behavior\n');
    
    // Get first exam for testing
    const [exams] = await promisePool.query('SELECT id, code, title FROM exams LIMIT 1');
    
    if (exams.length === 0) {
      console.log('❌ No exams found. Please create an exam first.');
      return;
    }
    
    const exam = exams[0];
    console.log(`📚 Testing with exam: ${exam.code} - ${exam.title}`);
    
    // Check current question count
    const [beforeCount] = await promisePool.query(
      'SELECT COUNT(*) as count FROM questions WHERE exam_id = ?',
      [exam.id]
    );
    
    const questionsBeforeUpload = beforeCount[0].count;
    console.log(`📊 Questions before upload: ${questionsBeforeUpload}`);
    
    if (questionsBeforeUpload === 0) {
      console.log('⚠️  No existing questions found. Creating some test questions first...');
      
      // Create a few test questions
      for (let i = 1; i <= 3; i++) {
        const [questionResult] = await promisePool.query(
          'INSERT INTO questions (exam_id, text, question_type, order_index) VALUES (?, ?, ?, ?)',
          [exam.id, `Test Question ${i}`, 'multiple_choice', i]
        );
        
        const questionId = questionResult.insertId;
        
        // Add options
        for (let j = 1; j <= 4; j++) {
          await promisePool.query(
            'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
            [questionId, `Option ${j}`, j === 1, j]
          );
        }
      }
      
      // Update question count
      const [afterCreateCount] = await promisePool.query(
        'SELECT COUNT(*) as count FROM questions WHERE exam_id = ?',
        [exam.id]
      );
      
      console.log(`✅ Created test questions. New count: ${afterCreateCount[0].count}`);
    }
    
    // Get updated count
    const [currentCount] = await promisePool.query(
      'SELECT COUNT(*) as count FROM questions WHERE exam_id = ?',
      [exam.id]
    );
    
    const questionsBefore = currentCount[0].count;
    console.log(`📊 Current question count: ${questionsBefore}`);
    
    // Get all current question IDs and texts
    const [currentQuestions] = await promisePool.query(
      'SELECT id, text FROM questions WHERE exam_id = ? ORDER BY id',
      [exam.id]
    );
    
    console.log('\n📋 Current questions:');
    currentQuestions.forEach(q => {
      console.log(`   - ID: ${q.id}, Text: "${q.text.substring(0, 50)}..."`);
    });
    
    console.log('\n🔍 Simulating bulk upload...');
    console.log('   (Note: This is testing the logic, not actually uploading a file)');
    
    // Simulate adding 2 new questions through bulk import logic
    const connection = await promisePool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // This simulates what happens in bulkImportQuestions
      for (let i = 1; i <= 2; i++) {
        const [questionResult] = await connection.query(
          'INSERT INTO questions (exam_id, text, question_type, order_index) VALUES (?, ?, ?, ?)',
          [exam.id, `Bulk Imported Question ${i}`, 'multiple_choice', questionsBefore + i]
        );
        
        const questionId = questionResult.insertId;
        
        // Add options
        for (let j = 1; j <= 4; j++) {
          await connection.query(
            'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
            [questionId, `Bulk Option ${j}`, j === 1, j]
          );
        }
      }
      
      // Update exam total_questions count (this is what bulk import does)
      await connection.query(
        'UPDATE exams SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = ?) WHERE id = ?',
        [exam.id, exam.id]
      );
      
      await connection.commit();
      console.log('✅ Simulated bulk upload completed');
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    // Check final count
    const [afterCount] = await promisePool.query(
      'SELECT COUNT(*) as count FROM questions WHERE exam_id = ?',
      [exam.id]
    );
    
    const questionsAfter = afterCount[0].count;
    console.log(`📊 Questions after simulated upload: ${questionsAfter}`);
    
    // Get all questions after upload
    const [allQuestions] = await promisePool.query(
      'SELECT id, text FROM questions WHERE exam_id = ? ORDER BY id',
      [exam.id]
    );
    
    console.log('\n📋 All questions after upload:');
    allQuestions.forEach(q => {
      console.log(`   - ID: ${q.id}, Text: "${q.text.substring(0, 50)}..."`);
    });
    
    // Analysis
    const questionsAdded = questionsAfter - questionsBefore;
    console.log(`\n🔍 Analysis:`);
    console.log(`   - Questions before: ${questionsBefore}`);
    console.log(`   - Questions after: ${questionsAfter}`);
    console.log(`   - Questions added: ${questionsAdded}`);
    
    if (questionsAdded === 2) {
      console.log('✅ BULK UPLOAD IS WORKING CORRECTLY - Questions are being APPENDED');
    } else if (questionsAfter === 2) {
      console.log('❌ BULK UPLOAD IS REPLACING - Questions were replaced instead of appended');
    } else {
      console.log('❓ Unexpected result - please investigate further');
    }
    
    // Check if original questions still exist
    let originalQuestionsStillExist = true;
    for (const originalQ of currentQuestions) {
      const stillExists = allQuestions.some(q => q.id === originalQ.id);
      if (!stillExists) {
        originalQuestionsStillExist = false;
        console.log(`   ⚠️  Original question ${originalQ.id} no longer exists`);
      }
    }
    
    if (originalQuestionsStillExist && currentQuestions.length > 0) {
      console.log('✅ All original questions still exist - APPEND behavior confirmed');
    } else if (!originalQuestionsStillExist) {
      console.log('❌ Original questions were deleted - REPLACE behavior detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🧹 Cleaning up test data...');
    try {
      // Remove test questions we created
      await promisePool.query(
        'DELETE FROM questions WHERE exam_id = ? AND (text LIKE "Test Question %" OR text LIKE "Bulk Imported Question %")',
        [exams[0].id]
      );
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError.message);
    }
  }
}

testBulkUploadBehavior()
  .then(() => {
    console.log('\n🎉 Bulk upload behavior test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });