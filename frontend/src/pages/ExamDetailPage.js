import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examsAPI } from '../services/api';

const ExamDetailPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const response = await examsAPI.getExamById(examId);
      setExam(response.data.exam);
    } catch (error) {
      console.error('Error fetching exam details:', error);
      setError('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    try {
      setStarting(true);
      setError('');
      const response = await examsAPI.startExam(examId);
      const attemptId = response.data.attempt.id;
      navigate(`/exams/${examId}/take/${attemptId}`);
    } catch (error) {
      console.error('Error starting exam:', error);
      setError(error.response?.data?.error || 'Failed to start exam');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Exam not found
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="exam-code" style={{ fontSize: '24px', marginBottom: '8px' }}>
                {exam.code}
              </div>
              <h1 style={{ fontSize: '28px', margin: 0 }}>{exam.title}</h1>
            </div>
            <span style={{ 
              padding: '8px 16px',
              backgroundColor: '#e7f3ff',
              color: '#0078d4',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {exam.path}
            </span>
          </div>
        </div>

        <div className="card-body">
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '12px' }}>Description</h3>
            <p style={{ lineHeight: '1.8', color: '#495057' }}>
              {exam.description || 'No description available'}
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                Time Limit
              </div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#0078d4' }}>
                {exam.time_limit_minutes} minutes
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                Total Questions
              </div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#0078d4' }}>
                {exam.total_questions}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                Passing Score
              </div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#0078d4' }}>
                {exam.passing_score}
              </div>
            </div>
          </div>

          <div style={{ 
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginBottom: '12px', color: '#856404' }}>
              ⚠️ Important Instructions
            </h3>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', color: '#856404' }}>
              <li>You will have <strong>{exam.time_limit_minutes} minutes</strong> to complete the exam</li>
              <li>The exam contains <strong>{exam.total_questions} questions</strong></li>
              <li>You can navigate between questions and mark them for review</li>
              <li>The exam will be automatically submitted when time expires</li>
              <li>You need a score of <strong>{exam.passing_score}</strong> or higher to pass</li>
              <li>Once you start, the timer cannot be paused</li>
              <li>Make sure you have a stable internet connection</li>
            </ul>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/exams')} 
              className="btn btn-secondary"
            >
              Back to Catalog
            </button>
            <button 
              onClick={handleStartExam} 
              className="btn btn-success"
              disabled={starting}
              style={{ fontSize: '18px', padding: '14px 32px' }}
            >
              {starting ? 'Starting...' : 'Start Exam'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamDetailPage;