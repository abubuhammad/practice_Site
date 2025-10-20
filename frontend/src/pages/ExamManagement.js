import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import '../styles/AdminDashboard.css';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    path: 'AZ',
    time_limit_minutes: 60,
    passing_score: 700,
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllExamsAdmin();
      setExams(response.data.exams);
      setError('');
    } catch (err) {
      setError('Failed to load exams');
      console.error('Fetch exams error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingExam) {
        await adminAPI.updateExam(editingExam.id, formData);
      } else {
        await adminAPI.createExam(formData);
      }
      
      setShowModal(false);
      setEditingExam(null);
      resetForm();
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save exam');
    }
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      code: exam.code,
      title: exam.title,
      description: exam.description || '',
      path: exam.path,
      time_limit_minutes: exam.time_limit_minutes,
      passing_score: exam.passing_score,
    });
    setShowModal(true);
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This will also delete all associated questions and attempts.')) {
      return;
    }

    try {
      await adminAPI.deleteExam(examId);
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete exam');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      path: 'AZ',
      time_limit_minutes: 60,
      passing_score: 700,
    });
  };

  const openCreateModal = () => {
    setEditingExam(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-page">
      <div className="page-header">
        <div>
          <h1>Exam Management</h1>
          <p className="subtitle">Create and manage certification exams</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Create New Exam
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Path</th>
              <th>Questions</th>
              <th>Time Limit</th>
              <th>Passing Score</th>
              <th>Attempts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  No exams found. Create your first exam!
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam.id}>
                  <td><strong>{exam.code}</strong></td>
                  <td>{exam.title}</td>
                  <td>
                    <span className="badge badge-info">{exam.path}</span>
                  </td>
                  <td>{exam.actual_question_count || 0}</td>
                  <td>{exam.time_limit_minutes} min</td>
                  <td>{exam.passing_score}</td>
                  <td>{exam.attempt_count || 0}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(exam)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(exam.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingExam ? 'Edit Exam' : 'Create New Exam'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Exam Code *</label>
                <input
                  type="text"
                  name="code"
                  className="form-input"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., AZ-900"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Microsoft Azure Fundamentals"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-input"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Exam description..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Path *</label>
                  <select
                    name="path"
                    className="form-input"
                    value={formData.path}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="AZ">Azure (AZ)</option>
                    <option value="DP">Data & AI (DP)</option>
                    <option value="SC">Security (SC)</option>
                    <option value="AI">AI (AI)</option>
                    <option value="PL">Power Platform (PL)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Time Limit (minutes) *</label>
                  <input
                    type="number"
                    name="time_limit_minutes"
                    className="form-input"
                    value={formData.time_limit_minutes}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Passing Score *</label>
                  <input
                    type="number"
                    name="passing_score"
                    className="form-input"
                    value={formData.passing_score}
                    onChange={handleInputChange}
                    min="0"
                    max="1000"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;