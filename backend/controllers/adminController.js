const { promisePool } = require('../config/database');
const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');

// ==================== EXAM MANAGEMENT ====================

// Get all exams (admin view with more details)
exports.getAllExamsAdmin = async (req, res) => {
  try {
    const [exams] = await promisePool.query(
      `SELECT e.*, 
        (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as actual_question_count,
        (SELECT COUNT(*) FROM attempts WHERE exam_id = e.id) as attempt_count
       FROM exams e
       ORDER BY e.code`
    );

    res.json({ exams });
  } catch (error) {
    console.error('Get exams admin error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
};

// Create exam
exports.createExam = async (req, res) => {
  try {
    const { code, title, description, path, time_limit_minutes, passing_score } = req.body;

    // Validate required fields
    if (!code || !title || !path || !time_limit_minutes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if code already exists
    const [existing] = await promisePool.query(
      'SELECT id FROM exams WHERE code = ?',
      [code]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Exam code already exists' });
    }

    const [result] = await promisePool.query(
      `INSERT INTO exams (code, title, description, path, time_limit_minutes, passing_score, total_questions)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [code, title, description || '', path, time_limit_minutes, passing_score || 700]
    );

    const [exam] = await promisePool.query(
      'SELECT * FROM exams WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ exam: exam[0] });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
};

// Update exam
exports.updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { code, title, description, path, time_limit_minutes, passing_score } = req.body;

    // Check if exam exists
    const [existing] = await promisePool.query(
      'SELECT id FROM exams WHERE id = ?',
      [examId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    await promisePool.query(
      `UPDATE exams 
       SET code = ?, title = ?, description = ?, path = ?, time_limit_minutes = ?, passing_score = ?
       WHERE id = ?`,
      [code, title, description, path, time_limit_minutes, passing_score, examId]
    );

    const [exam] = await promisePool.query(
      'SELECT * FROM exams WHERE id = ?',
      [examId]
    );

    res.json({ exam: exam[0] });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ error: 'Failed to update exam' });
  }
};

// Delete exam
exports.deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;

    // Check if exam exists
    const [existing] = await promisePool.query(
      'SELECT id FROM exams WHERE id = ?',
      [examId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Delete exam (cascade will delete related records)
    await promisePool.query('DELETE FROM exams WHERE id = ?', [examId]);

    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
};

// ==================== CASE STUDY MANAGEMENT ====================

// Get all case studies
exports.getAllCaseStudies = async (req, res) => {
  try {
    const { exam_id } = req.query;

    let query = `
      SELECT cs.*, e.code as exam_code, e.title as exam_title,
        (SELECT COUNT(*) FROM questions WHERE case_study_id = cs.id) as question_count
      FROM case_studies cs
      JOIN exams e ON cs.exam_id = e.id
    `;
    const params = [];

    if (exam_id) {
      query += ' WHERE cs.exam_id = ?';
      params.push(exam_id);
    }

    query += ' ORDER BY cs.exam_id, cs.order_index';

    const [caseStudies] = await promisePool.query(query, params);

    res.json({ case_studies: caseStudies });
  } catch (error) {
    console.error('Get case studies error:', error);
    res.status(500).json({ error: 'Failed to fetch case studies' });
  }
};

// Create case study
exports.createCaseStudy = async (req, res) => {
  try {
    const { exam_id, title, scenario_text, order_index } = req.body;

    if (!exam_id || !title || !scenario_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await promisePool.query(
      'INSERT INTO case_studies (exam_id, title, scenario_text, order_index) VALUES (?, ?, ?, ?)',
      [exam_id, title, scenario_text, order_index || 0]
    );

    const [caseStudy] = await promisePool.query(
      'SELECT * FROM case_studies WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ case_study: caseStudy[0] });
  } catch (error) {
    console.error('Create case study error:', error);
    res.status(500).json({ error: 'Failed to create case study' });
  }
};

// Update case study
exports.updateCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, scenario_text, order_index } = req.body;

    await promisePool.query(
      'UPDATE case_studies SET title = ?, scenario_text = ?, order_index = ? WHERE id = ?',
      [title, scenario_text, order_index, id]
    );

    const [caseStudy] = await promisePool.query(
      'SELECT * FROM case_studies WHERE id = ?',
      [id]
    );

    res.json({ case_study: caseStudy[0] });
  } catch (error) {
    console.error('Update case study error:', error);
    res.status(500).json({ error: 'Failed to update case study' });
  }
};

// Delete case study
exports.deleteCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM case_studies WHERE id = ?', [id]);

    res.json({ success: true, message: 'Case study deleted successfully' });
  } catch (error) {
    console.error('Delete case study error:', error);
    res.status(500).json({ error: 'Failed to delete case study' });
  }
};

// ==================== QUESTION MANAGEMENT ====================

// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    const { exam_id } = req.query;

    let query = `
      SELECT q.*, 
        e.code as exam_code,
        cs.title as case_study_title,
        (SELECT COUNT(*) FROM options WHERE question_id = q.id) as option_count
      FROM questions q
      JOIN exams e ON q.exam_id = e.id
      LEFT JOIN case_studies cs ON q.case_study_id = cs.id
    `;
    const params = [];

    if (exam_id) {
      query += ' WHERE q.exam_id = ?';
      params.push(exam_id);
    }

    query += ' ORDER BY q.exam_id, q.order_index';

    const [questions] = await promisePool.query(query, params);

    res.json({ questions });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Get single question with options
exports.getQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const [questions] = await promisePool.query(
      'SELECT * FROM questions WHERE id = ?',
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = questions[0];

    // Load type-specific data based on question type
    switch (question.question_type) {
      case 'hotspot':
        // Get hotspot data
        const [hotspotData] = await promisePool.query(
          'SELECT * FROM hotspot_data WHERE question_id = ?',
          [id]
        );
        
        // Get hotspot areas
        const [hotspotAreas] = await promisePool.query(
          'SELECT * FROM hotspot_areas WHERE question_id = ? ORDER BY id',
          [id]
        );
        
        // Parse coordinates JSON
        const areas = hotspotAreas.map(area => ({
          ...area,
          coordinates: JSON.parse(area.coordinates)
        }));
        
        question.hotspot_data = hotspotData[0] || null;
        question.hotspot_areas = areas;
        break;

      case 'drag_drop_ordering':
        const [dragDropOrderingData] = await promisePool.query(
          'SELECT * FROM drag_drop_ordering_data WHERE question_id = ?',
          [id]
        );
        if (dragDropOrderingData.length > 0) {
          const data = dragDropOrderingData[0];
          question.drag_drop_ordering_data = {
            ...data,
            drag_items: JSON.parse(data.drag_items),
            drop_zones: JSON.parse(data.drop_zones)
          };
        }
        break;

      case 'build_list':
        const [buildListData] = await promisePool.query(
          'SELECT * FROM build_list_data WHERE question_id = ?',
          [id]
        );
        if (buildListData.length > 0) {
          const data = buildListData[0];
          question.build_list_data = {
            ...data,
            available_items: JSON.parse(data.available_items),
            correct_list: JSON.parse(data.correct_list)
          };
        }
        break;

      case 'simulation':
        const [simulationData] = await promisePool.query(
          'SELECT * FROM simulation_data WHERE question_id = ?',
          [id]
        );
        if (simulationData.length > 0) {
          const data = simulationData[0];
          question.simulation_data = {
            ...data,
            initial_state: data.initial_state ? JSON.parse(data.initial_state) : null,
            tasks: JSON.parse(data.tasks),
            validation_rules: JSON.parse(data.validation_rules),
            solution_steps: data.solution_steps ? JSON.parse(data.solution_steps) : null
          };
        }
        break;

      case 'active_screen':
        const [activeScreenData] = await promisePool.query(
          'SELECT * FROM active_screen_data WHERE question_id = ?',
          [id]
        );
        if (activeScreenData.length > 0) {
          const data = activeScreenData[0];
          question.active_screen_data = {
            ...data,
            interactive_elements: JSON.parse(data.interactive_elements),
            correct_actions: JSON.parse(data.correct_actions)
          };
        }
        break;

      case 'testlet':
        const [testletData] = await promisePool.query(
          'SELECT * FROM testlet_data WHERE question_id = ?',
          [id]
        );
        if (testletData.length > 0) {
          const data = testletData[0];
          question.testlet_data = {
            ...data,
            sub_questions: JSON.parse(data.sub_questions)
          };
        }
        break;

      case 'fill_in_blank':
        const [fillInBlankData] = await promisePool.query(
          'SELECT * FROM fill_in_blank_data WHERE question_id = ?',
          [id]
        );
        if (fillInBlankData.length > 0) {
          const data = fillInBlankData[0];
          question.fill_in_blank_data = {
            ...data,
            blanks: JSON.parse(data.blanks)
          };
        }
        break;

      case 'matching':
        const [matchingData] = await promisePool.query(
          'SELECT * FROM matching_data WHERE question_id = ?',
          [id]
        );
        if (matchingData.length > 0) {
          const data = matchingData[0];
          question.matching_data = {
            ...data,
            left_column: JSON.parse(data.left_column),
            right_column: JSON.parse(data.right_column),
            correct_matches: JSON.parse(data.correct_matches)
          };
        }
        break;

      case 'sequence_ordering':
        const [sequenceOrderingData] = await promisePool.query(
          'SELECT * FROM sequence_ordering_data WHERE question_id = ?',
          [id]
        );
        if (sequenceOrderingData.length > 0) {
          const data = sequenceOrderingData[0];
          question.sequence_ordering_data = {
            ...data,
            sequence_items: JSON.parse(data.sequence_items),
            correct_order: JSON.parse(data.correct_order)
          };
        }
        break;

      case 'drag_drop':
        const [dragDropData] = await promisePool.query(
          'SELECT * FROM drag_drop_data WHERE question_id = ?',
          [id]
        );
        if (dragDropData.length > 0) {
          const data = dragDropData[0];
          question.drag_drop_data = {
            ...data,
            drag_items: JSON.parse(data.drag_items),
            drop_zones: JSON.parse(data.drop_zones),
            correct_placements: JSON.parse(data.correct_placements)
          };
        }
        break;

      default:
        // Get traditional options for single_choice, multiple_choice, yes_no
        const [options] = await promisePool.query(
          'SELECT * FROM options WHERE question_id = ? ORDER BY order_index',
          [id]
        );
        
        question.options = options;
        break;
    }

    res.json({ question });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
};

// Create question
exports.createQuestion = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const requestData = req.body;
    const { 
      exam_id, 
      case_study_id, 
      text, 
      explanation, 
      question_type, 
      order_index, 
      options,
      hotspot_data,
      hotspot_areas,
      drag_drop_ordering_data,
      build_list_data,
      simulation_data,
      active_screen_data,
      testlet_data,
      fill_in_blank_data,
      matching_data,
      sequence_ordering_data,
      drag_drop_data
    } = requestData;

    if (!exam_id || !text || !question_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate based on question type
    const validQuestionTypes = [
      'single_choice', 'multiple_choice', 'drag_drop', 'hotspot',
      'drag_drop_ordering', 'build_list', 'simulation', 'active_screen',
      'testlet', 'fill_in_blank', 'matching', 'sequence_ordering', 'yes_no', 'case_study'
    ];
    
    if (!validQuestionTypes.includes(question_type)) {
      return res.status(400).json({ error: 'Invalid question type' });
    }

    // Type-specific validation
    switch (question_type) {
      case 'hotspot':
        if (!hotspot_data || !hotspot_areas || !Array.isArray(hotspot_areas) || hotspot_areas.length === 0) {
          return res.status(400).json({ error: 'Hotspot questions require hotspot_data and at least one hotspot_area' });
        }
        break;
        
      case 'drag_drop_ordering':
        if (!drag_drop_ordering_data || !drag_drop_ordering_data.drag_items || !drag_drop_ordering_data.drop_zones) {
          return res.status(400).json({ error: 'Drag drop ordering questions require drag_items and drop_zones' });
        }
        break;
        
      case 'build_list':
        if (!build_list_data || !build_list_data.available_items || !build_list_data.correct_list) {
          return res.status(400).json({ error: 'Build list questions require available_items and correct_list' });
        }
        break;
        
      case 'simulation':
        if (!simulation_data || !simulation_data.tasks || !simulation_data.validation_rules) {
          return res.status(400).json({ error: 'Simulation questions require tasks and validation_rules' });
        }
        break;
        
      case 'active_screen':
        if (!active_screen_data || !active_screen_data.interactive_elements || !active_screen_data.correct_actions) {
          return res.status(400).json({ error: 'Active screen questions require interactive_elements and correct_actions' });
        }
        break;
        
      case 'testlet':
        if (!testlet_data || !testlet_data.scenario_text || !testlet_data.sub_questions) {
          return res.status(400).json({ error: 'Testlet questions require scenario_text and sub_questions' });
        }
        break;
        
      case 'fill_in_blank':
        if (!fill_in_blank_data || !fill_in_blank_data.question_template || !fill_in_blank_data.blanks) {
          return res.status(400).json({ error: 'Fill in blank questions require question_template and blanks' });
        }
        break;
        
      case 'matching':
        if (!matching_data || !matching_data.left_column || !matching_data.right_column || !matching_data.correct_matches) {
          return res.status(400).json({ error: 'Matching questions require left_column, right_column, and correct_matches' });
        }
        break;
        
      case 'sequence_ordering':
        if (!sequence_ordering_data || !sequence_ordering_data.sequence_items || !sequence_ordering_data.correct_order) {
          return res.status(400).json({ error: 'Sequence ordering questions require sequence_items and correct_order' });
        }
        break;
        
      case 'drag_drop':
        if (!drag_drop_data || !drag_drop_data.drag_items || !drag_drop_data.drop_zones || !drag_drop_data.correct_placements) {
          return res.status(400).json({ error: 'Drag drop questions require drag_items, drop_zones, and correct_placements' });
        }
        break;
        
      case 'case_study':
        const { case_study_data } = req.body;
        if (!case_study_data || !case_study_data.sub_questions || !Array.isArray(case_study_data.sub_questions) || case_study_data.sub_questions.length === 0) {
          return res.status(400).json({ error: 'Case study questions require at least one sub-question' });
        }
        // Validate that we either have a case study ID or are creating a new one
        if (!case_study_data.case_study_id && !case_study_data.create_new_case_study) {
          return res.status(400).json({ error: 'Case study questions must either select an existing case study or create a new one' });
        }
        if (case_study_data.create_new_case_study && (!case_study_data.new_case_study_title || !case_study_data.new_case_study_scenario)) {
          return res.status(400).json({ error: 'New case studies require both title and scenario' });
        }
        break;
        
      default:
        // Traditional option-based questions
        if (!options || !Array.isArray(options) || options.length < 2) {
          return res.status(400).json({ error: 'At least 2 options required for traditional question types' });
        }
        break;
    }

    await connection.beginTransaction();

    // Create question
    const [result] = await connection.query(
      `INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exam_id, case_study_id || null, text, explanation || '', question_type, order_index || 0]
    );

    const questionId = result.insertId;

    // Handle different question types
    switch (question_type) {
      case 'hotspot':
        // Create hotspot data
        await connection.query(
          'INSERT INTO hotspot_data (question_id, image_url, image_width, image_height, instructions) VALUES (?, ?, ?, ?, ?)',
          [
            questionId,
            hotspot_data.image_url || null,
            hotspot_data.image_width || 800,
            hotspot_data.image_height || 600,
            hotspot_data.instructions || ''
          ]
        );

        // Create hotspot areas
        for (let i = 0; i < hotspot_areas.length; i++) {
          const area = hotspot_areas[i];
          await connection.query(
            'INSERT INTO hotspot_areas (question_id, area_type, coordinates, is_correct, label, explanation) VALUES (?, ?, ?, ?, ?, ?)',
            [
              questionId,
              area.area_type || 'rectangle',
              JSON.stringify(area.coordinates),
              area.is_correct || false,
              area.label || null,
              area.explanation || null
            ]
          );
        }
        break;

      case 'drag_drop_ordering':
        await connection.query(
          'INSERT INTO drag_drop_ordering_data (question_id, instructions, drag_items, drop_zones) VALUES (?, ?, ?, ?)',
          [
            questionId,
            drag_drop_ordering_data.instructions || '',
            JSON.stringify(drag_drop_ordering_data.drag_items),
            JSON.stringify(drag_drop_ordering_data.drop_zones)
          ]
        );
        break;

      case 'build_list':
        await connection.query(
          'INSERT INTO build_list_data (question_id, instructions, available_items, correct_list, max_items, allow_duplicates) VALUES (?, ?, ?, ?, ?, ?)',
          [
            questionId,
            build_list_data.instructions || '',
            JSON.stringify(build_list_data.available_items),
            JSON.stringify(build_list_data.correct_list),
            build_list_data.max_items || null,
            build_list_data.allow_duplicates || false
          ]
        );
        break;

      case 'simulation':
        await connection.query(
          'INSERT INTO simulation_data (question_id, instructions, simulation_type, initial_state, tasks, validation_rules, solution_steps, time_limit_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            questionId,
            simulation_data.instructions || '',
            simulation_data.simulation_type || 'general',
            simulation_data.initial_state ? JSON.stringify(simulation_data.initial_state) : null,
            JSON.stringify(simulation_data.tasks),
            JSON.stringify(simulation_data.validation_rules),
            simulation_data.solution_steps ? JSON.stringify(simulation_data.solution_steps) : null,
            simulation_data.time_limit_seconds || null
          ]
        );
        break;

      case 'active_screen':
        await connection.query(
          'INSERT INTO active_screen_data (question_id, instructions, screen_image_url, interactive_elements, correct_actions, validation_mode) VALUES (?, ?, ?, ?, ?, ?)',
          [
            questionId,
            active_screen_data.instructions || '',
            active_screen_data.screen_image_url || null,
            JSON.stringify(active_screen_data.interactive_elements),
            JSON.stringify(active_screen_data.correct_actions),
            active_screen_data.validation_mode || 'exact_sequence'
          ]
        );
        break;

      case 'testlet':
        await connection.query(
          'INSERT INTO testlet_data (question_id, scenario_text, sub_questions) VALUES (?, ?, ?)',
          [
            questionId,
            testlet_data.scenario_text,
            JSON.stringify(testlet_data.sub_questions)
          ]
        );
        break;

      case 'fill_in_blank':
        await connection.query(
          'INSERT INTO fill_in_blank_data (question_id, question_template, blanks, case_sensitive, partial_credit) VALUES (?, ?, ?, ?, ?)',
          [
            questionId,
            fill_in_blank_data.question_template,
            JSON.stringify(fill_in_blank_data.blanks),
            fill_in_blank_data.case_sensitive || false,
            fill_in_blank_data.partial_credit !== undefined ? fill_in_blank_data.partial_credit : true
          ]
        );
        break;

      case 'matching':
        await connection.query(
          'INSERT INTO matching_data (question_id, instructions, left_column, right_column, correct_matches, allow_multiple_matches) VALUES (?, ?, ?, ?, ?, ?)',
          [
            questionId,
            matching_data.instructions || '',
            JSON.stringify(matching_data.left_column),
            JSON.stringify(matching_data.right_column),
            JSON.stringify(matching_data.correct_matches),
            matching_data.allow_multiple_matches || false
          ]
        );
        break;

      case 'sequence_ordering':
        await connection.query(
          'INSERT INTO sequence_ordering_data (question_id, instructions, sequence_items, correct_order) VALUES (?, ?, ?, ?)',
          [
            questionId,
            sequence_ordering_data.instructions || '',
            JSON.stringify(sequence_ordering_data.sequence_items),
            JSON.stringify(sequence_ordering_data.correct_order)
          ]
        );
        break;

      case 'drag_drop':
        await connection.query(
          'INSERT INTO drag_drop_data (question_id, instructions, drag_items, drop_zones, correct_placements) VALUES (?, ?, ?, ?, ?)',
          [
            questionId,
            drag_drop_data.instructions || '',
            JSON.stringify(drag_drop_data.drag_items),
            JSON.stringify(drag_drop_data.drop_zones),
            JSON.stringify(drag_drop_data.correct_placements)
          ]
        );
        break;

      case 'case_study':
        const { case_study_data } = req.body;
        let actualCaseStudyId = case_study_data.case_study_id;
        
        // Create new case study if requested
        if (case_study_data.create_new_case_study) {
          const [caseStudyResult] = await connection.query(
            'INSERT INTO case_studies (exam_id, title, scenario_text, order_index) VALUES (?, ?, ?, ?)',
            [exam_id, case_study_data.new_case_study_title, case_study_data.new_case_study_scenario, 0]
          );
          actualCaseStudyId = caseStudyResult.insertId;
        }
        
        // Create each sub-question as a separate question linked to the case study
        const createdQuestions = [];
        for (let i = 0; i < case_study_data.sub_questions.length; i++) {
          const subQuestion = case_study_data.sub_questions[i];
          
          // Create the sub-question
          const [subQuestionResult] = await connection.query(
            'INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
            [exam_id, actualCaseStudyId, subQuestion.text, subQuestion.explanation || '', subQuestion.question_type, order_index + i]
          );
          
          const subQuestionId = subQuestionResult.insertId;
          
          // Create options for the sub-question
          if (subQuestion.options && Array.isArray(subQuestion.options)) {
            for (let j = 0; j < subQuestion.options.length; j++) {
              const opt = subQuestion.options[j];
              await connection.query(
                'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
                [subQuestionId, opt.text, opt.is_correct || false, opt.order_index || j + 1]
              );
            }
          }
          
          createdQuestions.push(subQuestionId);
        }
        
        // Update the main question to reference the case study
        await connection.query(
          'UPDATE questions SET case_study_id = ? WHERE id = ?',
          [actualCaseStudyId, questionId]
        );
        
        break;

      default:
        // Create traditional options for single_choice, multiple_choice, yes_no
        if (options && Array.isArray(options)) {
          for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            await connection.query(
              'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
              [questionId, opt.text, opt.is_correct || false, opt.order_index || i + 1]
            );
          }
        }
        break;
    }

    // Update exam total_questions count
    await connection.query(
      'UPDATE exams SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = ?) WHERE id = ?',
      [exam_id, exam_id]
    );

    await connection.commit();

    // Fetch created question with options
    const [question] = await connection.query(
      'SELECT * FROM questions WHERE id = ?',
      [questionId]
    );

    const [questionOptions] = await connection.query(
      'SELECT * FROM options WHERE question_id = ? ORDER BY order_index',
      [questionId]
    );

    question[0].options = questionOptions;

    res.status(201).json({ question: question[0] });
  } catch (error) {
    await connection.rollback();
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  } finally {
    connection.release();
  }
};

