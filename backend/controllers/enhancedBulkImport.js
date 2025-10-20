const { promisePool } = require('../config/database');
const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');

// Enhanced validation for all question types
const validateQuestionData = (question) => {
  const errors = [];
  
  if (!question.text || question.text.toString().trim().length === 0) {
    errors.push('Question text is required');
  }
  
  // Validate question type
  const validTypes = [
    'single_choice', 'multiple_choice', 'yes_no', 'case_study',
    'drag_drop_ordering', 'build_list', 'matching', 'fill_in_blank', 
    'hotspot', 'sequence_ordering', 'simulation'
  ];
  
  const questionType = question.question_type.toLowerCase();
  if (!validTypes.includes(questionType)) {
    errors.push(`Invalid question type: ${question.question_type}. Must be one of: ${validTypes.join(', ')}`);
    return errors; // Return early if type is invalid
  }
  
  // Type-specific validation
  switch (questionType) {
    case 'single_choice':
    case 'multiple_choice':
    case 'yes_no':
      if (!question.options || question.options.length < 2) {
        errors.push('Traditional questions require at least 2 options');
      }
      
      const correctOptions = question.options.filter(opt => opt.is_correct);
      if (correctOptions.length === 0) {
        errors.push('At least one option must be marked as correct');
      }
      
      if (questionType === 'single_choice' && correctOptions.length > 1) {
        errors.push('Single choice questions must have exactly one correct answer');
      }
      break;
      
    case 'drag_drop_ordering':
      if (!question.drag_drop_ordering_data) {
        errors.push('Drag drop ordering questions require drag_drop_ordering_data');
      } else {
        const data = question.drag_drop_ordering_data;
        if (!data.drag_items || !Array.isArray(data.drag_items) || data.drag_items.length === 0) {
          errors.push('Drag drop ordering questions require at least one drag item');
        }
        if (!data.drop_zones || !Array.isArray(data.drop_zones) || data.drop_zones.length === 0) {
          errors.push('Drag drop ordering questions require at least one drop zone');
        }
      }
      break;
      
    case 'build_list':
      if (!question.build_list_data) {
        errors.push('Build list questions require build_list_data');
      } else {
        const data = question.build_list_data;
        if (!data.available_items || !Array.isArray(data.available_items) || data.available_items.length === 0) {
          errors.push('Build list questions require at least one available item');
        }
      }
      break;
      
    case 'matching':
      if (!question.matching_data) {
        errors.push('Matching questions require matching_data');
      } else {
        const data = question.matching_data;
        if (!data.left_column || !Array.isArray(data.left_column) || data.left_column.length === 0) {
          errors.push('Matching questions require left column items');
        }
        if (!data.right_column || !Array.isArray(data.right_column) || data.right_column.length === 0) {
          errors.push('Matching questions require right column items');
        }
      }
      break;
      
    case 'fill_in_blank':
      if (!question.fill_in_blank_data) {
        errors.push('Fill in blank questions require fill_in_blank_data');
      } else {
        const data = question.fill_in_blank_data;
        if (!data.question_template || data.question_template.trim().length === 0) {
          errors.push('Fill in blank questions require a question template');
        }
        if (!data.blanks || !Array.isArray(data.blanks) || data.blanks.length === 0) {
          errors.push('Fill in blank questions require at least one blank');
        }
      }
      break;
      
    case 'hotspot':
      if (!question.hotspot_data || !question.hotspot_data.image_url) {
        errors.push('Hotspot questions require an image URL');
      }
      if (!question.hotspot_areas || !Array.isArray(question.hotspot_areas) || question.hotspot_areas.length === 0) {
        errors.push('Hotspot questions require at least one clickable area');
      }
      break;
      
    case 'sequence_ordering':
      if (!question.sequence_ordering_data) {
        errors.push('Sequence ordering questions require sequence_ordering_data');
      } else {
        const data = question.sequence_ordering_data;
        if (!data.sequence_items || !Array.isArray(data.sequence_items) || data.sequence_items.length === 0) {
          errors.push('Sequence ordering questions require sequence items');
        }
      }
      break;
      
    case 'simulation':
      if (!question.simulation_data) {
        errors.push('Simulation questions require simulation_data');
      } else {
        const data = question.simulation_data;
        if (!data.scenario || data.scenario.trim().length === 0) {
          errors.push('Simulation questions require a scenario description');
        }
      }
      break;
      
    case 'case_study':
      // Case studies will have sub-questions handled separately
      break;
  }
  
  return errors;
};

