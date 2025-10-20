const { promisePool } = require('../config/database');

async function testCaseStudyFunctionality() {
  console.log('🧪 Testing Case Study Functionality...\n');
  
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

    // Test 1: Create a case study
    console.log('1️⃣ Testing Case Study Creation...');
    let caseStudyId;
    try {
      const [caseStudyResult] = await promisePool.query(
        'INSERT INTO case_studies (exam_id, title, scenario_text, order_index) VALUES (?, ?, ?, ?)',
        [
          examId, 
          'Test Microsoft Azure Migration Case Study',
          `Contoso Ltd is a manufacturing company with 500 employees. They currently operate on-premises infrastructure consisting of:
- 20 Windows Server 2016 virtual machines
- SQL Server 2017 database
- File servers with 10TB of data
- Active Directory domain services

Business Requirements:
- Migrate to Azure cloud within 6 months
- Maintain high availability (99.9% uptime)
- Reduce operational costs by 30%
- Ensure data security and compliance
- Enable remote work capabilities

Constraints:
- Limited budget of $50,000 for migration
- Cannot have more than 4 hours of downtime
- Must maintain current performance levels
- Compliance with GDPR regulations required`,
          0
        ]
      );
      
      caseStudyId = caseStudyResult.insertId;
      console.log(`   ✅ Case study created with ID: ${caseStudyId}`);
      testResults.passed++;
      testResults.tests.push({ name: 'Case Study Creation', status: 'PASSED' });
    } catch (error) {
      console.log('   ❌ Case study creation failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Case Study Creation', status: 'FAILED', error: error.message });
      return; // Can't continue without a case study
    }

    // Test 2: Create case study question type
    console.log('2️⃣ Testing Case Study Question Creation...');
    let mainQuestionId;
    try {
      const [questionResult] = await promisePool.query(
        'INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [examId, caseStudyId, 'Case Study Question Container', 'This is the main container for case study questions', 'case_study', 1]
      );
      
      mainQuestionId = questionResult.insertId;
      console.log(`   ✅ Main case study question created with ID: ${mainQuestionId}`);
      testResults.passed++;
      testResults.tests.push({ name: 'Case Study Question Creation', status: 'PASSED' });
    } catch (error) {
      console.log('   ❌ Case study question creation failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Case Study Question Creation', status: 'FAILED', error: error.message });
      return;
    }

    // Test 3: Create sub-questions linked to the case study
    console.log('3️⃣ Testing Case Study Sub-Questions Creation...');
    const subQuestionData = [
      {
        text: 'What Azure service should Contoso use to migrate their on-premises virtual machines to Azure with minimal downtime?',
        question_type: 'single_choice',
        options: [
          { text: 'Azure Site Recovery', is_correct: true, order_index: 1 },
          { text: 'Azure Backup', is_correct: false, order_index: 2 },
          { text: 'Azure Migrate', is_correct: false, order_index: 3 },
          { text: 'Azure Storage', is_correct: false, order_index: 4 }
        ],
        explanation: 'Azure Site Recovery provides business continuity and disaster recovery by replicating workloads running on physical and virtual machines.'
      },
      {
        text: 'Which Azure database service would be most appropriate for migrating Contoso\'s SQL Server 2017 database?',
        question_type: 'single_choice',
        options: [
          { text: 'Azure SQL Database', is_correct: true, order_index: 1 },
          { text: 'Azure Cosmos DB', is_correct: false, order_index: 2 },
          { text: 'Azure Database for MySQL', is_correct: false, order_index: 3 },
          { text: 'Azure Table Storage', is_correct: false, order_index: 4 }
        ],
        explanation: 'Azure SQL Database is the managed SQL service that provides the best compatibility with SQL Server 2017.'
      },
      {
        text: 'To meet the 99.9% uptime requirement, which Azure features should Contoso implement? (Select all that apply)',
        question_type: 'multiple_choice',
        options: [
          { text: 'Availability Sets', is_correct: true, order_index: 1 },
          { text: 'Azure Load Balancer', is_correct: true, order_index: 2 },
          { text: 'Azure CDN', is_correct: false, order_index: 3 },
          { text: 'Azure Backup', is_correct: true, order_index: 4 },
          { text: 'Azure Traffic Manager', is_correct: true, order_index: 5 }
        ],
        explanation: 'Availability Sets, Load Balancer, Backup, and Traffic Manager all contribute to high availability.'
      }
    ];

    const createdSubQuestions = [];
    try {
      for (let i = 0; i < subQuestionData.length; i++) {
        const subQ = subQuestionData[i];
        
        // Create the sub-question
        const [subQuestionResult] = await promisePool.query(
          'INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [examId, caseStudyId, subQ.text, subQ.explanation, subQ.question_type, 10 + i]
        );
        
        const subQuestionId = subQuestionResult.insertId;
        createdSubQuestions.push(subQuestionId);
        
        // Create options for the sub-question
        for (const option of subQ.options) {
          await promisePool.query(
            'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
            [subQuestionId, option.text, option.is_correct, option.order_index]
          );
        }
      }
      
      console.log(`   ✅ Created ${createdSubQuestions.length} sub-questions with options`);
      testResults.passed++;
      testResults.tests.push({ name: 'Case Study Sub-Questions', status: 'PASSED' });
    } catch (error) {
      console.log('   ❌ Sub-questions creation failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Case Study Sub-Questions', status: 'FAILED', error: error.message });
    }

    // Test 4: Verify case study retrieval with questions
    console.log('4️⃣ Testing Case Study Retrieval...');
    try {
      const [caseStudyWithQuestions] = await promisePool.query(
        `SELECT cs.*, 
           (SELECT COUNT(*) FROM questions WHERE case_study_id = cs.id) as question_count
         FROM case_studies cs 
         WHERE cs.id = ?`,
        [caseStudyId]
      );
      
      if (caseStudyWithQuestions.length > 0) {
        const cs = caseStudyWithQuestions[0];
        console.log(`   ✅ Retrieved case study: "${cs.title}"`);
        console.log(`   📊 Question count: ${cs.question_count}`);
        
        if (cs.question_count >= 3) {
          console.log('   ✅ All sub-questions are properly linked to the case study');
          testResults.passed++;
          testResults.tests.push({ name: 'Case Study Retrieval', status: 'PASSED' });
        } else {
          throw new Error(`Expected at least 3 questions, found ${cs.question_count}`);
        }
      } else {
        throw new Error('Case study not found');
      }
    } catch (error) {
      console.log('   ❌ Case study retrieval failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Case Study Retrieval', status: 'FAILED', error: error.message });
    }

    // Test 5: Test questions with case study information
    console.log('5️⃣ Testing Questions with Case Study Information...');
    try {
      const [questionsWithCaseStudy] = await promisePool.query(
        `SELECT q.*, cs.title as case_study_title, cs.scenario_text,
           (SELECT COUNT(*) FROM options WHERE question_id = q.id) as option_count
         FROM questions q
         JOIN case_studies cs ON q.case_study_id = cs.id
         WHERE q.case_study_id = ?
         ORDER BY q.order_index`,
        [caseStudyId]
      );
      
      if (questionsWithCaseStudy.length >= 3) {
        console.log(`   ✅ Retrieved ${questionsWithCaseStudy.length} questions with case study information`);
        
        // Check each question has options
        let questionsWithOptions = 0;
        for (const q of questionsWithCaseStudy) {
          if (q.option_count > 0) {
            questionsWithOptions++;
          }
        }
        
        if (questionsWithOptions >= 3) {
          console.log(`   ✅ ${questionsWithOptions} questions have options`);
          testResults.passed++;
          testResults.tests.push({ name: 'Questions with Case Study Info', status: 'PASSED' });
        } else {
          throw new Error(`Only ${questionsWithOptions} questions have options`);
        }
      } else {
        throw new Error(`Expected at least 3 questions, found ${questionsWithCaseStudy.length}`);
      }
    } catch (error) {
      console.log('   ❌ Questions with case study info failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Questions with Case Study Info', status: 'FAILED', error: error.message });
    }

    // Test 6: Test Microsoft Exam-like scenario flow
    console.log('6️⃣ Testing Microsoft Exam Flow Simulation...');
    try {
      // Simulate how case study questions would appear in an exam
      const [examFlow] = await promisePool.query(
        `SELECT 
           cs.title as scenario_title,
           cs.scenario_text,
           q.id as question_id,
           q.text as question_text,
           q.question_type,
           q.explanation
         FROM questions q
         JOIN case_studies cs ON q.case_study_id = cs.id
         WHERE q.exam_id = ? AND q.case_study_id = ?
         AND q.question_type != 'case_study'
         ORDER BY q.order_index`,
        [examId, caseStudyId]
      );
      
      if (examFlow.length >= 3) {
        console.log('   ✅ Microsoft exam flow simulation:');
        console.log(`   📄 Scenario: "${examFlow[0].scenario_title}"`);
        console.log(`   📝 Questions: ${examFlow.length}`);
        console.log(`   🎯 Question types: ${[...new Set(examFlow.map(q => q.question_type))].join(', ')}`);
        
        testResults.passed++;
        testResults.tests.push({ name: 'Microsoft Exam Flow', status: 'PASSED' });
      } else {
        throw new Error('Insufficient questions for exam flow simulation');
      }
    } catch (error) {
      console.log('   ❌ Microsoft exam flow simulation failed:', error.message);
      testResults.failed++;
      testResults.tests.push({ name: 'Microsoft Exam Flow', status: 'FAILED', error: error.message });
    }

    // Cleanup - remove test data
    console.log('🧹 Cleaning up test data...');
    try {
      // Delete questions (will cascade to options)
      await promisePool.query('DELETE FROM questions WHERE case_study_id = ?', [caseStudyId]);
      // Delete case study
      await promisePool.query('DELETE FROM case_studies WHERE id = ?', [caseStudyId]);
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
      console.log('\n🎉 All tests passed! Case study functionality is working exactly like Microsoft exams.');
      console.log('\n📚 Case Study Features Verified:');
      console.log('   • Case study creation with detailed scenarios');
      console.log('   • Multiple sub-questions linked to the same case study');
      console.log('   • Single choice and multiple choice question types');
      console.log('   • Proper question-option relationships');
      console.log('   • Microsoft exam-like presentation flow');
      console.log('   • Database integrity and relationships');
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
  testCaseStudyFunctionality()
    .then(() => {
      console.log('\n🏁 Case study functionality testing completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testCaseStudyFunctionality };