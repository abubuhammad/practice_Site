const { promisePool } = require('../config/database');

// Helper function to shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to select and shuffle questions for an attempt
async function selectQuestionsForAttempt(connection, examId, attemptId) {
  try {
    // Get all available questions for the exam (include type for option shuffling decisions)
    const [allQuestions] = await connection.query(
      'SELECT id, question_type FROM questions WHERE exam_id = ?',
      [examId]
    );
    
    if (allQuestions.length === 0) {
      throw new Error('No questions found for this exam');
    }
    
    console.log(`📊 Found ${allQuestions.length} total questions for exam ${examId}`);
    
    // Determine random number of questions between 40 and 60 (inclusive), capped by availability
    const lower = Math.min(40, allQuestions.length);
    const upper = Math.min(60, allQuestions.length);
    const targetCount = Math.floor(Math.random() * (upper - lower + 1)) + lower;
    
    // Shuffle all questions
    const shuffledQuestions = shuffleArray(allQuestions);
    
    // Select targetCount questions
    const selectedQuestions = shuffledQuestions.slice(0, targetCount);
    
    console.log(`🎲 Selected ${selectedQuestions.length} questions for attempt ${attemptId}`);
    
    // For each selected question, compute a shuffled options order (for non-hotspot types) and save
    for (let i = 0; i < selectedQuestions.length; i++) {
      const q = selectedQuestions[i];
      let optionsOrder = null;
      
      if (q.question_type !== 'hotspot') {
        // Get option IDs in canonical order, then shuffle deterministically for this attempt
        const [optionRows] = await connection.query(
          'SELECT id FROM options WHERE question_id = ? ORDER BY order_index',
          [q.id]
        );
        const optionIds = optionRows.map(o => o.id);
        optionsOrder = JSON.stringify(shuffleArray(optionIds));
      }
      
      // Insert with stored options order
      await connection.query(
        'INSERT INTO attempt_questions (attempt_id, question_id, question_order, options_order) VALUES (?, ?, ?, ?)',
        [attemptId, q.id, i + 1, optionsOrder]
      );
    }
    
    return selectedQuestions.length;
  } catch (error) {
    console.error('Error selecting questions for attempt:', error);
    throw error;
  }
}