// Update question
exports.updateQuestion = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const { id } = req.params;
    const requestData = req.body;
    const { 
      text, 
      explanation, 
      question_type, 
      order_index, 
      case_study_id, 
      options,
      hotspot_data,
      hotspot_areas,
      drag_drop_ordering_data,
      build_list_data,
      simulation_data,
      active_screen_data,
      testlet_data,
      fill_in_blank_data,
      matching_data,
      sequence_ordering_data,
      drag_drop_data
    } = requestData;

    await connection.beginTransaction();

    // Update question
    await connection.query(
      `UPDATE questions 
       SET text = ?, explanation = ?, question_type = ?, order_index = ?, case_study_id = ?
       WHERE id = ?`,
      [text, explanation, question_type, order_index, case_study_id || null, id]
    );

    // Delete all type-specific data first (CASCADE will handle this for most tables)
    await connection.query('DELETE FROM options WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM hotspot_data WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM hotspot_areas WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM drag_drop_ordering_data WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM build_list_data WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM simulation_data WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM active_screen_data WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM testlet_data WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM fill_in_blank_data WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM matching_data WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM sequence_ordering_data WHERE question_id = ?', [id]);
    await connection.query('DELETE FROM drag_drop_data WHERE question_id = ?', [id]);

    // Insert new type-specific data based on question type
    switch (question_type) {
      case 'hotspot':
        if (hotspot_data) {
          await connection.query(
            'INSERT INTO hotspot_data (question_id, image_url, image_width, image_height, instructions) VALUES (?, ?, ?, ?, ?)',
            [
              id,
              hotspot_data.image_url || null,
              hotspot_data.image_width || 800,
              hotspot_data.image_height || 600,
              hotspot_data.instructions || ''
            ]
          );
        }
        if (hotspot_areas && Array.isArray(hotspot_areas)) {
          for (let i = 0; i < hotspot_areas.length; i++) {
            const area = hotspot_areas[i];
            await connection.query(
              'INSERT INTO hotspot_areas (question_id, area_type, coordinates, is_correct, label, explanation) VALUES (?, ?, ?, ?, ?, ?)',
              [
                id,
                area.area_type || 'rectangle',
                JSON.stringify(area.coordinates),
                area.is_correct || false,
                area.label || null,
                area.explanation || null
              ]
            );
          }
        }
        break;

      case 'drag_drop_ordering':
        if (drag_drop_ordering_data) {
          await connection.query(
            'INSERT INTO drag_drop_ordering_data (question_id, instructions, drag_items, drop_zones) VALUES (?, ?, ?, ?)',
            [
              id,
              drag_drop_ordering_data.instructions || '',
              JSON.stringify(drag_drop_ordering_data.drag_items),
              JSON.stringify(drag_drop_ordering_data.drop_zones)
            ]
          );
        }
        break;

      case 'build_list':
        if (build_list_data) {
          await connection.query(
            'INSERT INTO build_list_data (question_id, instructions, available_items, correct_list, max_items, allow_duplicates) VALUES (?, ?, ?, ?, ?, ?)',
            [
              id,
              build_list_data.instructions || '',
              JSON.stringify(build_list_data.available_items),
              JSON.stringify(build_list_data.correct_list),
              build_list_data.max_items || null,
              build_list_data.allow_duplicates || false
            ]
          );
        }
        break;

      case 'simulation':
        if (simulation_data) {
          await connection.query(
            'INSERT INTO simulation_data (question_id, instructions, simulation_type, initial_state, tasks, validation_rules, solution_steps, time_limit_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              id,
              simulation_data.instructions || '',
              simulation_data.simulation_type || 'general',
              simulation_data.initial_state ? JSON.stringify(simulation_data.initial_state) : null,
              JSON.stringify(simulation_data.tasks),
              JSON.stringify(simulation_data.validation_rules),
              simulation_data.solution_steps ? JSON.stringify(simulation_data.solution_steps) : null,
              simulation_data.time_limit_seconds || null
            ]
          );
        }
        break;

      case 'active_screen':
        if (active_screen_data) {
          await connection.query(
            'INSERT INTO active_screen_data (question_id, instructions, screen_image_url, interactive_elements, correct_actions, validation_mode) VALUES (?, ?, ?, ?, ?, ?)',
            [
              id,
              active_screen_data.instructions || '',
              active_screen_data.screen_image_url || null,
              JSON.stringify(active_screen_data.interactive_elements),
              JSON.stringify(active_screen_data.correct_actions),
              active_screen_data.validation_mode || 'exact_sequence'
            ]
          );
        }
        break;

      case 'testlet':
        if (testlet_data) {
          await connection.query(
            'INSERT INTO testlet_data (question_id, scenario_text, sub_questions) VALUES (?, ?, ?)',
            [
              id,
              testlet_data.scenario_text,
              JSON.stringify(testlet_data.sub_questions)
            ]
          );
        }
        break;

      case 'fill_in_blank':
        if (fill_in_blank_data) {
          await connection.query(
            'INSERT INTO fill_in_blank_data (question_id, question_template, blanks, case_sensitive, partial_credit) VALUES (?, ?, ?, ?, ?)',
            [
              id,
              fill_in_blank_data.question_template,
              JSON.stringify(fill_in_blank_data.blanks),
              fill_in_blank_data.case_sensitive || false,
              fill_in_blank_data.partial_credit !== undefined ? fill_in_blank_data.partial_credit : true
            ]
          );
        }
        break;

      case 'matching':
        if (matching_data) {
          await connection.query(
            'INSERT INTO matching_data (question_id, instructions, left_column, right_column, correct_matches, allow_multiple_matches) VALUES (?, ?, ?, ?, ?, ?)',
            [
              id,
              matching_data.instructions || '',
              JSON.stringify(matching_data.left_column),
              JSON.stringify(matching_data.right_column),
              JSON.stringify(matching_data.correct_matches),
              matching_data.allow_multiple_matches || false
            ]
          );
        }
        break;

      case 'sequence_ordering':
        if (sequence_ordering_data) {
          await connection.query(
            'INSERT INTO sequence_ordering_data (question_id, instructions, sequence_items, correct_order) VALUES (?, ?, ?, ?)',
            [
              id,
              sequence_ordering_data.instructions || '',
              JSON.stringify(sequence_ordering_data.sequence_items),
              JSON.stringify(sequence_ordering_data.correct_order)
            ]
          );
        }
        break;

      case 'drag_drop':
        if (drag_drop_data) {
          await connection.query(
            'INSERT INTO drag_drop_data (question_id, instructions, drag_items, drop_zones, correct_placements) VALUES (?, ?, ?, ?, ?)',
            [
              id,
              drag_drop_data.instructions || '',
              JSON.stringify(drag_drop_data.drag_items),
              JSON.stringify(drag_drop_data.drop_zones),
              JSON.stringify(drag_drop_data.correct_placements)
            ]
          );
        }
        break;

      default:
        // Insert traditional options for single_choice, multiple_choice, yes_no
        if (options && Array.isArray(options)) {
          for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            await connection.query(
              'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
              [id, opt.text, opt.is_correct || false, opt.order_index || i + 1]
            );
          }
        }
        break;
    }

    await connection.commit();

    // Fetch updated question
    const [question] = await connection.query(
      'SELECT * FROM questions WHERE id = ?',
      [id]
    );

    const [questionOptions] = await connection.query(
      'SELECT * FROM options WHERE question_id = ? ORDER BY order_index',
      [id]
    );

    question[0].options = questionOptions;

    res.json({ question: question[0] });
  } catch (error) {
    await connection.rollback();
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  } finally {
    connection.release();
  }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Get exam_id before deleting
    const [questions] = await connection.query(
      'SELECT exam_id FROM questions WHERE id = ?',
      [id]
    );

    if (questions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Question not found' });
    }

    const examId = questions[0].exam_id;

    // Delete question (cascade will delete options)
    await connection.query('DELETE FROM questions WHERE id = ?', [id]);

    // Update exam total_questions count
    await connection.query(
      'UPDATE exams SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = ?) WHERE id = ?',
      [examId, examId]
    );

    await connection.commit();

    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  } finally {
    connection.release();
  }
};

