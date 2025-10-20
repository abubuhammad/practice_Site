const { promisePool } = require('../config/database');

async function testAdvancedQuestionTypes() {
  console.log('🧪 Testing Advanced Question Types...\n');
  
  try {
    // Get first exam for testing
    const [exams] = await promisePool.query('SELECT id FROM exams LIMIT 1');
    if (exams.length === 0) {
      console.log('❌ No exams found. Please create an exam first.');
      return;
    }
    
    const examId = exams[0].id;
    console.log(`📝 Using exam ID: ${examId}\n`);

    const testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };

    // Test 1: Drag Drop Ordering Question
    console.log('1️⃣ Testing Drag Drop Ordering Question...');
    try {
      const [result1] = await promisePool.query(
        `INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
         VALUES (?, ?, ?, ?, ?)`,
        [examId, 'Test Drag Drop Ordering Question', 'Test explanation', 'drag_drop_ordering', 1]
      );
      
      await promisePool.query(
        `INSERT INTO drag_drop_ordering_data (question_id, instructions, drag_items, drop_zones)
         VALUES (?, ?, ?, ?)`,
        [
          result1.insertId,
          'Drag items to correct positions',
          JSON.stringify([
            { id: 1, text: 'First item', correct_position: 1 },
            { id: 2, text: 'Second item', correct_position: 2 }
          ]),
          JSON.stringify([
            { id: 1, label: 'Position 1', position: 1 },
            { id: 2, label: 'Position 2', position: 2 }
          ])
        ]
      );
      
      console.log('   ✅ Drag Drop Ordering question created successfully');
      testResults.passed++;
      testResults.tests.push({ name: 'Drag Drop Ordering', status: 'PASSED' });
    } catch (error) {
      console.log('   ❌ Drag Drop Ordering failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Drag Drop Ordering', status: 'FAILED', error: error.message });
    }

    // Test 2: Build List Question
    console.log('2️⃣ Testing Build List Question...');
    try {
      const [result2] = await promisePool.query(
        `INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
         VALUES (?, ?, ?, ?, ?)`,
        [examId, 'Test Build List Question', 'Test explanation', 'build_list', 2]
      );
      
      await promisePool.query(
        `INSERT INTO build_list_data (question_id, instructions, available_items, correct_list, max_items, allow_duplicates)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          result2.insertId,
          'Build the correct list from available items',
          JSON.stringify([
            { id: 1, text: 'Item A', category: 'Category 1' },
            { id: 2, text: 'Item B', category: 'Category 2' },
            { id: 3, text: 'Item C', category: 'Category 1' }
          ]),
          JSON.stringify([
            { id: 1, text: 'Item A', order: 1 },
            { id: 3, text: 'Item C', order: 2 }
          ]),
          5,
          false
        ]
      );
      
      console.log('   ✅ Build List question created successfully');
      testResults.passed++;
      testResults.tests.push({ name: 'Build List', status: 'PASSED' });
    } catch (error) {
      console.log('   ❌ Build List failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Build List', status: 'FAILED', error: error.message });
    }

    // Test 3: Matching Question
    console.log('3️⃣ Testing Matching Question...');
    try {
      const [result3] = await promisePool.query(
        `INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
         VALUES (?, ?, ?, ?, ?)`,
        [examId, 'Test Matching Question', 'Test explanation', 'matching', 3]
      );
      
      await promisePool.query(
        `INSERT INTO matching_data (question_id, instructions, left_column, right_column, correct_matches, allow_multiple_matches)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          result3.insertId,
          'Match items from left column to right column',
          JSON.stringify([
            { id: 1, text: 'Left Item 1' },
            { id: 2, text: 'Left Item 2' }
          ]),
          JSON.stringify([
            { id: 1, text: 'Right Item A' },
            { id: 2, text: 'Right Item B' }
          ]),
          JSON.stringify([
            { left_id: 1, right_id: 2 },
            { left_id: 2, right_id: 1 }
          ]),
          false
        ]
      );
      
      console.log('   ✅ Matching question created successfully');
      testResults.passed++;
      testResults.tests.push({ name: 'Matching', status: 'PASSED' });
    } catch (error) {
      console.log('   ❌ Matching failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Matching', status: 'FAILED', error: error.message });
    }

    // Test 4: Fill in Blank Question
    console.log('4️⃣ Testing Fill in Blank Question...');
    try {
      const [result4] = await promisePool.query(
        `INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
         VALUES (?, ?, ?, ?, ?)`,
        [examId, 'Test Fill in Blank Question', 'Test explanation', 'fill_in_blank', 4]
      );
      
      await promisePool.query(
        `INSERT INTO fill_in_blank_data (question_id, question_template, blanks, case_sensitive, partial_credit)
         VALUES (?, ?, ?, ?, ?)`,
        [
          result4.insertId,
          'The capital of France is [BLANK_1] and it has [BLANK_2] million people.',
          JSON.stringify([
            {
              blank_number: 1,
              correct_answer: 'Paris',
              possible_answers: ['Paris', 'paris']
            },
            {
              blank_number: 2,
              correct_answer: '2.2',
              possible_answers: ['2.2', '2.16', '2']
            }
          ]),
          false,
          true
        ]
      );
      
      console.log('   ✅ Fill in Blank question created successfully');
      testResults.passed++;
      testResults.tests.push({ name: 'Fill in Blank', status: 'PASSED' });
    } catch (error) {
      console.log('   ❌ Fill in Blank failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Fill in Blank', status: 'FAILED', error: error.message });
    }

    // Test 5: Simulation Question
    console.log('5️⃣ Testing Simulation Question...');
    try {
      const [result5] = await promisePool.query(
        `INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
         VALUES (?, ?, ?, ?, ?)`,
        [examId, 'Test Simulation Question', 'Test explanation', 'simulation', 5]
      );
      
      await promisePool.query(
        `INSERT INTO simulation_data (question_id, instructions, simulation_type, initial_state, tasks, validation_rules, solution_steps, time_limit_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result5.insertId,
          'Complete the Azure portal tasks',
          'azure_portal',
          JSON.stringify({ resource_groups: [], subscriptions: ['Test Subscription'] }),
          JSON.stringify([
            { id: 1, description: 'Create a resource group', required: true },
            { id: 2, description: 'Deploy a virtual machine', required: true }
          ]),
          JSON.stringify([
            { rule: 'resource_group_created', description: 'Must create at least one resource group' },
            { rule: 'vm_deployed', description: 'Must deploy a VM in the resource group' }
          ]),
          JSON.stringify([
            { step: 1, action: 'Click Resource Groups', description: 'Navigate to resource groups' },
            { step: 2, action: 'Click Add', description: 'Create new resource group' }
          ]),
          1800
        ]
      );
      
      console.log('   ✅ Simulation question created successfully');
      testResults.passed++;
      testResults.tests.push({ name: 'Simulation', status: 'PASSED' });
    } catch (error) {
      console.log('   ❌ Simulation failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Simulation', status: 'FAILED', error: error.message });
    }

    // Test 6: Sequence Ordering Question
    console.log('6️⃣ Testing Sequence Ordering Question...');
    try {
      const [result6] = await promisePool.query(
        `INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
         VALUES (?, ?, ?, ?, ?)`,
        [examId, 'Test Sequence Ordering Question', 'Test explanation', 'sequence_ordering', 6]
      );
      
      await promisePool.query(
        `INSERT INTO sequence_ordering_data (question_id, instructions, sequence_items, correct_order)
         VALUES (?, ?, ?, ?)`,
        [
          result6.insertId,
          'Put the steps in the correct order',
          JSON.stringify([
            { id: 1, text: 'First step in the process', correct_order: 1 },
            { id: 2, text: 'Second step in the process', correct_order: 2 },
            { id: 3, text: 'Final step in the process', correct_order: 3 }
          ]),
          JSON.stringify([1, 2, 3])
        ]
      );
      
      console.log('   ✅ Sequence Ordering question created successfully');
      testResults.passed++;
      testResults.tests.push({ name: 'Sequence Ordering', status: 'PASSED' });
    } catch (error) {
      console.log('   ❌ Sequence Ordering failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Sequence Ordering', status: 'FAILED', error: error.message });
    }

    // Test 7: Verify questions can be retrieved
    console.log('7️⃣ Testing Question Retrieval...');
    try {
      const [questions] = await promisePool.query(
        `SELECT q.*, 
           CASE 
             WHEN q.question_type = 'drag_drop_ordering' THEN (SELECT COUNT(*) FROM drag_drop_ordering_data WHERE question_id = q.id)
             WHEN q.question_type = 'build_list' THEN (SELECT COUNT(*) FROM build_list_data WHERE question_id = q.id)
             WHEN q.question_type = 'matching' THEN (SELECT COUNT(*) FROM matching_data WHERE question_id = q.id)
             WHEN q.question_type = 'fill_in_blank' THEN (SELECT COUNT(*) FROM fill_in_blank_data WHERE question_id = q.id)
             WHEN q.question_type = 'simulation' THEN (SELECT COUNT(*) FROM simulation_data WHERE question_id = q.id)
             WHEN q.question_type = 'sequence_ordering' THEN (SELECT COUNT(*) FROM sequence_ordering_data WHERE question_id = q.id)
             ELSE 0
           END as type_data_count
         FROM questions q 
         WHERE q.exam_id = ? AND q.question_type IN (
           'drag_drop_ordering', 'build_list', 'matching', 'fill_in_blank', 'simulation', 'sequence_ordering'
         )`,
        [examId]
      );

      if (questions.length >= 6) {
        console.log(`   ✅ Retrieved ${questions.length} advanced questions successfully`);
        
        // Check that each question has its type-specific data
        const questionsWithData = questions.filter(q => q.type_data_count > 0);
        if (questionsWithData.length === questions.length) {
          console.log('   ✅ All questions have their type-specific data');
          testResults.passed++;
          testResults.tests.push({ name: 'Question Retrieval', status: 'PASSED' });
        } else {
          throw new Error(`${questions.length - questionsWithData.length} questions missing type-specific data`);
        }
      } else {
        throw new Error(`Expected 6 questions, found ${questions.length}`);
      }
    } catch (error) {
      console.log('   ❌ Question Retrieval failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Question Retrieval', status: 'FAILED', error: error.message });
    }

    // Cleanup - remove test questions
    console.log('🧹 Cleaning up test data...');
    try {
      await promisePool.query(
        `DELETE FROM questions WHERE exam_id = ? AND text LIKE 'Test %'`,
        [examId]
      );
      console.log('   ✅ Test data cleaned up successfully');
    } catch (error) {
      console.log('   ⚠️ Cleanup warning:', error.message);
    }

    // Print test results
    console.log('\n📊 Test Results Summary:');
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    console.log('\n📋 Detailed Results:');
    testResults.tests.forEach(test => {
      const statusIcon = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${statusIcon} ${test.name}: ${test.status}`);
      if (test.error) {
        console.log(`      Error: ${test.error}`);
      }
    });

    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! Advanced question types are working correctly.');
    } else {
      console.log(`\n⚠️ ${testResults.failed} test(s) failed. Please check the errors above.`);
    }

  } catch (error) {
    console.error('💥 Test setup failed:', error);
  } finally {
    await promisePool.end();
  }
}

// Run the test
if (require.main === module) {
  testAdvancedQuestionTypes()
    .then(() => {
      console.log('\n🏁 Advanced question types testing completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testAdvancedQuestionTypes };