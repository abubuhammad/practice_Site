const { promisePool } = require('../config/database');

async function createSimpleTestExam() {
  const connection = await promisePool.getConnection();
  
  try {
    console.log('🧪 Creating Simple Test Exam for Question Types');
    console.log('===============================================\n');

    await connection.beginTransaction();

    // Create a test exam
    console.log('📝 Creating test exam...');
    const [examResult] = await connection.query(
      'INSERT INTO exams (code, title, description, path, time_limit_minutes, passing_score, total_questions) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['TEST-001', 'Question Types Test', 'Test exam with various question types', 'test', 30, 600, 5]
    );
    const examId = examResult.insertId;
    console.log(`✅ Created exam with ID: ${examId}`);

    // 1. Single Choice Question
    console.log('1️⃣ Creating single choice question...');
    const [q1Result] = await connection.query(
      'INSERT INTO questions (exam_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?)',
      [examId, 'What is the primary purpose of Azure Resource Manager?', 'ARM provides centralized management for Azure resources', 'single_choice', 1]
    );
    const q1Id = q1Result.insertId;

    await connection.query(
      'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)',
      [q1Id, 'Resource management', true, 1, q1Id, 'Virtual machine hosting', false, 2, q1Id, 'Database management', false, 3]
    );

    // 2. Multiple Choice Question
    console.log('2️⃣ Creating multiple choice question...');
    const [q2Result] = await connection.query(
      'INSERT INTO questions (exam_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?)',
      [examId, 'Which Azure services provide compute capabilities? (Select all that apply)', 'Multiple Azure services offer different types of compute resources', 'multiple_choice', 2]
    );
    const q2Id = q2Result.insertId;

    await connection.query(
      'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)',
      [q2Id, 'Azure Virtual Machines', true, 1, q2Id, 'Azure Functions', true, 2, q2Id, 'Azure Storage', false, 3, q2Id, 'Azure App Service', true, 4]
    );

    // 3. Drag Drop Ordering Question
    console.log('3️⃣ Creating drag drop ordering question...');
    const dragDropData = {
      instructions: "Match services to their categories",
      drag_items: [
        { id: 1, text: "Azure VM" },
        { id: 2, text: "Azure SQL" }
      ],
      drop_zones: [
        { id: 1, label: "IaaS" },
        { id: 2, label: "PaaS" }
      ]
    };
    
    const [q3Result] = await connection.query(
      'INSERT INTO questions (exam_id, text, explanation, question_type, drag_drop_ordering_data, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [examId, 'Match Azure services to their service categories', 'Understanding service models is key to Azure architecture', 'drag_drop_ordering', JSON.stringify(dragDropData), 3]
    );
    const q3Id = q3Result.insertId;

    // 4. Hotspot Question  
    console.log('4️⃣ Creating hotspot question...');
    const hotspotData = {
      instructions: "Click on the correct areas",
      image_url: "/images/sample-diagram.png",
      image_width: 800,
      image_height: 600
    };
    
    const [q4Result] = await connection.query(
      'INSERT INTO questions (exam_id, text, explanation, question_type, hotspot_data, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [examId, 'Click on the Load Balancer in the diagram', 'Load balancers distribute traffic across multiple instances', 'hotspot', JSON.stringify(hotspotData), 4]
    );
    const q4Id = q4Result.insertId;

    // Add hotspot areas
    await connection.query(
      'INSERT INTO hotspot_areas (question_id, label, coordinates) VALUES (?, ?, ?), (?, ?, ?)',
      [q4Id, 'Load Balancer', JSON.stringify({ x: 200, y: 150, width: 100, height: 50 }),
       q4Id, 'Virtual Network', JSON.stringify({ x: 350, y: 200, width: 120, height: 60 })]
    );

    // 5. Build List Question
    console.log('5️⃣ Creating build list question...');
    const buildListData = {
      instructions: "Select the correct deployment steps in order",
      max_items: 3,
      available_items: [
        { id: 1, text: "Create Resource Group", category: "Setup" },
        { id: 2, text: "Deploy Template", category: "Deployment" },
        { id: 3, text: "Configure Settings", category: "Config" },
        { id: 4, text: "Test Application", category: "Validation" }
      ]
    };
    
    const [q5Result] = await connection.query(
      'INSERT INTO questions (exam_id, text, explanation, question_type, build_list_data, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [examId, 'Build the correct deployment process', 'Proper deployment order ensures success', 'build_list', JSON.stringify(buildListData), 5]
    );
    const q5Id = q5Result.insertId;

    // Update exam total questions
    await connection.query(
      'UPDATE exams SET total_questions = 5 WHERE id = ?',
      [examId]
    );

    await connection.commit();
    
    console.log('\n✅ Simple test exam created successfully!');
    console.log('📊 Summary:');
    console.log(`   📝 Exam ID: ${examId}`);
    console.log('   ❓ Questions: 5');
    console.log('   🎯 Types: Single Choice, Multiple Choice, Drag-Drop, Hotspot, Build List');
    console.log(`\n🔗 Test URL: http://localhost:3000/exams/${examId}`);
    console.log('\n🎮 Next: Start the servers and test the exam interface!');

    return { examId, questionCount: 5 };

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating test exam:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run if called directly
if (require.main === module) {
  createSimpleTestExam()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = createSimpleTestExam;