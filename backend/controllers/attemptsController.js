const { promisePool } = require('../config/database');

// Verify user owns the attempt
const verifyAttemptOwnership = async (attemptId, userId) => {
  const [attempts] = await promisePool.query(
    'SELECT user_id, completed FROM attempts WHERE id = ?',
    [attemptId]
  );

  if (attempts.length === 0) {
    return { valid: false, error: 'Attempt not found' };
  }

  if (attempts[0].user_id !== userId) {
    return { valid: false, error: 'Unauthorized access to attempt' };
  }

  if (attempts[0].completed) {
    return { valid: false, error: 'Attempt already completed' };
  }

  return { valid: true };
};

// Save or update answer
exports.saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { question_id, selected_option_ids, answer_data, marked_for_review } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const verification = await verifyAttemptOwnership(attemptId, userId);
    if (!verification.valid) {
      return res.status(403).json({ error: verification.error });
    }

    // Validate that at least one answer format is provided
    if (!selected_option_ids && !answer_data) {
      return res.status(400).json({ error: 'Either selected_option_ids or answer_data must be provided' });
    }

    // Validate selected_option_ids is an array if provided
    if (selected_option_ids && !Array.isArray(selected_option_ids)) {
      return res.status(400).json({ error: 'selected_option_ids must be an array' });
    }

    // Prepare answer data for storage
    const optionIds = selected_option_ids || [];
    const complexAnswerData = answer_data ? (typeof answer_data === 'string' ? answer_data : JSON.stringify(answer_data)) : null;

    // Check if answer already exists
    const [existingAnswers] = await promisePool.query(
      'SELECT id FROM answers WHERE attempt_id = ? AND question_id = ?',
      [attemptId, question_id]
    );

    if (existingAnswers.length > 0) {
      // Update existing answer
      await promisePool.query(
        'UPDATE answers SET selected_option_ids = ?, answer_data = ?, marked_for_review = ? WHERE id = ?',
        [JSON.stringify(optionIds), complexAnswerData, marked_for_review || false, existingAnswers[0].id]
      );
    } else {
      // Insert new answer
      await promisePool.query(
        'INSERT INTO answers (attempt_id, question_id, selected_option_ids, answer_data, marked_for_review) VALUES (?, ?, ?, ?, ?)',
        [attemptId, question_id, JSON.stringify(optionIds), complexAnswerData, marked_for_review || false]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ error: 'Failed to save answer' });
  }
};

// Get current progress
exports.getProgress = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Verify ownership (allow viewing completed attempts)
    const [attempts] = await promisePool.query(
      'SELECT user_id, start_time, completed FROM attempts WHERE id = ?',
      [attemptId]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempts[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to attempt' });
    }

    // Get all answers for this attempt
    const [answers] = await promisePool.query(
      'SELECT question_id, selected_option_ids, answer_data, marked_for_review FROM answers WHERE attempt_id = ?',
      [attemptId]
    );

    // Parse JSON for answer data
    const parsedAnswers = answers.map(answer => ({
      question_id: answer.question_id,
      selected_option_ids: JSON.parse(answer.selected_option_ids || '[]'),
      answer_data: answer.answer_data ? JSON.parse(answer.answer_data) : null,
      marked_for_review: answer.marked_for_review
    }));

    // Calculate time remaining
    const startTime = new Date(attempts[0].start_time);
    const now = new Date();
    const elapsedMinutes = (now - startTime) / 1000 / 60;

    // Get exam time limit
    const [exams] = await promisePool.query(
      'SELECT time_limit_minutes FROM exams WHERE id = (SELECT exam_id FROM attempts WHERE id = ?)',
      [attemptId]
    );

    const timeLimit = exams[0].time_limit_minutes;
    const timeRemaining = Math.max(0, Math.floor((timeLimit - elapsedMinutes) * 60)); // in seconds

    res.json({
      answers: parsedAnswers,
      time_remaining_seconds: timeRemaining,
      completed: attempts[0].completed
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
};

// Submit exam and grade
exports.submitExam = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    await connection.beginTransaction();

    // Verify ownership
    const verification = await verifyAttemptOwnership(attemptId, userId);
    if (!verification.valid) {
      await connection.rollback();
      return res.status(403).json({ error: verification.error });
    }

    // Get attempt details
    const [attempts] = await connection.query(
      'SELECT exam_id, start_time FROM attempts WHERE id = ?',
      [attemptId]
    );

    const attempt = attempts[0];
    const examId = attempt.exam_id;

    // Get all questions for this exam
    const [questions] = await connection.query(
      'SELECT id FROM questions WHERE exam_id = ?',
      [examId]
    );

    // Get all answers for this attempt
    const [answers] = await connection.query(
      'SELECT id, question_id, selected_option_ids FROM answers WHERE attempt_id = ?',
      [attemptId]
    );

    // Grade each answer
    let correctCount = 0;
    const detailedResults = [];

    for (const question of questions) {
      const answer = answers.find(a => a.question_id === question.id);
      const selectedOptionIds = answer ? JSON.parse(answer.selected_option_ids || '[]') : [];

      // Get correct options for this question
      const [correctOptions] = await connection.query(
        'SELECT id FROM options WHERE question_id = ? AND is_correct = TRUE',
        [question.id]
      );

      const correctOptionIds = correctOptions.map(opt => opt.id).sort();
      const selectedSorted = [...selectedOptionIds].sort();

      // Check if answer is correct (must match all correct options)
      const isCorrect = JSON.stringify(correctOptionIds) === JSON.stringify(selectedSorted);

      if (isCorrect) {
        correctCount++;
      }

      // Update answer with is_correct
      if (answer) {
        await connection.query(
          'UPDATE answers SET is_correct = ? WHERE id = ?',
          [isCorrect, answer.id]
        );
      }

      // Get question details for response
      const [questionDetails] = await connection.query(
        'SELECT text, explanation FROM questions WHERE id = ?',
        [question.id]
      );

      // Get all options with correct flag
      const [allOptions] = await connection.query(
        'SELECT id, text, is_correct FROM options WHERE question_id = ? ORDER BY order_index',
        [question.id]
      );

      detailedResults.push({
        question_id: question.id,
        question_text: questionDetails[0].text,
        selected_option_ids: selectedOptionIds,
        correct_option_ids: correctOptionIds,
        is_correct: isCorrect,
        explanation: questionDetails[0].explanation,
        options: allOptions
      });
    }

    // Calculate score (out of 1000)
    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 1000);

    // Calculate time remaining
    const startTime = new Date(attempt.start_time);
    const now = new Date();
    const elapsedMinutes = (now - startTime) / 1000 / 60;

    const [exams] = await connection.query(
      'SELECT time_limit_minutes, passing_score FROM exams WHERE id = ?',
      [examId]
    );

    const timeLimit = exams[0].time_limit_minutes;
    const timeRemaining = Math.max(0, Math.floor((timeLimit - elapsedMinutes) * 60));

    // Update attempt
    await connection.query(
      'UPDATE attempts SET end_time = NOW(), score = ?, completed = TRUE, time_remaining_seconds = ? WHERE id = ?',
      [score, timeRemaining, attemptId]
    );

    await connection.commit();

    res.json({
      attempt: {
        id: attemptId,
        score,
        passed: score >= exams[0].passing_score,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        time_remaining_seconds: timeRemaining
      },
      detailed_results: detailedResults
    });
  } catch (error) {
    await connection.rollback();
    console.error('Submit exam error:', error);
    res.status(500).json({ error: 'Failed to submit exam' });
  } finally {
    connection.release();
  }
};