// ==================== OPTION MANAGEMENT ====================

// Create option
exports.createOption = async (req, res) => {
  try {
    const { question_id, text, is_correct, order_index } = req.body;

    if (!question_id || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await promisePool.query(
      'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
      [question_id, text, is_correct || false, order_index || 0]
    );

    const [option] = await promisePool.query(
      'SELECT * FROM options WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ option: option[0] });
  } catch (error) {
    console.error('Create option error:', error);
    res.status(500).json({ error: 'Failed to create option' });
  }
};

// Update option
exports.updateOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, is_correct, order_index } = req.body;

    await promisePool.query(
      'UPDATE options SET text = ?, is_correct = ?, order_index = ? WHERE id = ?',
      [text, is_correct, order_index, id]
    );

    const [option] = await promisePool.query(
      'SELECT * FROM options WHERE id = ?',
      [id]
    );

    res.json({ option: option[0] });
  } catch (error) {
    console.error('Update option error:', error);
    res.status(500).json({ error: 'Failed to update option' });
  }
};

// Delete option
exports.deleteOption = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM options WHERE id = ?', [id]);

    res.json({ success: true, message: 'Option deleted successfully' });
  } catch (error) {
    console.error('Delete option error:', error);
    res.status(500).json({ error: 'Failed to delete option' });
  }
};