// Enhanced row mapping function
const mapEnhancedQuestionRow = (row, columnMap) => {
  const getValue = (key) => {
    const columnKey = columnMap[key];
    if (!columnKey) return undefined;
    return row[columnKey];
  };
  
  const parseJSON = (value, defaultValue = null) => {
    if (!value) return defaultValue;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      console.warn('JSON parse error:', error.message, 'Value:', value);
      return defaultValue;
    }
  };
  
  const text = getValue('question_text');
  const questionType = (getValue('question_type') || 'single_choice').toString().trim().toLowerCase();
  const explanation = getValue('explanation') || '';
  const orderIndex = parseInt(getValue('order_index')) || 0;
  const caseStudyTitle = getValue('case_study_title');
  const caseStudyScenario = getValue('case_study_scenario');
  
  // Initialize question data
  const question = {
    text,
    question_type: questionType,
    explanation: explanation ? explanation.toString() : '',
    order_index: orderIndex,
    case_study_title: caseStudyTitle ? caseStudyTitle.toString().trim() : null,
    case_study_scenario: caseStudyScenario ? caseStudyScenario.toString() : null,
    options: [],
    // Complex question data fields
    drag_drop_ordering_data: null,
    build_list_data: null,
    matching_data: null,
    fill_in_blank_data: null,
    hotspot_data: null,
    hotspot_areas: null,
    sequence_ordering_data: null,
    simulation_data: null
  };
  
  // Handle different question types
  switch (questionType) {
    case 'single_choice':
    case 'multiple_choice':
    case 'yes_no':
      // Process traditional options
      const optionColumns = columnMap.question_options || [];
      const correctColumns = columnMap.correct_options || [];
      
      optionColumns.forEach((columnKey, index) => {
        const textValue = row[columnKey];
        if (textValue && textValue.toString().trim().length > 0) {
          question.options.push({
            text: textValue.toString(),
            is_correct: false,
            order_index: index + 1,
          });
        }
      });
      
      // Mark correct options
      const correctOptions = new Set();
      correctColumns.forEach((columnKey) => {
        const value = row[columnKey];
        if (value === undefined || value === null) return;
        
        if (columnMap.correct_mode === 'index') {
          const numeric = parseInt(value);
          if (numeric && numeric >= 1) correctOptions.add(numeric);
        } else if (columnMap.correct_mode === 'text') {
          const normalized = value.toString().trim().toLowerCase();
          optionColumns.forEach((optionColumn, optionIndex) => {
            const optionValue = row[optionColumn];
            if (optionValue && optionValue.toString().trim().toLowerCase() === normalized) {
              correctOptions.add(optionIndex + 1);
            }
          });
        }
      });
      
      question.options.forEach((option) => {
        if (correctOptions.has(option.order_index)) {
          option.is_correct = true;
        }
      });
      break;
      
    case 'drag_drop_ordering':
      question.drag_drop_ordering_data = parseJSON(getValue('drag_drop_ordering_data'), {
        instructions: getValue('instructions') || '',
        drag_items: parseJSON(getValue('drag_items'), []),
        drop_zones: parseJSON(getValue('drop_zones'), [])
      });
      break;
      
    case 'build_list':
      question.build_list_data = parseJSON(getValue('build_list_data'), {
        instructions: getValue('instructions') || '',
        available_items: parseJSON(getValue('available_items'), []),
        max_items: parseInt(getValue('max_items')) || null
      });
      break;
      
    case 'matching':
      question.matching_data = parseJSON(getValue('matching_data'), {
        instructions: getValue('instructions') || '',
        left_column: parseJSON(getValue('left_column'), []),
        right_column: parseJSON(getValue('right_column'), []),
        allow_multiple_matches: getValue('allow_multiple_matches') === 'true' || false
      });
      break;
      
    case 'fill_in_blank':
      question.fill_in_blank_data = parseJSON(getValue('fill_in_blank_data'), {
        question_template: getValue('question_template') || '',
        blanks: parseJSON(getValue('blanks'), []),
        case_sensitive: getValue('case_sensitive') === 'true' || false
      });
      break;
      
    case 'hotspot':
      question.hotspot_data = parseJSON(getValue('hotspot_data'), {
        image_url: getValue('hotspot_image_url') || getValue('image_url') || '',
        image_width: parseInt(getValue('image_width')) || 800,
        image_height: parseInt(getValue('image_height')) || 600,
        instructions: getValue('hotspot_instructions') || getValue('instructions') || ''
      });
      question.hotspot_areas = parseJSON(getValue('hotspot_areas'), []);
      break;
      
    case 'sequence_ordering':
      question.sequence_ordering_data = parseJSON(getValue('sequence_ordering_data'), {
        instructions: getValue('instructions') || '',
        sequence_items: parseJSON(getValue('sequence_items'), [])
      });
      break;
      
    case 'simulation':
      question.simulation_data = parseJSON(getValue('simulation_data'), {
        scenario: getValue('scenario') || getValue('simulation_scenario') || '',
        instructions: getValue('instructions') || '',
        tasks: parseJSON(getValue('tasks'), []),
        validation_rules: parseJSON(getValue('validation_rules'), [])
      });
      break;
  }
  
  return question;
};

