const { promisePool } = require('../config/database');

async function testExamInterface() {
  const connection = await promisePool.getConnection();
  
  try {
    console.log('🧪 Testing Exam Interface with All Question Types');
    console.log('================================================\n');

    await connection.beginTransaction();

    // Create a comprehensive test exam
    console.log('📝 Creating comprehensive test exam...');
    const [examResult] = await connection.query(`
      INSERT INTO exams (code, title, description, path, time_limit_minutes, passing_score, total_questions)
      VALUES ('COMP-001', 'Comprehensive Question Types Test', 'Test exam with all question types', 'test', 60, 700, 10)
    `);
    const examId = examResult.insertId;
    console.log(`✅ Created exam with ID: ${examId}`);

    // Create a test case study
    console.log('📋 Creating test case study...');
    const [caseStudyResult] = await connection.query(`
      INSERT INTO case_studies (exam_id, title, scenario_text, order_index)
      VALUES (?, 'Azure Migration Scenario', 
              'Contoso Ltd is planning to migrate their on-premises infrastructure to Azure. The company has 100 VMs running various workloads including web servers, database servers, and domain controllers. They need to ensure minimal downtime during migration and optimal cost management.',
              1)
    `, [examId]);
    const caseStudyId = caseStudyResult.insertId;
    console.log(`✅ Created case study with ID: ${caseStudyId}`);

    const questions = [];
    let orderIndex = 1;

    // 1. Traditional Single Choice Question
    console.log('1️⃣ Creating single choice question...');
    const [q1Result] = await connection.query(`
      INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
      VALUES (?, ?, ?, ?, ?)
    `, [examId, 
        'Which Azure service provides Platform-as-a-Service (PaaS) for web applications?',
        'Azure App Service is a PaaS offering for hosting web applications, REST APIs, and mobile backends.',
        'single_choice', 
        orderIndex++]);
    const q1Id = q1Result.insertId;
    questions.push({ id: q1Id, type: 'single_choice' });

    // Add options for single choice
    await connection.query(`
      INSERT INTO options (question_id, text, is_correct, order_index) VALUES
      (?, 'Azure Virtual Machines', FALSE, 1),
      (?, 'Azure App Service', TRUE, 2),
      (?, 'Azure Storage', FALSE, 3),
      (?, 'Azure Functions', FALSE, 4)
    `, [q1Id, q1Id, q1Id, q1Id]);

    // 2. Multiple Choice Question
    console.log('2️⃣ Creating multiple choice question...');
    const [q2Result] = await connection.query(`
      INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
      VALUES (?, ?, ?, ?, ?)
    `, [examId,
        'Which of the following are benefits of using Azure Resource Manager? (Select all that apply)',
        'ARM provides declarative templates, role-based access control, and resource grouping capabilities.',
        'multiple_choice',
        orderIndex++]);
    const q2Id = q2Result.insertId;
    questions.push({ id: q2Id, type: 'multiple_choice' });

    await connection.query(`
      INSERT INTO options (question_id, text, is_correct, order_index) VALUES
      (?, 'Declarative templates', TRUE, 1),
      (?, 'Role-based access control', TRUE, 2),
      (?, 'Automatic scaling', FALSE, 3),
      (?, 'Resource grouping', TRUE, 4)
    `, [q2Id, q2Id, q2Id, q2Id]);

    // 3. Yes/No Question
    console.log('3️⃣ Creating yes/no question...');
    const [q3Result] = await connection.query(`
      INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
      VALUES (?, ?, ?, ?, ?)
    `, [examId,
        'Can Azure Virtual Network peering be configured between different Azure regions?',
        'Yes, global virtual network peering allows you to connect VNets across different Azure regions.',
        'yes_no',
        orderIndex++]);
    const q3Id = q3Result.insertId;
    questions.push({ id: q3Id, type: 'yes_no' });

    await connection.query(`
      INSERT INTO options (question_id, text, is_correct, order_index) VALUES
      (?, 'Yes', TRUE, 1),
      (?, 'No', FALSE, 2)
    `, [q3Id, q3Id]);

    // 4. Drag Drop Ordering Question
    console.log('4️⃣ Creating drag drop ordering question...');
    const [q4Result] = await connection.query(`
      INSERT INTO questions (exam_id, text, explanation, question_type, drag_drop_ordering_data, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [examId,
        'Match the Azure services with their appropriate use cases by dragging them to the correct zones.',
        'Different Azure services are optimized for different scenarios and workload types.',
        'drag_drop_ordering',
        JSON.stringify({
          instructions: "Drag the Azure services from the left to match their primary use cases on the right.",
          drag_items: [
            { id: 1, text: "Azure SQL Database" },
            { id: 2, text: "Azure Blob Storage" },
            { id: 3, text: "Azure Functions" },
            { id: 4, text: "Azure Kubernetes Service" }
          ],
          drop_zones: [
            { id: 1, label: "Relational Database" },
            { id: 2, label: "Unstructured Data Storage" },
            { id: 3, label: "Serverless Computing" },
            { id: 4, label: "Container Orchestration" }
          ]
        }),
        orderIndex++]);
    const q4Id = q4Result.insertId;
    questions.push({ id: q4Id, type: 'drag_drop_ordering' });

    // 5. Build List Question
    console.log('5️⃣ Creating build list question...');
    const [q5Result] = await connection.query(`
      INSERT INTO questions (exam_id, text, explanation, question_type, build_list_data, order_index)
      VALUES (?, 
              'Build a list of steps for setting up Azure AD Connect in the correct order.',
              'Azure AD Connect synchronization requires specific setup steps to be followed in order.',
              'build_list', ?, ?)
    `, [examId, JSON.stringify({
      instructions: "Select and order the steps required to set up Azure AD Connect. Maximum 4 steps.",
      max_items: 4,
      available_items: [
        { id: 1, text: "Install Azure AD Connect software", category: "Installation" },
        { id: 2, text: "Configure directory synchronization", category: "Configuration" },
        { id: 3, text: "Verify domain ownership", category: "Prerequisites" },
        { id: 4, text: "Create Azure AD tenant", category: "Prerequisites" },
        { id: 5, text: "Test user synchronization", category: "Validation" },
        { id: 6, text: "Configure password writeback", category: "Optional" }
      ]
    }), orderIndex++]);
    const q5Id = q5Result.insertId;
    questions.push({ id: q5Id, type: 'build_list' });

    // 6. Matching Question
    console.log('6️⃣ Creating matching question...');
    const [q6Result] = await connection.query(`
      INSERT INTO questions (exam_id, text, explanation, question_type, matching_data, order_index)
      VALUES (?, 
              'Match each Azure service with its primary category.',
              'Understanding service categories helps with proper architecture and cost optimization.',
              'matching', ?, ?)
    `, [examId, JSON.stringify({
      instructions: "Match each Azure service to its corresponding service category.",
      allow_multiple_matches: false,
      left_column: [
        { id: 1, text: "Azure Virtual Machines" },
        { id: 2, text: "Azure SQL Database" },
        { id: 3, text: "Azure Cognitive Services" },
        { id: 4, text: "Azure DevOps" }
      ],
      right_column: [
        { id: 1, text: "Infrastructure as a Service (IaaS)" },
        { id: 2, text: "Platform as a Service (PaaS)" },
        { id: 3, text: "Software as a Service (SaaS)" },
        { id: 4, text: "Artificial Intelligence" }
      ]
    }), orderIndex++]);
    const q6Id = q6Result.insertId;
    questions.push({ id: q6Id, type: 'matching' });

    // 7. Fill in the Blank Question
    console.log('7️⃣ Creating fill in the blank question...');
    const [q7Result] = await connection.query(`
      INSERT INTO questions (exam_id, text, explanation, question_type, fill_in_blank_data, order_index)
      VALUES (?, 
              'Complete the Azure PowerShell command to create a new resource group.',
              'The New-AzResourceGroup cmdlet is used to create Azure resource groups.',
              'fill_in_blank', ?, ?)
    `, [examId, JSON.stringify({
      question_template: "New-Az[BLANK_1] -Name 'MyResourceGroup' -Location '[BLANK_2]'",
      blanks: [
        { blank_number: 1, expected_answers: ["ResourceGroup"], case_sensitive: false },
        { blank_number: 2, expected_answers: ["East US", "eastus", "West Europe", "westeurope"], case_sensitive: false }
      ]
    }), orderIndex++]);
    const q7Id = q7Result.insertId;
    questions.push({ id: q7Id, type: 'fill_in_blank' });

    // 8. Hotspot Question
    console.log('8️⃣ Creating hotspot question...');
    const [q8Result] = await connection.query(`
      INSERT INTO questions (exam_id, text, explanation, question_type, hotspot_data, order_index)
      VALUES (?, 
              'Click on the areas in the Azure portal screenshot where you would configure virtual network peering.',
              'Virtual network peering is configured in the Virtual Networks section of the Azure portal.',
              'hotspot', ?, ?)
    `, [examId, JSON.stringify({
      instructions: "Click on the correct areas to identify where virtual network peering is configured.",
      image_url: "/images/azure-portal-screenshot.png",
      image_width: 1024,
      image_height: 768
    }), orderIndex++]);
    const q8Id = q8Result.insertId;
    questions.push({ id: q8Id, type: 'hotspot' });

    // Create hotspot areas
    await connection.query(`
      INSERT INTO hotspot_areas (question_id, label, coordinates) VALUES
      (?, 'Virtual Networks menu', ?),
      (?, 'Peerings configuration', ?)
    `, [
      q8Id, JSON.stringify({ x: 100, y: 200, width: 150, height: 30 }),
      q8Id, JSON.stringify({ x: 300, y: 400, width: 200, height: 40 })
    ]);

    // 9. Sequence Ordering Question  
    console.log('9️⃣ Creating sequence ordering question...');
    const [q9Result] = await connection.query(`
      INSERT INTO questions (exam_id, text, explanation, question_type, sequence_ordering_data, order_index)
      VALUES (?, 
              'Arrange the Azure deployment process steps in the correct order.',
              'Proper deployment order ensures successful resource provisioning and configuration.',
              'sequence_ordering', ?, ?)
    `, [examId, JSON.stringify({
      instructions: "Put these deployment steps in the correct chronological order.",
      sequence_items: [
        { id: 1, text: "Create resource group" },
        { id: 2, text: "Deploy ARM template" },
        { id: 3, text: "Configure application settings" },
        { id: 4, text: "Run post-deployment scripts" },
        { id: 5, text: "Validate deployment" }
      ]
    }), orderIndex++]);
    const q9Id = q9Result.insertId;
    questions.push({ id: q9Id, type: 'sequence_ordering' });

    // 10. Case Study Question with sub-questions
    console.log('🔟 Creating case study question...');
    const [q10Result] = await connection.query(`
      INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index)
      VALUES (?, ?, 
              'Based on the Azure migration scenario, answer the following questions.',
              'Case studies test real-world application of Azure knowledge.',
              'case_study', ?)
    `, [examId, caseStudyId, orderIndex++]);
    const q10Id = q10Result.insertId;
    questions.push({ id: q10Id, type: 'case_study' });

    // Create sub-questions for case study
    const [sub1Result] = await connection.query(`
      INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index)
      VALUES (?, ?, 
              'Which Azure service would you recommend for migrating the existing VMs with minimal changes?',
              'Azure Migrate provides tools for lift-and-shift migration of existing VMs.',
              'single_choice', ?)
    `, [examId, caseStudyId, orderIndex++]);
    const sub1Id = sub1Result.insertId;

    await connection.query(`
      INSERT INTO options (question_id, text, is_correct, order_index) VALUES
      (?, 'Azure App Service', FALSE, 1),
      (?, 'Azure Virtual Machines', TRUE, 2),
      (?, 'Azure Container Instances', FALSE, 3),
      (?, 'Azure Functions', FALSE, 4)
    `, [sub1Id, sub1Id, sub1Id, sub1Id]);

    const [sub2Result] = await connection.query(`
      INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index)
      VALUES (?, ?, 
              'What factors should Contoso consider for cost optimization? (Select all that apply)',
              'Multiple factors affect Azure costs and should be considered during migration planning.',
              'multiple_choice', ?)
    `, [examId, caseStudyId, orderIndex++]);
    const sub2Id = sub2Result.insertId;

    await connection.query(`
      INSERT INTO options (question_id, text, is_correct, order_index) VALUES
      (?, 'Right-sizing VMs', TRUE, 1),
      (?, 'Using Reserved Instances', TRUE, 2),
      (?, 'Implementing auto-shutdown', TRUE, 3),
      (?, 'Using only Premium storage', FALSE, 4)
    `, [sub2Id, sub2Id, sub2Id, sub2Id]);

    // Update exam total questions count
    await connection.query(`
      UPDATE exams SET total_questions = ? WHERE id = ?
    `, [questions.length, examId]);

    console.log('\n✅ Test exam creation completed!');
    console.log('📊 Test Results Summary:');
    console.log(`   📝 Exam ID: ${examId}`);
    console.log(`   📋 Case Study ID: ${caseStudyId}`);
    console.log(`   ❓ Questions created: ${questions.length}`);
    console.log('   🎯 Question types tested:');
    console.log('     - Single Choice');
    console.log('     - Multiple Choice');
    console.log('     - Yes/No');
    console.log('     - Drag Drop Ordering');
    console.log('     - Build List');
    console.log('     - Matching');
    console.log('     - Fill in the Blank');
    console.log('     - Hotspot');
    console.log('     - Sequence Ordering');
    console.log('     - Case Study (with sub-questions)');

    console.log('\n🎮 Next Steps:');
    console.log('1. Start the frontend and backend servers');
    console.log('2. Navigate to the exam catalog and find "Comprehensive Question Types Test"');
    console.log('3. Start the exam and test each question type');
    console.log('4. Verify that answers are saved correctly');
    console.log('5. Complete the exam and check the results');

    console.log(`\n🔗 Direct exam URL: http://localhost:3000/exams/${examId}`);

    await connection.commit();
    console.log('\n✅ All test data committed to database successfully!');

    return {
      examId,
      caseStudyId,
      questionCount: questions.length
    };

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
  testExamInterface()
    .then((result) => {
      console.log('\n🎉 Test exam interface setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = testExamInterface;