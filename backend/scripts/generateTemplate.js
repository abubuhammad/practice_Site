const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Questions');

  // Define columns with headers
  worksheet.columns = [
    { header: 'question_text', key: 'question_text', width: 50 },
    { header: 'question_type', key: 'question_type', width: 15 },
    { header: 'explanation', key: 'explanation', width: 50 },
    { header: 'order_index', key: 'order_index', width: 12 },
    { header: 'case_study_title', key: 'case_study_title', width: 30 },
    { header: 'case_study_scenario', key: 'case_study_scenario', width: 50 },
    { header: 'option_1', key: 'option_1', width: 40 },
    { header: 'option_2', key: 'option_2', width: 40 },
    { header: 'option_3', key: 'option_3', width: 40 },
    { header: 'option_4', key: 'option_4', width: 40 },
    { header: 'correct_answer_index', key: 'correct_answer_index', width: 20 },
    { header: 'hotspot_image_url', key: 'hotspot_image_url', width: 50 },
    { header: 'hotspot_instructions', key: 'hotspot_instructions', width: 50 },
    { header: 'hotspot_areas', key: 'hotspot_areas', width: 60 },
  ];

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Add sample data rows
  const sampleData = [
    {
      question_text: 'What is Microsoft Azure?',
      question_type: 'multiple_choice',
      explanation: 'Azure is Microsoft\'s cloud computing platform that provides a wide range of cloud services.',
      order_index: '1',
      case_study_title: '',
      case_study_scenario: '',
      option_1: 'A cloud computing platform',
      option_2: 'A database management system',
      option_3: 'An operating system',
      option_4: 'A programming language',
      correct_answer_index: '1',
      hotspot_image_url: '',
      hotspot_instructions: '',
      hotspot_areas: ''
    },
    {
      question_text: 'Which Azure service is used for virtual machines?',
      question_type: 'multiple_choice',
      explanation: 'Azure Virtual Machines (VMs) is the service that provides on-demand, scalable computing resources.',
      order_index: '2',
      case_study_title: '',
      case_study_scenario: '',
      option_1: 'Azure Functions',
      option_2: 'Azure Virtual Machines',
      option_3: 'Azure Storage',
      option_4: 'Azure SQL Database',
      correct_answer_index: '2',
      hotspot_image_url: '',
      hotspot_instructions: '',
      hotspot_areas: ''
    },
    {
      question_text: 'What does IaaS stand for?',
      question_type: 'multiple_choice',
      explanation: 'IaaS stands for Infrastructure as a Service, which provides virtualized computing resources over the internet.',
      order_index: '3',
      case_study_title: '',
      case_study_scenario: '',
      option_1: 'Internet as a Service',
      option_2: 'Infrastructure as a Service',
      option_3: 'Integration as a Service',
      option_4: 'Information as a Service',
      correct_answer_index: '2',
      hotspot_image_url: '',
      hotspot_instructions: '',
      hotspot_areas: ''
    },
    {
      question_text: 'Click on the correct Azure service for virtual machines in the Azure portal interface.',
      question_type: 'hotspot',
      explanation: 'This is a HOTSPOT question example. For hotspot questions, users click on areas of an image.',
      order_index: '4',
      case_study_title: '',
      case_study_scenario: '',
      option_1: '',
      option_2: '',
      option_3: '',
      option_4: '',
      correct_answer_index: '',
      hotspot_image_url: 'https://example.com/azure-portal-screenshot.png',
      hotspot_instructions: 'Click on the Virtual Machines service in the Azure portal',
      hotspot_areas: '[{"coordinates": {"x": 100, "y": 200, "width": 150, "height": 50}, "is_correct": true, "label": "Virtual Machines"}]'
    }
  ];

  // Add sample rows
  sampleData.forEach(data => {
    worksheet.addRow(data);
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Add instructions sheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.columns = [
    { header: 'Field Name', key: 'field', width: 25 },
    { header: 'Required', key: 'required', width: 12 },
    { header: 'Description', key: 'description', width: 80 }
  ];

  const instructions = [
    {
      field: 'question_text',
      required: 'Yes',
      description: 'The text of the question. This is what the user will see.'
    },
    {
      field: 'question_type',
      required: 'No',
      description: 'Type of question: "multiple_choice" (default), "single_choice", or "hotspot". Use "hotspot" for click-on-image questions.'
    },
    {
      field: 'explanation',
      required: 'No',
      description: 'Explanation shown after the user answers. Helps users understand the correct answer.'
    },
    {
      field: 'order_index',
      required: 'No',
      description: 'Numeric value to control the order of questions. Lower numbers appear first.'
    },
    {
      field: 'case_study_title',
      required: 'No',
      description: 'Title of the case study this question belongs to (if applicable).'
    },
    {
      field: 'case_study_scenario',
      required: 'No',
      description: 'The scenario text for the case study (if applicable).'
    },
    {
      field: 'option_1, option_2, etc.',
      required: 'Yes',
      description: 'The answer options for the question. You need at least 2 options. Add more columns (option_5, option_6) if needed.'
    },
    {
      field: 'correct_answer_index',
      required: 'Yes',
      description: 'The index (1-based) of the correct answer. For example, if option_2 is correct, enter "2". Leave empty for hotspot questions.'
    },
    {
      field: 'hotspot_image_url',
      required: 'No',
      description: 'For HOTSPOT questions: URL of the image to display. Leave empty for multiple choice questions.'
    },
    {
      field: 'hotspot_instructions',
      required: 'No',
      description: 'For HOTSPOT questions: Instructions for what users should click on. Leave empty for multiple choice questions.'
    },
    {
      field: 'hotspot_areas',
      required: 'No',
      description: 'For HOTSPOT questions: JSON array of clickable areas with coordinates and correctness. Format: [{"coordinates": {"x": 100, "y": 200, "width": 150, "height": 50}, "is_correct": true, "label": "Area Name"}]'
    }
  ];

  // Style instructions header
  const instrHeaderRow = instructionsSheet.getRow(1);
  instrHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  instrHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF28A745' }
  };
  instrHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  instrHeaderRow.height = 25;

  // Add instruction rows
  instructions.forEach(instr => {
    instructionsSheet.addRow(instr);
  });

  // Add borders to instruction cells
  instructionsSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'top', wrapText: true };
    });
  });

  // Add a title row at the top of instructions
  instructionsSheet.insertRow(1, ['BULK QUESTION UPLOAD TEMPLATE - INSTRUCTIONS']);
  const titleRow = instructionsSheet.getRow(1);
  titleRow.font = { bold: true, size: 14 };
  titleRow.height = 30;
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
  instructionsSheet.mergeCells('A1:C1');

  // Add notes
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(['NOTES:', '', '']);
  const notesRow = instructionsSheet.lastRow;
  notesRow.font = { bold: true };
  
  instructionsSheet.addRow(['1. Delete the sample data rows in the "Questions" sheet before uploading your own data.', '', '']);
  instructionsSheet.addRow(['2. Keep the header row (first row) intact - do not modify column names.', '', '']);
  instructionsSheet.addRow(['3. You can add more option columns (option_5, option_6, etc.) if needed.', '', '']);
  instructionsSheet.addRow(['4. The correct_answer_index uses 1-based indexing (1 = first option, 2 = second option, etc.).', '', '']);
  instructionsSheet.addRow(['5. Leave case_study fields empty if the question is not part of a case study.', '', '']);
  instructionsSheet.addRow(['6. For HOTSPOT questions: Set question_type to "hotspot", leave option fields empty, and fill hotspot fields.', '', '']);
  instructionsSheet.addRow(['7. For MULTIPLE CHOICE questions: Leave hotspot fields empty and fill option fields.', '', '']);

  // Save the file
  const templatePath = path.join(__dirname, '../../frontend/public/templates/question-bulk-template.xlsx');
  
  // Ensure the directory exists
  const templateDir = path.dirname(templatePath);
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(templatePath);
  console.log('✅ Template generated successfully at:', templatePath);
  console.log('📊 Template includes:');
  console.log('   - Questions sheet with sample data');
  console.log('   - Instructions sheet with field descriptions');
  console.log('   - Proper formatting and styling');
}

// Run the generator
generateTemplate()
  .then(() => {
    console.log('\n✨ Template generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error generating template:', error);
    process.exit(1);
  });