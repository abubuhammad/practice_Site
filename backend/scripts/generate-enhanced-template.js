const ExcelJS = require('exceljs');
const path = require('path');

async function generateEnhancedTemplate() {
  console.log('📝 Generating Enhanced Question Template...');
  
  const workbook = new ExcelJS.Workbook();
  
  // Create main worksheet
  const worksheet = workbook.addWorksheet('Questions');
  
  // Define columns for all question types
  const columns = [
    // Basic question fields
    { header: 'question_text', key: 'question_text', width: 50 },
    { header: 'question_type', key: 'question_type', width: 20 },
    { header: 'explanation', key: 'explanation', width: 40 },
    { header: 'order_index', key: 'order_index', width: 12 },
    
    // Case study fields
    { header: 'case_study_title', key: 'case_study_title', width: 30 },
    { header: 'case_study_scenario', key: 'case_study_scenario', width: 50 },
    
    // Traditional question options
    { header: 'option1', key: 'option1', width: 30 },
    { header: 'option2', key: 'option2', width: 30 },
    { header: 'option3', key: 'option3', width: 30 },
    { header: 'option4', key: 'option4', width: 30 },
    { header: 'option5', key: 'option5', width: 30 },
    { header: 'option6', key: 'option6', width: 30 },
    { header: 'correct_answer_index', key: 'correct_answer_index', width: 20 },
    
    // Hotspot fields
    { header: 'hotspot_image_url', key: 'hotspot_image_url', width: 40 },
    { header: 'image_width', key: 'image_width', width: 15 },
    { header: 'image_height', key: 'image_height', width: 15 },
    { header: 'hotspot_instructions', key: 'hotspot_instructions', width: 40 },
    { header: 'hotspot_areas', key: 'hotspot_areas', width: 60 },
    
    // Complex question data fields (JSON)
    { header: 'drag_drop_ordering_data', key: 'drag_drop_ordering_data', width: 80 },
    { header: 'build_list_data', key: 'build_list_data', width: 80 },
    { header: 'matching_data', key: 'matching_data', width: 80 },
    { header: 'fill_in_blank_data', key: 'fill_in_blank_data', width: 80 },
    { header: 'sequence_ordering_data', key: 'sequence_ordering_data', width: 80 },
    { header: 'simulation_data', key: 'simulation_data', width: 80 },
    
    // Alternative simple fields for complex questions
    { header: 'instructions', key: 'instructions', width: 40 },
    { header: 'drag_items', key: 'drag_items', width: 60 },
    { header: 'drop_zones', key: 'drop_zones', width: 60 },
    { header: 'available_items', key: 'available_items', width: 60 },
    { header: 'max_items', key: 'max_items', width: 15 },
    { header: 'left_column', key: 'left_column', width: 40 },
    { header: 'right_column', key: 'right_column', width: 40 },
    { header: 'allow_multiple_matches', key: 'allow_multiple_matches', width: 20 },
    { header: 'question_template', key: 'question_template', width: 50 },
    { header: 'blanks', key: 'blanks', width: 60 },
    { header: 'case_sensitive', key: 'case_sensitive', width: 15 },
    { header: 'sequence_items', key: 'sequence_items', width: 60 },
    { header: 'scenario', key: 'scenario', width: 50 },
    { header: 'tasks', key: 'tasks', width: 60 },
    { header: 'validation_rules', key: 'validation_rules', width: 60 }
  ];
  
  worksheet.columns = columns;
  
  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };
  headerRow.height = 30;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  
  // Add sample data for different question types
  const sampleData = [
    // Traditional Single Choice
    {
      question_text: 'Which Azure service provides Platform-as-a-Service (PaaS) for web applications?',
      question_type: 'single_choice',
      explanation: 'Azure App Service is a PaaS offering for hosting web applications.',
      order_index: 1,
      option1: 'Azure Virtual Machines',
      option2: 'Azure App Service',
      option3: 'Azure Storage',
      option4: 'Azure Functions',
      correct_answer_index: 2
    },
    
    // Multiple Choice
    {
      question_text: 'Which Azure services provide compute capabilities? (Select all that apply)',
      question_type: 'multiple_choice',
      explanation: 'Multiple Azure services offer different types of compute resources.',
      order_index: 2,
      option1: 'Azure Virtual Machines',
      option2: 'Azure Functions',
      option3: 'Azure Storage',
      option4: 'Azure App Service',
      correct_answer_index: '1,2,4'
    },
    
    // Drag Drop Ordering
    {
      question_text: 'Match the Azure services with their appropriate categories',
      question_type: 'drag_drop_ordering',
      explanation: 'Understanding service categories helps with proper architecture.',
      order_index: 3,
      instructions: 'Drag the services to their correct category zones',
      drag_drop_ordering_data: JSON.stringify({
        instructions: 'Drag the services to their correct category zones',
        drag_items: [
          { id: 1, text: 'Azure Virtual Machines' },
          { id: 2, text: 'Azure SQL Database' }
        ],
        drop_zones: [
          { id: 1, label: 'Infrastructure as a Service (IaaS)' },
          { id: 2, label: 'Platform as a Service (PaaS)' }
        ]
      })
    },
    
    // Build List
    {
      question_text: 'Build a list of steps for Azure deployment in the correct order',
      question_type: 'build_list',
      explanation: 'Proper deployment order ensures successful provisioning.',
      order_index: 4,
      instructions: 'Select and order the deployment steps (maximum 3 steps)',
      build_list_data: JSON.stringify({
        instructions: 'Select and order the deployment steps (maximum 3 steps)',
        max_items: 3,
        available_items: [
          { id: 1, text: 'Create Resource Group', category: 'Setup' },
          { id: 2, text: 'Deploy ARM Template', category: 'Deployment' },
          { id: 3, text: 'Configure Settings', category: 'Config' },
          { id: 4, text: 'Test Application', category: 'Validation' }
        ]
      })
    },
    
    // Matching
    {
      question_text: 'Match each Azure service with its primary category',
      question_type: 'matching',
      explanation: 'Understanding service categories is key to Azure architecture.',
      order_index: 5,
      instructions: 'Match each service to its corresponding category',
      matching_data: JSON.stringify({
        instructions: 'Match each service to its corresponding category',
        allow_multiple_matches: false,
        left_column: [
          { id: 1, text: 'Azure Virtual Machines' },
          { id: 2, text: 'Azure SQL Database' }
        ],
        right_column: [
          { id: 1, text: 'Infrastructure as a Service (IaaS)' },
          { id: 2, text: 'Platform as a Service (PaaS)' }
        ]
      })
    },
    
    // Fill in the Blank
    {
      question_text: 'Complete the Azure PowerShell command',
      question_type: 'fill_in_blank',
      explanation: 'The New-AzResourceGroup cmdlet creates Azure resource groups.',
      order_index: 6,
      question_template: 'New-Az[BLANK_1] -Name "MyResourceGroup" -Location "[BLANK_2]"',
      fill_in_blank_data: JSON.stringify({
        question_template: 'New-Az[BLANK_1] -Name "MyResourceGroup" -Location "[BLANK_2]"',
        blanks: [
          { blank_number: 1, expected_answers: ['ResourceGroup'], case_sensitive: false },
          { blank_number: 2, expected_answers: ['East US', 'West Europe'], case_sensitive: false }
        ],
        case_sensitive: false
      })
    },
    
    // Hotspot
    {
      question_text: 'Click on the Load Balancer in the Azure portal diagram',
      question_type: 'hotspot',
      explanation: 'Load balancers distribute traffic across multiple instances.',
      order_index: 7,
      hotspot_image_url: '/images/azure-portal-diagram.png',
      image_width: 1024,
      image_height: 768,
      hotspot_instructions: 'Click on the correct areas to identify the Load Balancer',
      hotspot_areas: JSON.stringify([
        { id: 1, label: 'Load Balancer', coordinates: { x: 200, y: 150, width: 100, height: 50 } },
        { id: 2, label: 'Virtual Network', coordinates: { x: 350, y: 200, width: 120, height: 60 } }
      ])
    },
    
    // Sequence Ordering
    {
      question_text: 'Arrange the deployment process steps in the correct order',
      question_type: 'sequence_ordering',
      explanation: 'Proper sequence ensures successful deployment.',
      order_index: 8,
      instructions: 'Put these steps in chronological order',
      sequence_ordering_data: JSON.stringify({
        instructions: 'Put these steps in chronological order',
        sequence_items: [
          { id: 1, text: 'Create resource group' },
          { id: 2, text: 'Deploy ARM template' },
          { id: 3, text: 'Configure application settings' },
          { id: 4, text: 'Validate deployment' }
        ]
      })
    },
    
    // Case Study
    {
      question_text: 'Based on the migration scenario, answer the following questions',
      question_type: 'case_study',
      explanation: 'Case studies test real-world application of Azure knowledge.',
      order_index: 9,
      case_study_title: 'Azure Migration Scenario',
      case_study_scenario: 'Contoso Ltd is planning to migrate their on-premises infrastructure to Azure. They have 100 VMs running various workloads including web servers, database servers, and domain controllers.'
    },
    
    // Simulation
    {
      question_text: 'Configure the Azure Load Balancer for high availability',
      question_type: 'simulation',
      explanation: 'This simulation tests hands-on Azure configuration skills.',
      order_index: 10,
      scenario: 'You need to configure a Load Balancer to distribute traffic across 3 web servers',
      simulation_data: JSON.stringify({
        scenario: 'You need to configure a Load Balancer to distribute traffic across 3 web servers',
        instructions: 'Follow the steps to configure the Load Balancer',
        tasks: [
          { id: 1, description: 'Create Load Balancer', type: 'configuration' },
          { id: 2, description: 'Add Backend Pool', type: 'configuration' },
          { id: 3, description: 'Configure Health Probe', type: 'configuration' }
        ],
        validation_rules: [
          { rule: 'load_balancer_created', description: 'Load Balancer must be created' },
          { rule: 'backend_pool_configured', description: 'Backend pool must have 3 VMs' }
        ]
      })
    }
  ];
  
  // Add sample data
  sampleData.forEach((data, index) => {
    worksheet.addRow(data);
    
    // Style data rows
    const row = worksheet.getRow(index + 2);
    row.height = 25;
    
    // Add borders and alternating colors
    if (index % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    }
  });
  
  // Apply borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D3D4' } },
        left: { style: 'thin', color: { argb: 'FFD0D3D4' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D3D4' } },
        right: { style: 'thin', color: { argb: 'FFD0D3D4' } }
      };
      
      // Wrap text for better readability
      cell.alignment = { vertical: 'top', wrapText: true };
    });
  });
  
  // Create instructions worksheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  
  const instructions = [
    ['📝 ENHANCED QUESTION TEMPLATE INSTRUCTIONS', ''],
    ['', ''],
    ['✅ SUPPORTED QUESTION TYPES:', ''],
    ['', ''],
    ['Traditional Questions:', 'Use option1-option6 columns and correct_answer_index'],
    ['• single_choice', 'Use correct_answer_index (e.g., 2 for option2)'],
    ['• multiple_choice', 'Use correct_answer_index (e.g., "1,3,4" for options 1, 3, and 4)'],
    ['• yes_no', 'Use option1="Yes", option2="No", correct_answer_index=1 or 2'],
    ['', ''],
    ['Advanced Questions:', 'Use JSON data columns OR simple field columns'],
    ['• drag_drop_ordering', 'Use drag_drop_ordering_data (JSON) OR drag_items + drop_zones'],
    ['• build_list', 'Use build_list_data (JSON) OR available_items + max_items'],
    ['• matching', 'Use matching_data (JSON) OR left_column + right_column + allow_multiple_matches'],
    ['• fill_in_blank', 'Use fill_in_blank_data (JSON) OR question_template + blanks + case_sensitive'],
    ['• hotspot', 'Use hotspot_image_url + image_width/height + hotspot_areas (JSON)'],
    ['• sequence_ordering', 'Use sequence_ordering_data (JSON) OR sequence_items'],
    ['• simulation', 'Use simulation_data (JSON) OR scenario + tasks + validation_rules'],
    ['• case_study', 'Use case_study_title + case_study_scenario'],
    ['', ''],
    ['🔧 COLUMN MAPPING GUIDE:', ''],
    ['', ''],
    ['Required Columns:', ''],
    ['• question_text', 'The main question text (REQUIRED)'],
    ['• question_type', 'One of the supported types above (REQUIRED)'],
    ['', ''],
    ['Optional Columns:', ''],
    ['• explanation', 'Answer explanation shown after submission'],
    ['• order_index', 'Question order (numeric)'],
    ['• case_study_title', 'Link to existing case study or create new'],
    ['• case_study_scenario', 'Case study scenario text'],
    ['', ''],
    ['📊 JSON FORMAT EXAMPLES:', ''],
    ['', ''],
    ['Drag Drop Example:', '{"instructions":"Match items","drag_items":[{"id":1,"text":"Item 1"}],"drop_zones":[{"id":1,"label":"Zone 1"}]}'],
    ['Build List Example:', '{"instructions":"Build list","max_items":3,"available_items":[{"id":1,"text":"Step 1","category":"Setup"}]}'],
    ['Matching Example:', '{"instructions":"Match items","left_column":[{"id":1,"text":"Left 1"}],"right_column":[{"id":1,"text":"Right 1"}]}'],
    ['Fill Blank Example:', '{"question_template":"New-Az[BLANK_1]","blanks":[{"blank_number":1,"expected_answers":["ResourceGroup"]}]}'],
    ['Hotspot Areas Example:', '[{"id":1,"label":"Button","coordinates":{"x":100,"y":200,"width":50,"height":30}}]'],
    ['Sequence Example:', '{"instructions":"Order steps","sequence_items":[{"id":1,"text":"First step"},{"id":2,"text":"Second step"}]}'],
    ['Simulation Example:', '{"scenario":"Configure system","tasks":[{"id":1,"description":"Task 1"}],"validation_rules":[{"rule":"rule1"}]}'],
    ['', ''],
    ['💡 TIPS:', ''],
    ['• Use the sample data as templates', ''],
    ['• For complex questions, you can use either JSON columns OR simple field columns', ''],
    ['• JSON format gives you more control but is harder to edit in Excel', ''],
    ['• Simple field columns are easier to edit but have limitations', ''],
    ['• Test your import with a small file first', ''],
    ['• Check validation errors in the import summary', '']
  ];
  
  instructions.forEach((row, index) => {
    const excelRow = instructionsSheet.addRow(row);
    
    // Style headers
    if (row[0].includes('📝') || row[0].includes('✅') || row[0].includes('🔧') || row[0].includes('📊') || row[0].includes('💡')) {
      excelRow.font = { bold: true, size: 14, color: { argb: 'FF366092' } };
      excelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7F3FF' } };
    }
    
    // Style category headers
    if (row[0].includes(':') && !row[0].includes('{"')) {
      excelRow.font = { bold: true, color: { argb: 'FF495057' } };
    }
    
    // Style bullet points
    if (row[0].startsWith('•')) {
      excelRow.font = { italic: true };
    }
  });
  
  // Set column widths for instructions
  instructionsSheet.columns = [
    { width: 40 },
    { width: 80 }
  ];
  
  // Save the file
  const templateDir = path.resolve(__dirname, '../uploads');
  const templatePath = path.join(templateDir, 'enhanced-question-template.xlsx');
  
  await workbook.xlsx.writeFile(templatePath);
  
  console.log('✅ Enhanced template generated successfully!');
  console.log(`📁 Location: ${templatePath}`);
  console.log('📊 Features:');
  console.log('   • All 11 question types supported');
  console.log('   • JSON and simple field options');
  console.log('   • Sample data for each type');
  console.log('   • Comprehensive instructions sheet');
  console.log('   • Professional styling');
  
  // Also create a copy in frontend public folder if it exists
  const frontendTemplatePath = path.resolve(__dirname, '../../frontend/public/templates/enhanced-question-template.xlsx');
  try {
    const frontendDir = path.dirname(frontendTemplatePath);
    const fs = require('fs');
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    await workbook.xlsx.writeFile(frontendTemplatePath);
    console.log(`📁 Frontend copy: ${frontendTemplatePath}`);
  } catch (error) {
    console.log('⚠️  Could not create frontend copy:', error.message);
  }
  
  return templatePath;
}

// Run if called directly
if (require.main === module) {
  generateEnhancedTemplate()
    .then(() => {
      console.log('\n🎉 Enhanced template generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Template generation failed:', error);
      process.exit(1);
    });
}

module.exports = generateEnhancedTemplate;