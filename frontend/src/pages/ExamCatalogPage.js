import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examsAPI } from '../services/api';

const ExamCatalogPage = () => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [selectedPath, setSelectedPath] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    filterExams();
  }, [selectedPath, exams]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await examsAPI.getAllExams();
      setExams(response.data.exams);
      setFilteredExams(response.data.exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExams = () => {
    if (selectedPath === 'all') {
      setFilteredExams(exams);
    } else {
      setFilteredExams(exams.filter(exam => exam.path === selectedPath));
    }
  };

  const paths = ['all', ...new Set(exams.map(exam => exam.path))];

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px', fontSize: '32px' }}>Exam Catalog</h1>

      {/* Path Filter */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', marginRight: '10px' }}>Filter by Path:</span>
            {paths.map(path => (
              <button
                key={path}
                onClick={() => setSelectedPath(path)}
                className={`btn ${selectedPath === path ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 20px' }}
              >
                {path.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ color: '#6c757d', marginBottom: '10px' }}>No exams found</h2>
            <p style={{ color: '#6c757d' }}>Try selecting a different path filter</p>
          </div>
        </div>
      ) : (
        <div className="exam-grid">
          {filteredExams.map((exam) => (
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
                <div style={{ marginTop: '16px' }}>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: '#e7f3ff',
                    color: '#0078d4',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {exam.path}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamCatalogPage;