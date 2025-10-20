import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, examsAPI } from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats
      const statsResponse = await usersAPI.getUserStats();
      setStats(statsResponse.data);

      // Fetch recent attempts
      const attemptsResponse = await usersAPI.getUserAttempts();
      setRecentAttempts(attemptsResponse.data.attempts.slice(0, 5));

      // Fetch available exams
      const examsResponse = await examsAPI.getAllExams();
      setExams(examsResponse.data.exams.slice(0, 6));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px', fontSize: '32px' }}>
        Welcome back, {user?.email}!
      </h1>

      {/* Stats Cards */}
      <div className="results-stats">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_attempts || 0}</div>
          <div className="stat-label">Total Attempts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.passed_attempts || 0}</div>
          <div className="stat-label">Passed Exams</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats?.average_score ? Math.round(stats.average_score) : 0}
          </div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats?.pass_rate ? `${Math.round(stats.pass_rate)}%` : '0%'}
          </div>
          <div className="stat-label">Pass Rate</div>
        </div>
      </div>

      {/* Recent Attempts */}
      {recentAttempts.length > 0 && (
        <div className="card" style={{ marginTop: '30px' }}>
          <div className="card-header">
            <h2>Recent Attempts</h2>
          </div>
          <div className="card-body">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Exam</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Score</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((attempt) => (
                  <tr key={attempt.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{attempt.exam_code}</strong> - {attempt.exam_title}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <strong>{attempt.score}</strong>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span className={`review-result-badge ${attempt.passed ? 'badge-correct' : 'badge-incorrect'}`}>
                        {attempt.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {attempt.completed_at 
                        ? new Date(attempt.completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'
                      }
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Link to={`/results/${attempt.id}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }}>
                        View Results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Link to="/history" className="btn btn-outline">
                View All Attempts
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Available Exams */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header">
          <h2>Available Exams</h2>
        </div>
        <div className="card-body">
          <div className="exam-grid">
            {exams.map((exam) => (
              <Link 
                key={exam.id} 
                to={`/exams/${exam.id}`} 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="exam-card">
                  <div className="exam-code">{exam.code}</div>
                  <div className="exam-title">{exam.title}</div>
                  <div className="exam-description">{exam.description}</div>
                  <div className="exam-meta">
                    <span>⏱️ {exam.time_limit_minutes} min</span>
                    <span>📝 {exam.total_questions} questions</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/exams" className="btn btn-primary">
              View All Exams
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;