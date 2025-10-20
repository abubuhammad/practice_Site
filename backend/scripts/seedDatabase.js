const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'exam_practice_db'
    });

    console.log('✅ Connected to database');
    console.log('🔄 Seeding data...\n');

    // 1. Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    await connection.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = ?',
      ['admin@example.com', adminPassword, 'admin', 'admin']
    );
    console.log('   ✅ Admin user created (admin@example.com / Admin123!)');

    // 2. Create test user
    console.log('👤 Creating test user...');
    const userPassword = await bcrypt.hash('User123!', 10);
    await connection.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = ?',
      ['user@example.com', userPassword, 'user', 'user']
    );
    console.log('   ✅ Test user created (user@example.com / User123!)');

    // 3. Create exams
    console.log('\n📚 Creating exams...');
    
    const exams = [
      {
        code: 'AZ-900',
        title: 'Microsoft Azure Fundamentals',
        description: 'This exam measures your ability to understand cloud concepts, core Azure services, security, privacy, compliance, and trust, as well as Azure pricing and support.',
        path: 'AZ',
        time_limit_minutes: 60,
        passing_score: 700,
        total_questions: 10
      },
      {
        code: 'AZ-104',
        title: 'Microsoft Azure Administrator',
        description: 'This exam measures your ability to accomplish technical tasks like manage Azure identities and governance, implement and manage storage, deploy and manage Azure compute resources, configure and manage virtual networking, and monitor and back up Azure resources.',
        path: 'AZ',
        time_limit_minutes: 120,
        passing_score: 700,
        total_questions: 8
      },
      {
        code: 'DP-900',
        title: 'Microsoft Azure Data Fundamentals',
        description: 'This exam is an opportunity to demonstrate knowledge of core data concepts and how they are implemented using Microsoft Azure data services.',
        path: 'DP',
        time_limit_minutes: 60,
        passing_score: 700,
        total_questions: 5
      }
    ];

    for (const exam of exams) {
      await connection.query(
        `INSERT INTO exams (code, title, description, path, time_limit_minutes, passing_score, total_questions) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         title = VALUES(title), 
         description = VALUES(description),
         time_limit_minutes = VALUES(time_limit_minutes),
         passing_score = VALUES(passing_score),
         total_questions = VALUES(total_questions)`,
        [exam.code, exam.title, exam.description, exam.path, exam.time_limit_minutes, exam.passing_score, exam.total_questions]
      );
      console.log(`   ✅ ${exam.code}: ${exam.title}`);
    }

    // 4. Create case study for AZ-104
    console.log('\n📖 Creating case studies...');
    const [caseStudyResult] = await connection.query(
      `INSERT INTO case_studies (exam_id, title, scenario_text, order_index) 
       VALUES ((SELECT id FROM exams WHERE code = 'AZ-104'), ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), scenario_text = VALUES(scenario_text)`,
      [
        'Contoso Ltd. Network Infrastructure',
        'Contoso Ltd. is a manufacturing company with offices in multiple locations. They are migrating their on-premises infrastructure to Azure. The company has the following requirements:\n\n- Deploy virtual machines in multiple regions\n- Implement network security groups\n- Configure virtual network peering between regions\n- Set up Azure Load Balancer for high availability\n- Implement Azure Backup for disaster recovery\n\nYou are the Azure Administrator responsible for implementing these requirements.',
        1
      ]
    );
    console.log('   ✅ Case study created for AZ-104');

    // 5. Create questions for AZ-900
    console.log('\n❓ Creating questions for AZ-900...');
    
    const az900Questions = [
      {
        text: 'What is cloud computing?',
        type: 'single_choice',
        explanation: 'Cloud computing is the delivery of computing services over the internet, including servers, storage, databases, networking, software, analytics, and intelligence.',
        options: [
          { text: 'Delivery of computing services over the internet', is_correct: true },
          { text: 'A type of weather phenomenon', is_correct: false },
          { text: 'A local server infrastructure', is_correct: false },
          { text: 'A programming language', is_correct: false }
        ]
      },
      {
        text: 'Which of the following are benefits of cloud computing? (Select all that apply)',
        type: 'multiple_choice',
        explanation: 'Cloud computing offers scalability, cost-effectiveness, and high availability. It does not require large upfront capital expenditure.',
        options: [
          { text: 'Scalability', is_correct: true },
          { text: 'High upfront costs', is_correct: false },
          { text: 'Cost-effectiveness', is_correct: true },
          { text: 'High availability', is_correct: true }
        ]
      },
      {
        text: 'What is Azure?',
        type: 'single_choice',
        explanation: 'Azure is Microsoft\'s cloud computing platform that provides a wide range of cloud services.',
        options: [
          { text: 'Microsoft\'s cloud computing platform', is_correct: true },
          { text: 'A database management system', is_correct: false },
          { text: 'An operating system', is_correct: false },
          { text: 'A web browser', is_correct: false }
        ]
      },
      {
        text: 'Which Azure service is used for storing unstructured data?',
        type: 'single_choice',
        explanation: 'Azure Blob Storage is designed for storing massive amounts of unstructured data, such as text or binary data.',
        options: [
          { text: 'Azure Blob Storage', is_correct: true },
          { text: 'Azure SQL Database', is_correct: false },
          { text: 'Azure Virtual Machines', is_correct: false },
          { text: 'Azure Functions', is_correct: false }
        ]
      },
      {
        text: 'What is the Azure Service Level Agreement (SLA)?',
        type: 'single_choice',
        explanation: 'An SLA is a formal agreement between Microsoft and customers that defines the performance standards Microsoft commits to for Azure services.',
        options: [
          { text: 'A formal agreement defining performance standards', is_correct: true },
          { text: 'A pricing model for Azure services', is_correct: false },
          { text: 'A security protocol', is_correct: false },
          { text: 'A deployment template', is_correct: false }
        ]
      },
      {
        text: 'Which of the following are cloud deployment models? (Select all that apply)',
        type: 'multiple_choice',
        explanation: 'The three main cloud deployment models are public cloud, private cloud, and hybrid cloud.',
        options: [
          { text: 'Public cloud', is_correct: true },
          { text: 'Private cloud', is_correct: true },
          { text: 'Hybrid cloud', is_correct: true },
          { text: 'Distributed cloud', is_correct: false }
        ]
      },
      {
        text: 'What is Azure Resource Manager (ARM)?',
        type: 'single_choice',
        explanation: 'Azure Resource Manager is the deployment and management service for Azure. It provides a management layer that enables you to create, update, and delete resources.',
        options: [
          { text: 'The deployment and management service for Azure', is_correct: true },
          { text: 'A monitoring tool', is_correct: false },
          { text: 'A backup service', is_correct: false },
          { text: 'A networking component', is_correct: false }
        ]
      },
      {
        text: 'Which Azure service provides serverless compute?',
        type: 'single_choice',
        explanation: 'Azure Functions is a serverless compute service that lets you run event-triggered code without having to explicitly provision or manage infrastructure.',
        options: [
          { text: 'Azure Functions', is_correct: true },
          { text: 'Azure Virtual Machines', is_correct: false },
          { text: 'Azure Storage', is_correct: false },
          { text: 'Azure SQL Database', is_correct: false }
        ]
      },
      {
        text: 'What is the purpose of Azure Active Directory?',
        type: 'single_choice',
        explanation: 'Azure Active Directory (Azure AD) is Microsoft\'s cloud-based identity and access management service.',
        options: [
          { text: 'Identity and access management', is_correct: true },
          { text: 'File storage', is_correct: false },
          { text: 'Virtual networking', is_correct: false },
          { text: 'Database management', is_correct: false }
        ]
      },
      {
        text: 'Which factors affect Azure costs? (Select all that apply)',
        type: 'multiple_choice',
        explanation: 'Azure costs are affected by resource type, usage (consumption), region, and bandwidth. The time of day does not affect pricing.',
        options: [
          { text: 'Resource type', is_correct: true },
          { text: 'Usage/consumption', is_correct: true },
          { text: 'Region', is_correct: true },
          { text: 'Time of day', is_correct: false }
        ]
      }
    ];

    const [examResult] = await connection.query('SELECT id FROM exams WHERE code = ?', ['AZ-900']);
    const examId = examResult[0].id;

    for (let i = 0; i < az900Questions.length; i++) {
      const q = az900Questions[i];
      
      const [questionResult] = await connection.query(
        'INSERT INTO questions (exam_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?)',
        [examId, q.text, q.explanation, q.type, i + 1]
      );
      
      const questionId = questionResult.insertId;
      
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await connection.query(
          'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
          [questionId, opt.text, opt.is_correct, j + 1]
        );
      }
    }
    console.log(`   ✅ Created ${az900Questions.length} questions for AZ-900`);

    // 6. Create questions for AZ-104
    console.log('\n❓ Creating questions for AZ-104...');
    
    const az104Questions = [
      {
        text: 'You need to create a virtual network in Azure. Which PowerShell cmdlet should you use?',
        type: 'single_choice',
        explanation: 'New-AzVirtualNetwork is the correct cmdlet to create a new virtual network in Azure.',
        options: [
          { text: 'New-AzVirtualNetwork', is_correct: true },
          { text: 'Create-AzVirtualNetwork', is_correct: false },
          { text: 'Add-AzVirtualNetwork', is_correct: false },
          { text: 'Set-AzVirtualNetwork', is_correct: false }
        ]
      },
      {
        text: 'Which Azure service should you use to store virtual machine backups?',
        type: 'single_choice',
        explanation: 'Azure Recovery Services vault is used to store backups for Azure VMs and other resources.',
        options: [
          { text: 'Azure Recovery Services vault', is_correct: true },
          { text: 'Azure Blob Storage', is_correct: false },
          { text: 'Azure File Storage', is_correct: false },
          { text: 'Azure Table Storage', is_correct: false }
        ]
      },
      {
        text: 'What are valid methods to connect to an Azure virtual machine? (Select all that apply)',
        type: 'multiple_choice',
        explanation: 'You can connect to Azure VMs using RDP (Windows), SSH (Linux), and Azure Bastion. FTP is not a standard connection method for VMs.',
        options: [
          { text: 'Remote Desktop Protocol (RDP)', is_correct: true },
          { text: 'Secure Shell (SSH)', is_correct: true },
          { text: 'Azure Bastion', is_correct: true },
          { text: 'FTP', is_correct: false }
        ]
      },
      {
        text: 'You need to ensure that traffic between two virtual networks is routed through Azure. What should you configure?',
        type: 'single_choice',
        explanation: 'Virtual network peering enables you to seamlessly connect Azure virtual networks, allowing traffic to route through the Azure backbone.',
        options: [
          { text: 'Virtual network peering', is_correct: true },
          { text: 'Network security group', is_correct: false },
          { text: 'Azure Firewall', is_correct: false },
          { text: 'VPN Gateway', is_correct: false }
        ]
      },
      {
        text: 'Which Azure AD role allows a user to manage all aspects of Azure AD and Microsoft services that use Azure AD identities?',
        type: 'single_choice',
        explanation: 'The Global Administrator role has access to all administrative features in Azure AD.',
        options: [
          { text: 'Global Administrator', is_correct: true },
          { text: 'User Administrator', is_correct: false },
          { text: 'Security Administrator', is_correct: false },
          { text: 'Billing Administrator', is_correct: false }
        ]
      }
    ];

    // Add case study questions for AZ-104
    const az104CaseStudyQuestions = [
      {
        text: 'Based on the scenario, which Azure service should you use to distribute traffic across multiple VMs in different regions?',
        type: 'single_choice',
        explanation: 'Azure Traffic Manager is a DNS-based traffic load balancer that distributes traffic across multiple regions.',
        case_study: true,
        options: [
          { text: 'Azure Traffic Manager', is_correct: true },
          { text: 'Azure Load Balancer', is_correct: false },
          { text: 'Azure Application Gateway', is_correct: false },
          { text: 'Azure Front Door', is_correct: false }
        ]
      },
      {
        text: 'For the Contoso network infrastructure, which features should you implement for network security? (Select all that apply)',
        type: 'multiple_choice',
        explanation: 'Network Security Groups, Azure Firewall, and DDoS Protection are all important security features. Azure Monitor is for monitoring, not security.',
        case_study: true,
        options: [
          { text: 'Network Security Groups (NSGs)', is_correct: true },
          { text: 'Azure Firewall', is_correct: true },
          { text: 'Azure DDoS Protection', is_correct: true },
          { text: 'Azure Monitor', is_correct: false }
        ]
      },
      {
        text: 'What is the recommended backup frequency for Contoso\'s critical VMs to meet a 4-hour RPO (Recovery Point Objective)?',
        type: 'single_choice',
        explanation: 'To meet a 4-hour RPO, backups should be taken at least every 4 hours.',
        case_study: true,
        options: [
          { text: 'Every 4 hours', is_correct: true },
          { text: 'Once daily', is_correct: false },
          { text: 'Once weekly', is_correct: false },
          { text: 'Every hour', is_correct: false }
        ]
      }
    ];

    const [az104ExamResult] = await connection.query('SELECT id FROM exams WHERE code = ?', ['AZ-104']);
    const az104ExamId = az104ExamResult[0].id;

    const [caseStudyData] = await connection.query(
      'SELECT id FROM case_studies WHERE exam_id = ? ORDER BY id DESC LIMIT 1',
      [az104ExamId]
    );
    const caseStudyId = caseStudyData[0].id;

    let orderIndex = 1;

    // Add regular questions
    for (const q of az104Questions) {
      const [questionResult] = await connection.query(
        'INSERT INTO questions (exam_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?)',
        [az104ExamId, q.text, q.explanation, q.type, orderIndex++]
      );
      
      const questionId = questionResult.insertId;
      
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await connection.query(
          'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
          [questionId, opt.text, opt.is_correct, j + 1]
        );
      }
    }

    // Add case study questions
    for (const q of az104CaseStudyQuestions) {
      const [questionResult] = await connection.query(
        'INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [az104ExamId, caseStudyId, q.text, q.explanation, q.type, orderIndex++]
      );
      
      const questionId = questionResult.insertId;
      
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await connection.query(
          'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
          [questionId, opt.text, opt.is_correct, j + 1]
        );
      }
    }
    console.log(`   ✅ Created ${az104Questions.length + az104CaseStudyQuestions.length} questions for AZ-104`);

    // 7. Create questions for DP-900
    console.log('\n❓ Creating questions for DP-900...');
    
    const dp900Questions = [
      {
        text: 'What is the primary purpose of Azure Cosmos DB?',
        type: 'single_choice',
        explanation: 'Azure Cosmos DB is a globally distributed, multi-model database service designed for high availability and low latency.',
        options: [
          { text: 'Globally distributed, multi-model database', is_correct: true },
          { text: 'Relational database only', is_correct: false },
          { text: 'File storage service', is_correct: false },
          { text: 'Data warehouse', is_correct: false }
        ]
      },
      {
        text: 'Which Azure service is best suited for big data analytics?',
        type: 'single_choice',
        explanation: 'Azure Synapse Analytics (formerly SQL Data Warehouse) is designed for big data analytics and data warehousing.',
        options: [
          { text: 'Azure Synapse Analytics', is_correct: true },
          { text: 'Azure SQL Database', is_correct: false },
          { text: 'Azure Blob Storage', is_correct: false },
          { text: 'Azure Functions', is_correct: false }
        ]
      },
      {
        text: 'What are characteristics of relational databases? (Select all that apply)',
        type: 'multiple_choice',
        explanation: 'Relational databases use structured data with schemas, support ACID transactions, and use SQL. They are not schema-less.',
        options: [
          { text: 'Structured data with schema', is_correct: true },
          { text: 'ACID transactions', is_correct: true },
          { text: 'SQL query language', is_correct: true },
          { text: 'Schema-less', is_correct: false }
        ]
      },
      {
        text: 'Which Azure service provides a fully managed NoSQL database?',
        type: 'single_choice',
        explanation: 'Azure Cosmos DB is a fully managed NoSQL database service.',
        options: [
          { text: 'Azure Cosmos DB', is_correct: true },
          { text: 'Azure SQL Database', is_correct: false },
          { text: 'Azure Database for MySQL', is_correct: false },
          { text: 'Azure Database for PostgreSQL', is_correct: false }
        ]
      },
      {
        text: 'What is ETL in data processing?',
        type: 'single_choice',
        explanation: 'ETL stands for Extract, Transform, Load - a process of extracting data from sources, transforming it, and loading it into a destination.',
        options: [
          { text: 'Extract, Transform, Load', is_correct: true },
          { text: 'Encrypt, Transfer, Log', is_correct: false },
          { text: 'Execute, Test, Launch', is_correct: false },
          { text: 'Export, Translate, Link', is_correct: false }
        ]
      }
    ];

    const [dp900ExamResult] = await connection.query('SELECT id FROM exams WHERE code = ?', ['DP-900']);
    const dp900ExamId = dp900ExamResult[0].id;

    for (let i = 0; i < dp900Questions.length; i++) {
      const q = dp900Questions[i];
      
      const [questionResult] = await connection.query(
        'INSERT INTO questions (exam_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?)',
        [dp900ExamId, q.text, q.explanation, q.type, i + 1]
      );
      
      const questionId = questionResult.insertId;
      
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await connection.query(
          'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
          [questionId, opt.text, opt.is_correct, j + 1]
        );
      }
    }
    console.log(`   ✅ Created ${dp900Questions.length} questions for DP-900`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 2 users (1 admin, 1 regular user)');
    console.log('   - 3 exams (AZ-900, AZ-104, DP-900)');
    console.log('   - 1 case study (AZ-104)');
    console.log('   - 23 total questions');
    console.log('\n🔐 Login credentials:');
    console.log('   Admin: admin@example.com / Admin123!');
    console.log('   User:  user@example.com / User123!');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;