// Get attempt details (for review)
exports.getAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // Get attempt
    const [attempts] = await promisePool.query(
      `SELECT a.*, e.code as exam_code, e.title as exam_title, e.passing_score
       FROM attempts a
       JOIN exams e ON a.exam_id = e.id
       WHERE a.id = ?`,
      [attemptId]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attempt = attempts[0];

    // Verify ownership
    if (attempt.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to attempt' });
    }

    // Check if completed
    if (!attempt.completed) {
      return res.status(400).json({ error: 'Attempt not yet completed' });
    }

    // Get all answers with question details
    const [answers] = await promisePool.query(
      `SELECT 
        a.question_id,
        a.selected_option_ids,
        a.is_correct,
        a.marked_for_review,
        q.text as question_text,
        q.explanation,
        q.question_type
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.attempt_id = ?
      ORDER BY q.order_index`,
      [attemptId]
    );

    // Get options for each question and format for frontend
    const formattedResults = [];
    
    for (let answer of answers) {
      const [options] = await promisePool.query(
        'SELECT id, text, is_correct FROM options WHERE question_id = ? ORDER BY order_index',
        [answer.question_id]
      );
      
      const selectedOptionIds = JSON.parse(answer.selected_option_ids || '[]');
      const correctOptions = options.filter(opt => opt.is_correct);
      const selectedOptions = options.filter(opt => selectedOptionIds.includes(opt.id));
      
      formattedResults.push({
        question_id: answer.question_id,
        question_text: answer.question_text,
        question_type: answer.question_type,
        is_correct: answer.is_correct,
        marked_for_review: answer.marked_for_review,
        explanation: answer.explanation,
        selected_options: selectedOptions.map(opt => opt.text),
        correct_options: correctOptions.map(opt => opt.text),
        selected_option_ids: selectedOptionIds,
        correct_option_ids: correctOptions.map(opt => opt.id)
      });
    }

    res.json({
      attempt: {
        id: attempt.id,
        exam_id: attempt.exam_id,
        exam_code: attempt.exam_code,
        exam_title: attempt.exam_title,
        score: attempt.score,
        passing_score: attempt.passing_score,
        passed: attempt.score >= attempt.passing_score,
        start_time: attempt.start_time ? new Date(attempt.start_time).toISOString() : null,
        end_time: attempt.end_time ? new Date(attempt.end_time).toISOString() : null,
        time_remaining_seconds: attempt.time_remaining_seconds
      },
      results: formattedResults
    });
  } catch (error) {
    console.error('Get attempt details error:', error);
    res.status(500).json({ error: 'Failed to get attempt details' });
  }
};