// Get all exams
exports.getAllExams = async (req, res) => {
  try {
    const { path } = req.query;

    let query = 'SELECT id, code, title, description, path, time_limit_minutes, passing_score, total_questions FROM exams';
    const params = [];

    if (path) {
      query += ' WHERE path = ?';
      params.push(path);
    }

    query += ' ORDER BY code';

    const [exams] = await promisePool.query(query, params);

    res.json({ exams });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
};

// Get exam details
exports.getExamDetails = async (req, res) => {
  try {
    const { examId } = req.params;

    // Get exam
    const [exams] = await promisePool.query(
      'SELECT * FROM exams WHERE id = ?',
      [examId]
    );

    if (exams.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = exams[0];

    // Get case studies for this exam
    const [caseStudies] = await promisePool.query(
      'SELECT id, title, scenario_text, order_index FROM case_studies WHERE exam_id = ? ORDER BY order_index',
      [examId]
    );

    res.json({
      exam,
      case_studies: caseStudies
    });
  } catch (error) {
    console.error('Get exam details error:', error);
    res.status(500).json({ error: 'Failed to fetch exam details' });
  }
};

// Start new exam attempt
exports.startExam = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    await connection.beginTransaction();

    // Check if exam exists
    const [exams] = await connection.query(
      'SELECT id, time_limit_minutes FROM exams WHERE id = ?',
      [examId]
    );

    if (exams.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = exams[0];

    // Create new attempt
    const [attemptResult] = await connection.query(
      'INSERT INTO attempts (user_id, exam_id, start_time, completed) VALUES (?, ?, NOW(), FALSE)',
      [userId, examId]
    );

    const attemptId = attemptResult.insertId;

    // Select and shuffle questions for this attempt (random 40-60 or capped by availability)
    await selectQuestionsForAttempt(connection, examId, attemptId);

    // Get the shuffled questions for this attempt with their details
    const [questions] = await connection.query(
      `SELECT 
        q.id,
        q.text,
        q.question_type,
        aq.question_order,
        aq.options_order,
        q.case_study_id,
        cs.title as case_study_title,
        cs.scenario_text as case_study_scenario
      FROM attempt_questions aq
      JOIN questions q ON aq.question_id = q.id
      LEFT JOIN case_studies cs ON q.case_study_id = cs.id
      WHERE aq.attempt_id = ?
      ORDER BY aq.question_order`,
      [attemptId]
    );

    // Get options/data for each question based on question type
    for (let question of questions) {
      if (question.question_type === 'hotspot') {
        // Get hotspot data
        const [hotspotData] = await connection.query(
          'SELECT image_url, image_width, image_height, instructions FROM hotspot_data WHERE question_id = ?',
          [question.id]
        );
        
        // Get hotspot areas (hide is_correct field for exam)
        const [hotspotAreas] = await connection.query(
          'SELECT id, area_type, coordinates, label FROM hotspot_areas WHERE question_id = ? ORDER BY id',
          [question.id]
        );
        
        // Parse coordinates JSON
        const areas = hotspotAreas.map(area => ({
          ...area,
          coordinates: JSON.parse(area.coordinates)
        }));
        
        question.hotspot_data = hotspotData[0] || null;
        question.hotspot_areas = areas;
      } else {
        // Get traditional options (hide is_correct field)
        const [options] = await connection.query(
          'SELECT id, text, order_index FROM options WHERE question_id = ? ORDER BY order_index',
          [question.id]
        );
        // If options_order is stored for this attempt, enforce that order for consistency
        if (question.options_order) {
          const order = JSON.parse(question.options_order);
          const optionMap = new Map(options.map(o => [o.id, o]));
          question.options = order
            .map(id => optionMap.get(id))
            .filter(Boolean);
        } else {
          // Fallback: shuffle options at runtime
          question.options = shuffleArray(options);
        }
      }

      // Group case study info
      if (question.case_study_id) {
        question.case_study = {
          id: question.case_study_id,
          title: question.case_study_title,
          scenario_text: question.case_study_scenario
        };
        delete question.case_study_id;
        delete question.case_study_title;
        delete question.case_study_scenario;
      }
    }

    await connection.commit();

    console.log(`🎯 Started exam ${examId} for user ${userId} with ${questions.length} questions`);

    res.json({
      attempt: {
        id: attemptId,
        time_limit_minutes: exam.time_limit_minutes,
        total_questions: questions.length
      },
      questions
    });
  } catch (error) {
    await connection.rollback();
    console.error('Start exam error:', error);
    res.status(500).json({ error: 'Failed to start exam' });
  } finally {
    connection.release();
  }
};

// Get exam questions for an existing attempt
exports.getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    const { attempt_id } = req.query;
    const userId = req.user.id;

    // Verify the attempt belongs to the user
    const [attempts] = await promisePool.query(
      'SELECT id FROM attempts WHERE id = ? AND user_id = ? AND exam_id = ?',
      [attempt_id, userId, examId]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Get the shuffled questions for this specific attempt
    const [questions] = await promisePool.query(
      `SELECT 
        q.id,
        q.text,
        q.question_type,
        aq.question_order,
        aq.options_order,
        q.case_study_id,
        cs.title as case_study_title,
        cs.scenario_text as case_study_scenario
      FROM attempt_questions aq
      JOIN questions q ON aq.question_id = q.id
      LEFT JOIN case_studies cs ON q.case_study_id = cs.id
      WHERE aq.attempt_id = ?
      ORDER BY aq.question_order`,
      [attempt_id]
    );

    // Get options/data for each question based on question type
    for (let question of questions) {
      if (question.question_type === 'hotspot') {
        // Get hotspot data
        const [hotspotData] = await promisePool.query(
          'SELECT image_url, image_width, image_height, instructions FROM hotspot_data WHERE question_id = ?',
          [question.id]
        );
        
        // Get hotspot areas (hide is_correct field for exam)
        const [hotspotAreas] = await promisePool.query(
          'SELECT id, area_type, coordinates, label FROM hotspot_areas WHERE question_id = ? ORDER BY id',
          [question.id]
        );
        
        // Parse coordinates JSON
        const areas = hotspotAreas.map(area => ({
          ...area,
          coordinates: JSON.parse(area.coordinates)
        }));
        
        question.hotspot_data = hotspotData[0] || null;
        question.hotspot_areas = areas;
      } else {
        // Get traditional options (hide is_correct field)
        const [options] = await promisePool.query(
          'SELECT id, text, order_index FROM options WHERE question_id = ? ORDER BY order_index',
          [question.id]
        );
        if (question.options_order) {
          const order = JSON.parse(question.options_order);
          const optionMap = new Map(options.map(o => [o.id, o]));
          question.options = order
            .map(id => optionMap.get(id))
            .filter(Boolean);
        } else {
          question.options = shuffleArray(options);
        }
      }

      // Group case study info
      if (question.case_study_id) {
        question.case_study = {
          id: question.case_study_id,
          title: question.case_study_title,
          scenario_text: question.case_study_scenario
        };
        delete question.case_study_id;
        delete question.case_study_title;
        delete question.case_study_scenario;
      }
    }

    console.log(`📖 Retrieved ${questions.length} questions for attempt ${attempt_id}`);

    res.json({ questions });
  } catch (error) {
    console.error('Get exam questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};