// ==================== BULK IMPORT ====================

// JSON bulk import (no file upload) — accepts { exam_id | exam_code, questions: [{ text, question_type?, explanation?, order_index? , case_study_title? }] }
exports.bulkImportQuestionsJson = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    let { exam_id, exam_code, questions } = req.body || {};

    if (!exam_id && exam_code) {
      const [rows] = await connection.query('SELECT id FROM exams WHERE code = ? LIMIT 1', [exam_code]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Exam not found for provided exam_code' });
      }
      exam_id = rows[0].id;
    }

    if (!exam_id) {
      return res.status(400).json({ error: 'exam_id or exam_code is required' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions array is required' });
    }

    await connection.beginTransaction();

    const importSummary = {
      processed_rows: questions.length,
      imported_rows: 0,
      skipped_rows: 0,
      errors: []
    };

    // Minimal placeholder import: just create question rows; options/type-specific data can be added later via admin UI.
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i] || {};
      const text = (q.text || q.question_text || '').toString().trim();
      if (!text) {
        importSummary.skipped_rows++;
        importSummary.errors.push({ index: i, error: 'Question text is required' });
        continue;
      }
      const question_type = (q.question_type || 'single_choice').toString().trim();
      const explanation = (q.explanation || '').toString();
      const order_index = Number.isFinite(q.order_index) ? q.order_index : (i + 1);

      try {
        await connection.query(
          'INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [exam_id, null, text, explanation, question_type, order_index]
        );
        importSummary.imported_rows++;
      } catch (e) {
        importSummary.skipped_rows++;
        importSummary.errors.push({ index: i, error: e.message });
      }
    }

    // Update exam total_questions count
    await connection.query(
      'UPDATE exams SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = ?) WHERE id = ?',[exam_id, exam_id]
    );

    await connection.commit();
    res.json({ success: importSummary.imported_rows > 0, ...importSummary });
  } catch (error) {
    await connection.rollback();
    console.error('Bulk JSON import error:', error);
    res.status(500).json({ error: 'Failed to import questions: ' + error.message });
  } finally {
    connection.release();
  }
};

