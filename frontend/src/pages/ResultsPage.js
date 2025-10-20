import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { attemptsAPI } from '../services/api';

const ResultsPage = () => {
  const { attemptId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await attemptsAPI.getAttemptDetails(attemptId);
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Results not found
        </div>
      </div>
    );
  }

  const { attempt, results: questionResults } = results;
  const passed = attempt.score >= attempt.passing_score;
  const correctCount = questionResults.filter(r => r.is_correct).length;
  const totalQuestions = questionResults.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="results-container container">
      {/* Header with Score */}
      <div className="results-header">
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>
          {attempt.exam_code} - {attempt.exam_title}
        </h1>
        <div className={`results-status ${passed ? 'status-pass' : 'status-fail'}`}>
          {passed ? '✓ PASSED' : '✗ FAILED'}
        </div>
        <div className="results-score">
          {attempt.score}
        </div>
        <p style={{ fontSize: '18px', opacity: 0.9 }}>
          You scored {attempt.score} out of 1000
        </p>
      </div>

      {/* Statistics */}
      <div className="results-stats">
        <div className="stat-card">
          <div className="stat-value">{correctCount}</div>
          <div className="stat-label">Correct Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalQuestions - correctCount}</div>
          <div className="stat-label">Incorrect Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{percentage}%</div>
          <div className="stat-label">Percentage</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{attempt.passing_score}</div>
          <div className="stat-label">Passing Score</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '30px' }}>
        <Link to="/exams" className="btn btn-primary">
          Browse Exams
        </Link>
        <Link to={`/exams/${attempt.exam_id}`} className="btn btn-outline">
          Retake Exam
        </Link>
        <Link to="/history" className="btn btn-secondary">
          View History
        </Link>
      </div>

      {/* Detailed Question Review */}
      <div className="card">
        <div className="card-header">
          <h2>Detailed Review</h2>
        </div>
        <div className="card-body">
          <div className="question-review-list">
            {questionResults.map((result, index) => (
              <div key={result.question_id} className="question-review-item">
                <div className="question-review-header">
                  <h3 style={{ fontSize: '18px', margin: 0 }}>
                    Question {index + 1}
                  </h3>
                  <span className={`review-result-badge ${result.is_correct ? 'badge-correct' : 'badge-incorrect'}`}>
                    {result.is_correct ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '16px', lineHeight: '1.8', fontWeight: '500' }}>
                    {result.question_text}
                  </p>
                </div>

                {result.question_type === 'multiple_choice' && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px 12px', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    ℹ️ This was a multiple choice question (select all that apply)
                  </div>
                )}

                {/* Your Answer */}
                <div className="answer-section">
                  <span className="answer-label">Your Answer:</span>
                  {result.selected_options && result.selected_options.length > 0 ? (
                    <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                      {result.selected_options.map((opt, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ marginTop: '8px', color: '#6c757d', fontStyle: 'italic' }}>
                      No answer provided
                    </p>
                  )}
                </div>

                {/* Correct Answer (if incorrect) */}
                {!result.is_correct && (
                  <div className="answer-section" style={{ backgroundColor: '#d4edda' }}>
                    <span className="answer-label" style={{ color: '#155724' }}>
                      Correct Answer:
                    </span>
                    <ul style={{ marginTop: '8px', marginLeft: '20px', color: '#155724' }}>
                      {result.correct_options.map((opt, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Explanation */}
                {result.explanation && (
                  <div className="explanation-section">
                    <span className="answer-label">💡 Explanation:</span>
                    <p style={{ marginTop: '8px', lineHeight: '1.6' }}>
                      {result.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'center', 
        marginTop: '30px',
        marginBottom: '30px'
      }}>
        <Link to="/" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ResultsPage;