import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attemptsAPI } from '../services/api';

const HistoryPage = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, passed, failed

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await attemptsAPI.getUserAttempts();
      setAttempts(response.data.attempts || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setAttempts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = attempts.filter(attempt => {
    if (filter === 'all') return true;
    if (filter === 'passed') return attempt.score >= attempt.passing_score;
    if (filter === 'failed') return attempt.score < attempt.passing_score;
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>Exam History</h1>
        <p style={{ fontSize: '16px', color: '#666' }}>
          View all your past exam attempts and results
        </p>
      </div>

      {/* Filter Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('all')}
        >
          All Attempts ({attempts.length})
        </button>
        <button
          className={`btn ${filter === 'passed' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('passed')}
        >
          Passed ({attempts.filter(a => a.score >= a.passing_score).length})
        </button>
        <button
          className={`btn ${filter === 'failed' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('failed')}
        >
          Failed ({attempts.filter(a => a.score < a.passing_score).length})
        </button>
      </div>

      {/* Attempts List */}
      {filteredAttempts.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>
              {filter === 'all' ? 'No Exam Attempts Yet' : `No ${filter} attempts`}
            </h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              {filter === 'all' 
                ? 'Start practicing by taking your first exam!'
                : `You don't have any ${filter} attempts yet.`
              }
            </p>
            {filter === 'all' && (
              <Link to="/exams" className="btn btn-primary">
                Browse Exams
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="history-list">
          {filteredAttempts.map((attempt) => {
            const passed = attempt.score >= attempt.passing_score;
            const percentage = Math.round((attempt.score / 1000) * 100);
            
            return (
              <div key={attempt.id} className="history-item card">
                <div className="history-item-header">
                  <div>
                    <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>
                      {attempt.exam_code} - {attempt.exam_title}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                      {formatDate(attempt.completed_at)}
                    </p>
                  </div>
                  <div className={`history-status-badge ${passed ? 'badge-pass' : 'badge-fail'}`}>
                    {passed ? '✓ PASSED' : '✗ FAILED'}
                  </div>
                </div>

                <div className="history-item-stats">
                  <div className="history-stat">
                    <span className="history-stat-label">Score</span>
                    <span className="history-stat-value" style={{ 
                      color: passed ? '#28a745' : '#dc3545',
                      fontWeight: '600'
                    }}>
                      {attempt.score} / 1000
                    </span>
                  </div>
                  <div className="history-stat">
                    <span className="history-stat-label">Percentage</span>
                    <span className="history-stat-value">{percentage}%</span>
                  </div>
                  <div className="history-stat">
                    <span className="history-stat-label">Duration</span>
                    <span className="history-stat-value">
                      {formatDuration(attempt.time_taken)}
                    </span>
                  </div>
                  <div className="history-stat">
                    <span className="history-stat-label">Passing Score</span>
                    <span className="history-stat-value">{attempt.passing_score}</span>
                  </div>
                </div>

                <div className="history-item-actions">
                  <Link 
                    to={`/results/${attempt.id}`} 
                    className="btn btn-primary btn-sm"
                  >
                    View Details
                  </Link>
                  <Link 
                    to={`/exams/${attempt.exam_id}`} 
                    className="btn btn-outline btn-sm"
                  >
                    Retake Exam
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Statistics */}
      {attempts.length > 0 && (
        <div className="card" style={{ marginTop: '30px' }}>
          <div className="card-header">
            <h2>Overall Statistics</h2>
          </div>
          <div className="card-body">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{attempts.length}</div>
                <div className="stat-label">Total Attempts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#28a745' }}>
                  {attempts.filter(a => a.score >= a.passing_score).length}
                </div>
                <div className="stat-label">Passed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#dc3545' }}>
                  {attempts.filter(a => a.score < a.passing_score).length}
                </div>
                <div className="stat-label">Failed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {Math.round(
                    (attempts.filter(a => a.score >= a.passing_score).length / attempts.length) * 100
                  )}%
                </div>
                <div className="stat-label">Pass Rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {Math.round(
                    attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
                  )}
                </div>
                <div className="stat-label">Average Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {Math.max(...attempts.map(a => a.score))}
                </div>
                <div className="stat-label">Best Score</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;