// Helpers for bulk import
const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'y'].includes(normalized);
  }
  return false;
};

const coerceNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const readSpreadsheet = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0]; // Only first sheet is considered
  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) {
      return;
    }

    const rowData = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const headerCell = worksheet.getRow(1).getCell(colNumber);
      const header = headerCell && headerCell.value ? headerCell.value.toString().trim() : `Column_${colNumber}`;
      rowData[header] = cell.value;
    });
    rows.push(rowData);
  });

  return rows;
};

const mapQuestionRow = (row, columnMap) => {
  const getValue = (key) => {
    const columnKey = columnMap[key];
    if (!columnKey) return undefined;
    return row[columnKey];
  };

  const text = getValue('question_text');
  const questionType = (getValue('question_type') || 'multiple_choice').toString().trim();
  const explanation = getValue('explanation') || '';
  const orderIndex = coerceNumber(getValue('order_index'), 0);
  const caseStudyTitle = getValue('case_study_title');
  const caseStudyScenario = getValue('case_study_scenario');
  
  // Handle hotspot questions
  const hotspotImageUrl = getValue('hotspot_image_url');
  const hotspotInstructions = getValue('hotspot_instructions');
  const hotspotAreasText = getValue('hotspot_areas');

  const options = [];
  const correctOptions = new Set();
  let hotspotData = null;
  let hotspotAreas = [];

  // Process hotspot data if this is a hotspot question
  if (questionType.toLowerCase() === 'hotspot') {
    if (hotspotImageUrl && hotspotImageUrl.toString().trim()) {
      hotspotData = {
        image_url: hotspotImageUrl.toString().trim(),
        instructions: hotspotInstructions ? hotspotInstructions.toString().trim() : ''
      };
    }
    
    if (hotspotAreasText && hotspotAreasText.toString().trim()) {
      try {
        hotspotAreas = JSON.parse(hotspotAreasText.toString().trim());
      } catch (error) {
        console.warn('Invalid hotspot areas JSON:', error.message);
      }
    }
  } else {
    // Process traditional options for non-hotspot questions
    const optionColumns = columnMap.question_options || [];
    const correctColumns = columnMap.correct_options || [];

    optionColumns.forEach((columnKey, index) => {
    const textValue = row[columnKey];
    if (textValue && textValue.toString().trim().length > 0) {
      const optionOrder = index + 1;
      options.push({
        text: textValue.toString(),
        is_correct: false,
        order_index: optionOrder,
      });
    }
  });

  correctColumns.forEach((columnKey) => {
    const value = row[columnKey];
    if (value === undefined || value === null) {
      return;
    }

    if (columnMap.correct_mode === 'index') {
      // Expecting numbers representing option positions (1-based)
      const numeric = coerceNumber(value);
      if (numeric && numeric >= 1) {
        correctOptions.add(numeric);
      }
    } else if (columnMap.correct_mode === 'text') {
      // Matching by option text value
      const normalized = value.toString().trim().toLowerCase();
      columnMap.question_options.forEach((optionColumn, optionIndex) => {
        const optionValue = row[optionColumn];
        if (optionValue && optionValue.toString().trim().toLowerCase() === normalized) {
          correctOptions.add(optionIndex + 1);
        }
      });
    } else {
      // Boolean columns referencing options (true/false per option)
      const optionIndex = columnMap.question_options.findIndex((optionColumn) => optionColumn === columnKey);
      if (optionIndex !== -1 && normalizeBoolean(value)) {
        correctOptions.add(optionIndex + 1);
      }
    }
  });

    options.forEach((option) => {
      if (correctOptions.has(option.order_index)) {
        option.is_correct = true;
      }
    });
  } // End of non-hotspot processing

  return {
    text,
    question_type: questionType,
    explanation: explanation ? explanation.toString() : '',
    order_index: orderIndex || 0,
    case_study_title: caseStudyTitle ? caseStudyTitle.toString().trim() : null,
    case_study_scenario: caseStudyScenario ? caseStudyScenario.toString() : null,
    options,
    hotspot_data: hotspotData,
    hotspot_areas: hotspotAreas,
  };
};

