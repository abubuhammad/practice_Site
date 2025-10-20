const { promisePool } = require('../config/database');

// Get user's attempts
exports.getUserAttempts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [attempts] = await promisePool.query(
      `SELECT 
        a.id,
        a.exam_id,
        a.score,
        a.completed,
        a.start_time,
        a.end_time,
        e.code as exam_code,
        e.title as exam_title,
        e.passing_score,
        (a.score >= e.passing_score) as passed,
        TIMESTAMPDIFF(SECOND, a.start_time, a.end_time) as time_taken
      FROM attempts a
      JOIN exams e ON a.exam_id = e.id
      WHERE a.user_id = ? AND a.completed = TRUE
      ORDER BY a.start_time DESC`,
      [userId]
    );

    // Format the response to match frontend expectations
    const formattedAttempts = attempts.map(attempt => ({
      id: attempt.id,
      exam_id: attempt.exam_id,
      exam_code: attempt.exam_code,
      exam_title: attempt.exam_title,
      score: attempt.score,
      passing_score: attempt.passing_score,
      passed: Boolean(attempt.passed),
      completed_at: attempt.end_time ? new Date(attempt.end_time).toISOString() : null, // Format as ISO string
      time_taken: attempt.time_taken || 0
    }));

    res.json({ attempts: formattedAttempts });
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total attempts
    const [totalAttempts] = await promisePool.query(
      'SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND completed = TRUE',
      [userId]
    );

    // Passed attempts
    const [passedAttempts] = await promisePool.query(
      `SELECT COUNT(*) as count 
       FROM attempts a
       JOIN exams e ON a.exam_id = e.id
       WHERE a.user_id = ? AND a.completed = TRUE AND a.score >= e.passing_score`,
      [userId]
    );

    // Average score
    const [avgScore] = await promisePool.query(
      'SELECT AVG(score) as avg_score FROM attempts WHERE user_id = ? AND completed = TRUE',
      [userId]
    );

    // Unique exams taken
    const [uniqueExams] = await promisePool.query(
      'SELECT COUNT(DISTINCT exam_id) as count FROM attempts WHERE user_id = ? AND completed = TRUE',
      [userId]
    );

    res.json({
      total_attempts: totalAttempts[0].count,
      passed_attempts: passedAttempts[0].count,
      average_score: Math.round(avgScore[0].avg_score || 0),
      unique_exams: uniqueExams[0].count
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};