// Enhanced bulk import function
const enhancedBulkImportQuestions = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const {
      exam_id,
      column_map: serializedMap,
      case_study_mode = 'link',
      create_missing_case_studies = false,
    } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!exam_id) {
      return res.status(400).json({ error: 'exam_id required' });
    }
    
    let columnMap = null;
    try {
      columnMap = serializedMap ? JSON.parse(serializedMap) : null;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid column_map JSON' });
    }
    
    if (!columnMap || !columnMap.question_text) {
      return res.status(400).json({ error: 'Column mapping must include question_text' });
    }
    
    // Check if exam exists
    const [exams] = await connection.query(
      'SELECT id FROM exams WHERE id = ?',
      [exam_id]
    );
    
    if (exams.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Read file data
    let rows = [];
    
    if (file.mimetype === 'application/json' || file.originalname.toLowerCase().endsWith('.json')) {
      const fileContent = fs.readFileSync(file.path, 'utf8');
      const data = JSON.parse(fileContent);
      rows = Array.isArray(data) ? data : data.rows || [];
    } else if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      rows = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.toLowerCase().endsWith('.xlsx')
    ) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.path);
      const worksheet = workbook.worksheets[0];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        const rowData = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const headerCell = worksheet.getRow(1).getCell(colNumber);
          const header = headerCell && headerCell.value ? headerCell.value.toString().trim() : `Column_${colNumber}`;
          rowData[header] = cell.value;
        });
        rows.push(rowData);
      });
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Unsupported file type. Use XLSX, CSV, or JSON' });
    }
    
    if (!rows || rows.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'No data rows found in uploaded file' });
    }
    
    await connection.beginTransaction();
    
    // Case study cache
    const caseStudyCache = new Map();
    const getCaseStudyId = async (title, scenarioText) => {
      if (!title || title.trim().length === 0) return null;
      
      const cacheKey = title.trim().toLowerCase();
      if (caseStudyCache.has(cacheKey)) {
        return caseStudyCache.get(cacheKey);
      }
      
      // Try to find existing case study
      const [existing] = await connection.query(
        'SELECT id FROM case_studies WHERE exam_id = ? AND LOWER(title) = LOWER(?) LIMIT 1',
        [exam_id, title.trim()]
      );
      
      if (existing.length > 0) {
        const caseStudyId = existing[0].id;
        caseStudyCache.set(cacheKey, caseStudyId);
        return caseStudyId;
      }
      
      if (create_missing_case_studies && case_study_mode === 'create') {
        // Create new case study
        const [result] = await connection.query(
          'INSERT INTO case_studies (exam_id, title, scenario_text, order_index) VALUES (?, ?, ?, ?)',
          [exam_id, title.trim(), scenarioText || '', 0]
        );
        
        const newId = result.insertId;
        caseStudyCache.set(cacheKey, newId);
        return newId;
      }
      
      return null;
    };
    
    const importSummary = {
      total_rows: rows.length,
      imported_count: 0,
      skipped_count: 0,
      errors: [],
      warnings: [],
    };
    
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      
      try {
        const question = mapEnhancedQuestionRow(row, columnMap);
        const validationErrors = validateQuestionData(question);
        
        if (validationErrors.length > 0) {
          importSummary.skipped_count++;
          importSummary.errors.push({
            row: index + 2,
            errors: validationErrors,
          });
          continue;
        }
        
        const caseStudyId = await getCaseStudyId(question.case_study_title, question.case_study_scenario);
        
        // Insert question
        const [questionResult] = await connection.query(
          `INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index, 
           drag_drop_ordering_data, build_list_data, matching_data, fill_in_blank_data, 
           hotspot_data, sequence_ordering_data, simulation_data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exam_id,
            caseStudyId,
            question.text,
            question.explanation,
            question.question_type,
            question.order_index,
            question.drag_drop_ordering_data ? JSON.stringify(question.drag_drop_ordering_data) : null,
            question.build_list_data ? JSON.stringify(question.build_list_data) : null,
            question.matching_data ? JSON.stringify(question.matching_data) : null,
            question.fill_in_blank_data ? JSON.stringify(question.fill_in_blank_data) : null,
            question.hotspot_data ? JSON.stringify(question.hotspot_data) : null,
            question.sequence_ordering_data ? JSON.stringify(question.sequence_ordering_data) : null,
            question.simulation_data ? JSON.stringify(question.simulation_data) : null
          ]
        );
        
        const questionId = questionResult.insertId;
        
        // Handle type-specific data
        if (question.question_type === 'hotspot' && question.hotspot_areas && question.hotspot_areas.length > 0) {
          // Create hotspot areas
          for (const area of question.hotspot_areas) {
            await connection.query(
              'INSERT INTO hotspot_areas (question_id, label, coordinates) VALUES (?, ?, ?)',
              [questionId, area.label || null, JSON.stringify(area.coordinates)]
            );
          }
        } else if (['single_choice', 'multiple_choice', 'yes_no'].includes(question.question_type) && question.options.length > 0) {
          // Create traditional options
          for (const option of question.options) {
            await connection.query(
              'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
              [questionId, option.text, option.is_correct ? 1 : 0, option.order_index]
            );
          }
        }
        
        importSummary.imported_count++;
        
      } catch (rowError) {
        importSummary.skipped_count++;
        importSummary.errors.push({
          row: index + 2,
          errors: [rowError.message || 'Unknown error'],
        });
      }
    }
    
    // Update exam total_questions count
    await connection.query(
      'UPDATE exams SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = ?) WHERE id = ?',
      [exam_id, exam_id]
    );
    
    await connection.commit();
    
    // Clean up uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    res.json({
      success: importSummary.imported_count > 0,
      summary: {
        processed_rows: importSummary.total_rows,
        imported_rows: importSummary.imported_count,
        skipped_rows: importSummary.skipped_count,
        errors: importSummary.errors
      },
      message: `Imported ${importSummary.imported_count} questions. Skipped ${importSummary.skipped_count}.`,
    });
    
  } catch (error) {
    await connection.rollback();
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Enhanced bulk import error:', error);
    res.status(500).json({ error: 'Failed to import questions: ' + error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  enhancedBulkImportQuestions,
  validateQuestionData,
  mapEnhancedQuestionRow
};