const validateMappedQuestion = (question) => {
  const errors = [];

  if (!question.text || question.text.toString().trim().length === 0) {
    errors.push('Question text is required');
  }

  // Normalize question types
  const normalizedType = question.question_type.toLowerCase();
  if (!['single_choice', 'multiple_choice', 'hotspot'].includes(normalizedType)) {
    errors.push('Question type must be single_choice, multiple_choice, or hotspot');
  }

  if (normalizedType === 'hotspot') {
    if (!question.hotspot_data || !question.hotspot_data.image_url) {
      errors.push('Hotspot questions require an image URL');
    }
    if (!question.hotspot_areas || question.hotspot_areas.length === 0) {
      errors.push('Hotspot questions require at least one clickable area');
    }
  } else {
    if (!question.options || question.options.length < 2) {
      errors.push('Multiple choice questions require at least two options');
    }
  }

  const correctCount = question.options.filter((opt) => opt.is_correct).length;
  if (correctCount === 0) {
    errors.push('At least one option must be marked as correct');
  }

  if (question.question_type === 'single_choice' && correctCount > 1) {
    errors.push('Single choice questions must have exactly one correct answer');
  }

  return errors;
};

// Bulk import questions from spreadsheet/CSV/JSON with column mapping
exports.bulkImportQuestions = async (req, res) => {
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

    console.log('File upload details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    });

    if (!exam_id) {
      return res.status(400).json({ error: 'exam_id required' });
    }

    let columnMap = null;
    try {
      columnMap = serializedMap ? JSON.parse(serializedMap) : null;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid column_map JSON. Ensure the mapping is serialized correctly.' });
    }

    if (!columnMap || !columnMap.question_text) {
      return res.status(400).json({ error: 'Column mapping must include question_text' });
    }

    if (!Array.isArray(columnMap.question_options) || columnMap.question_options.length < 2) {
      return res.status(400).json({ error: 'At least two option columns must be mapped' });
    }

    if (!Array.isArray(columnMap.correct_options) || columnMap.correct_options.length === 0) {
      return res.status(400).json({ error: 'At least one correct option column must be mapped' });
    }

    // Check if exam exists
    const [exams] = await connection.query(
      'SELECT id FROM exams WHERE id = ?',
      [exam_id]
    );

    if (exams.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

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
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.toLowerCase().endsWith('.xlsx')
    ) {
      rows = await readSpreadsheet(file.path);
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Unsupported file type. Use XLSX, CSV, or JSON' });
    }

    if (!rows || rows.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'No data rows found in uploaded file' });
    }

    await connection.beginTransaction();

    const caseStudyCache = new Map();
    const getCaseStudyId = async (title, scenarioText) => {
      if (!title || title.trim().length === 0) {
        return null;
      }

      const cacheKey = title.trim().toLowerCase();
      if (caseStudyCache.has(cacheKey)) {
        return caseStudyCache.get(cacheKey);
      }

      // Try to find existing case study by title
      const [existing] = await connection.query(
        'SELECT id FROM case_studies WHERE exam_id = ? AND LOWER(title) = LOWER(?) LIMIT 1',
        [exam_id, title.trim()]
      );

      if (existing.length > 0) {
        const caseStudyId = existing[0].id;
        caseStudyCache.set(cacheKey, caseStudyId);
        return caseStudyId;
      }

      if (!normalizeBoolean(create_missing_case_studies) || case_study_mode === 'link') {
        // Linking only; do not create new case study
        return null;
      }

      // Create new case study
      const [result] = await connection.query(
        'INSERT INTO case_studies (exam_id, title, scenario_text, order_index) VALUES (?, ?, ?, ?)',
        [exam_id, title.trim(), scenarioText || '', 0]
      );

      const newId = result.insertId;
      caseStudyCache.set(cacheKey, newId);
      return newId;
    };

    const importSummary = {
      total_rows: rows.length,
      imported_count: 0,
      skipped_count: 0,
      errors: [],
      warnings: [],
    };

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      try {
        const question = mapQuestionRow(row, columnMap);
        const validationErrors = validateMappedQuestion(question);

        if (validationErrors.length > 0) {
          importSummary.skipped_count += 1;
          importSummary.errors.push({
            row: index + 2, // account for header row in spreadsheet
            errors: validationErrors,
          });
          continue;
        }

        const caseStudyId = await getCaseStudyId(question.case_study_title, question.case_study_scenario);

        const [questionResult] = await connection.query(
          `INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            exam_id,
            caseStudyId,
            question.text,
            question.explanation,
            question.question_type,
            question.order_index,
          ]
        );

        const questionId = questionResult.insertId;

        // Handle different question types
        if (question.question_type.toLowerCase() === 'hotspot') {
          // Create hotspot data
          if (question.hotspot_data) {
            await connection.query(
              'INSERT INTO hotspot_data (question_id, image_url, instructions) VALUES (?, ?, ?)',
              [
                questionId,
                question.hotspot_data.image_url,
                question.hotspot_data.instructions || ''
              ]
            );
          }
          
          // Create hotspot areas
          if (question.hotspot_areas && question.hotspot_areas.length > 0) {
            for (let areaIndex = 0; areaIndex < question.hotspot_areas.length; areaIndex += 1) {
              const area = question.hotspot_areas[areaIndex];
              await connection.query(
                'INSERT INTO hotspot_areas (question_id, area_type, coordinates, is_correct, label, explanation) VALUES (?, ?, ?, ?, ?, ?)',
                [
                  questionId,
                  area.area_type || 'rectangle',
                  JSON.stringify(area.coordinates),
                  area.is_correct ? 1 : 0,
                  area.label || null,
                  area.explanation || null
                ]
              );
            }
          }
        } else {
          // Create traditional options
          for (let optIndex = 0; optIndex < question.options.length; optIndex += 1) {
            const option = question.options[optIndex];
            await connection.query(
              'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
              [questionId, option.text, option.is_correct ? 1 : 0, option.order_index || optIndex + 1]
            );
          }
        }

        importSummary.imported_count += 1;
      } catch (rowError) {
        importSummary.skipped_count += 1;
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

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: importSummary.imported_count > 0,
      ...importSummary,
      message: `Imported ${importSummary.imported_count} questions. Skipped ${importSummary.skipped_count}.`,
    });
  } catch (error) {
    await connection.rollback();

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import questions: ' + error.message });
  } finally {
    connection.release();
  }
};

// ==================== USER MANAGEMENT ====================

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await promisePool.query(
      `SELECT 
        u.id, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM attempts WHERE user_id = u.id AND completed = TRUE) as attempt_count,
        (SELECT AVG(score) FROM attempts WHERE user_id = u.id AND completed = TRUE) as avg_score
       FROM users u
       ORDER BY u.created_at DESC`
    );

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    await promisePool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    const [user] = await promisePool.query(
      'SELECT id, email, role FROM users WHERE id = ?',
      [userId]
    );

    res.json({ user: user[0] });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// ==================== STATISTICS ====================

// Get admin statistics
exports.getAdminStats = async (req, res) => {
  try {
    // Total users
    const [totalUsers] = await promisePool.query(
      'SELECT COUNT(*) as count FROM users'
    );

    // Total exams
    const [totalExams] = await promisePool.query(
      'SELECT COUNT(*) as count FROM exams'
    );

    // Total questions
    const [totalQuestions] = await promisePool.query(
      'SELECT COUNT(*) as count FROM questions'
    );

    // Total attempts
    const [totalAttempts] = await promisePool.query(
      'SELECT COUNT(*) as count FROM attempts WHERE completed = TRUE'
    );

    // Recent attempts
    const [recentAttempts] = await promisePool.query(
      `SELECT 
        a.id, a.score, a.start_time,
        u.email as user_email,
        e.code as exam_code
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       JOIN exams e ON a.exam_id = e.id
       WHERE a.completed = TRUE
       ORDER BY a.start_time DESC
       LIMIT 10`
    );

    res.json({
      total_users: totalUsers[0].count,
      total_exams: totalExams[0].count,
      total_questions: totalQuestions[0].count,
      total_attempts: totalAttempts[0].count,
      recent_attempts: recentAttempts
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};