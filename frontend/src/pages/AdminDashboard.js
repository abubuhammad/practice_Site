import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdminStats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load statistics');
      console.error('Fetch stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">Manage exams, questions, and users</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
              <span style={{ fontSize: '32px' }}>📚</span>
            </div>
            <div className="stat-content">
              <h3>{stats.total_exams || 0}</h3>
              <p>Total Exams</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
              <span style={{ fontSize: '32px' }}>❓</span>
            </div>
            <div className="stat-content">
              <h3>{stats.total_questions || 0}</h3>
              <p>Total Questions</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
              <span style={{ fontSize: '32px' }}>👥</span>
            </div>
            <div className="stat-content">
              <h3>{stats.total_users || 0}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
              <span style={{ fontSize: '32px' }}>📝</span>
            </div>
            <div className="stat-content">
              <h3>{stats.total_attempts || 0}</h3>
              <p>Total Attempts</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/admin/exams" className="action-card">
            <div className="action-icon">📚</div>
            <h3>Manage Exams</h3>
            <p>Create, edit, and delete exams</p>
          </Link>

          <Link to="/admin/questions" className="action-card">
            <div className="action-icon">❓</div>
            <h3>Manage Questions</h3>
            <p>Add and edit exam questions</p>
          </Link>

          <Link to="/admin/questions/enhanced-bulk-upload" className="action-card">
            <div className="action-icon">📥</div>
            <h3>Enhanced Bulk Upload</h3>
            <p>Import questions with support for all Microsoft exam question types</p>
          </Link>

          <Link to="/admin/case-studies" className="action-card">
            <div className="action-icon">📖</div>
            <h3>Case Studies</h3>
            <p>Manage case study scenarios</p>
          </Link>

          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👥</div>
            <h3>Manage Users</h3>
            <p>View and manage user accounts</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recent_attempts && stats.recent_attempts.length > 0 && (
        <div className="recent-activity">
          <h2>Recent Exam Attempts</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{attempt.user_email}</td>
                    <td>{attempt.exam_code}</td>
                    <td>{attempt.score || 'N/A'}</td>
                    <td>
                      {attempt.end_time 
                        ? new Date(attempt.end_time).toLocaleDateString()
                        : 'In Progress'}
                    </td>
                    <td>
                      <span className={`badge ${attempt.completed ? 'badge-success' : 'badge-warning'}`}>
                        {attempt.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;