import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAPI, examsAPI } from '../services/api';
import '../styles/AdminDashboard.css';

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
};

const questionTypeLabel = (type) => {
  switch (type) {
    case 'multiple_choice':
      return 'Multiple Choice';
    case 'drag_drop':
      return 'Drag & Drop';
    default:
      return 'Single Choice';
  }
};

const truncateText = (text, maxLength = 140) => {
  if (!text) {
    return '—';
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};

const CaseStudyManagement = () => {
  const [exams, setExams] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingCaseStudies, setLoadingCaseStudies] = useState(false);
  const [caseStudyError, setCaseStudyError] = useState('');

  const [questionsByExam, setQuestionsByExam] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [selectedCaseStudy, setSelectedCaseStudy] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState(null);
  const [formData, setFormData] = useState({
    exam_id: '',
    title: '',
    scenario_text: '',
    order_index: 0,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadExams = useCallback(async () => {
    try {
      setLoadingExams(true);
      const response = await examsAPI.getAllExams();
      const examList = response.data?.exams || [];
      setExams(examList);

      if (examList.length > 0) {
        const firstExamId = examList[0].id.toString();
        setSelectedExamId(firstExamId);
        setFormData((prev) => ({
          ...prev,
          exam_id: firstExamId,
        }));
      }

      setCaseStudyError('');
    } catch (err) {
      console.error('Failed to load exams', err);
      setCaseStudyError('Failed to load exams');
    } finally {
      setLoadingExams(false);
    }
  }, []);

  const loadCaseStudies = useCallback(async (examId) => {
    if (!examId) {
      setCaseStudies([]);
      return;
    }

    try {
      setLoadingCaseStudies(true);
      const response = await adminAPI.getAllCaseStudies(examId);
      setCaseStudies(response.data?.case_studies || []);
      setCaseStudyError('');
    } catch (err) {
      console.error('Failed to load case studies', err);
      setCaseStudyError('Failed to load case studies');
    } finally {
      setLoadingCaseStudies(false);
    }
  }, []);

  const ensureQuestionsLoaded = useCallback(async (examId) => {
    const cacheKey = examId?.toString();

    if (!cacheKey || questionsByExam[cacheKey]) {
      return;
    }

    try {
      setLoadingQuestions(true);
      const response = await adminAPI.getAllQuestions(cacheKey);
      setQuestionsByExam((prev) => ({
        ...prev,
        [cacheKey]: response.data?.questions || [],
      }));
      setDetailError('');
    } catch (err) {
      console.error('Failed to load linked questions', err);
      setDetailError('Failed to load linked questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, [questionsByExam]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    if (selectedExamId) {
      loadCaseStudies(selectedExamId);
    }
  }, [loadCaseStudies, selectedExamId]);

  const caseStudySummary = useMemo(() => ({
    total: caseStudies.length,
  }), [caseStudies]);

  const linkedQuestions = useMemo(() => {
    if (!selectedCaseStudy) {
      return [];
    }

    const examKey = selectedCaseStudy.exam_id?.toString() || selectedExamId;
    const allQuestions = questionsByExam[examKey] || [];
    return allQuestions.filter((question) => question.case_study_id === selectedCaseStudy.id);
  }, [questionsByExam, selectedCaseStudy, selectedExamId]);

  const handleOpenDetails = useCallback(async (caseStudy) => {
    setSelectedCaseStudy(caseStudy);
    setIsDetailOpen(true);
    setDetailError('');

    await ensureQuestionsLoaded(caseStudy.exam_id?.toString() || selectedExamId);
  }, [ensureQuestionsLoaded, selectedExamId]);

  const handleCloseDetails = () => {
    setIsDetailOpen(false);
    setSelectedCaseStudy(null);
    setDetailError('');
  };

  const resetFormState = useCallback(() => {
    setEditingCaseStudy(null);
    setShowFormModal(false);
  }, []);

  const openCreateModal = () => {
    setEditingCaseStudy(null);
    setFormData({
      exam_id: selectedExamId,
      title: '',
      scenario_text: '',
      order_index: 0,
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (caseStudy) => {
    setEditingCaseStudy(caseStudy);
    setFormData({
      exam_id: caseStudy.exam_id?.toString() || selectedExamId,
      title: caseStudy.title || '',
      scenario_text: caseStudy.scenario_text || '',
      order_index: caseStudy.order_index ?? 0,
    });
    setFormErrors({});
    setShowFormModal(true);
    setIsDetailOpen(false);
  };

  const handleDeleteCaseStudy = useCallback(async (caseStudyId) => {
    if (!window.confirm('Delete this case study? This will unlink any associated questions.')) {
      return;
    }

    try {
      setSubmitting(true);
      await adminAPI.deleteCaseStudy(caseStudyId);
      await loadCaseStudies(selectedExamId);
      setSelectedCaseStudy((prev) => (prev?.id === caseStudyId ? null : prev));
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Failed to delete case study', error);
      setCaseStudyError(error.response?.data?.error || 'Failed to delete case study');
    } finally {
      setSubmitting(false);
    }
  }, [loadCaseStudies, selectedExamId]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'order_index' ? Number(value) : value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.exam_id) {
      errors.exam_id = 'Exam is required';
    }
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.scenario_text.trim()) {
      errors.scenario_text = 'Scenario text is required';
    }
    if (Number.isNaN(formData.order_index) || formData.order_index < 0) {
      errors.order_index = 'Order index must be 0 or higher';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmitForm = useCallback(async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        exam_id: Number(formData.exam_id),
        title: formData.title.trim(),
        scenario_text: formData.scenario_text.trim(),
        order_index: Number(formData.order_index) || 0,
      };

      let response;
      if (editingCaseStudy) {
        response = await adminAPI.updateCaseStudy(editingCaseStudy.id, payload);
      } else {
        response = await adminAPI.createCaseStudy(payload);
      }

      const savedCaseStudy = response.data?.case_study;
      if (savedCaseStudy) {
        setCaseStudies((prev) => {
          if (editingCaseStudy) {
            return prev.map((item) => (item.id === savedCaseStudy.id ? { ...item, ...savedCaseStudy } : item));
          }
          return [savedCaseStudy, ...prev];
        });
      }

      await loadCaseStudies(formData.exam_id);
      resetFormState();
    } catch (error) {
      console.error('Failed to save case study', error);
      const message = error.response?.data?.error || 'Failed to save case study';
      setFormErrors((prev) => ({
        ...prev,
        submit: message,
      }));
    } finally {
      setSubmitting(false);
    }
  }, [editingCaseStudy, formData, loadCaseStudies, resetFormState, validateForm]);

  const renderFormError = (field) => {
    if (!formErrors[field]) {
      return null;
    }

    return (
      <p className="form-error" role="alert">
        {formErrors[field]}
      </p>
    );
  };

  return (
    <div className="container admin-page">
      <div className="page-header">
        <div>
          <h1>Case Study Management</h1>
          <p className="subtitle">Review case study scenarios for each exam</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreateModal}
        >
          + Create Case Study
        </button>
      </div>

      {caseStudyError && (
        <div className="alert alert-error">{caseStudyError}</div>
      )}

      <div className="filter-section">
        <label className="form-label" htmlFor="exam-select">Select Exam:</label>
        <select
          id="exam-select"
          className="form-input"
          style={{ maxWidth: '400px' }}
          value={selectedExamId}
          onChange={(event) => {
            const nextExamId = event.target.value;
            setSelectedExamId(nextExamId);
            setFormData((prev) => ({
              ...prev,
              exam_id: nextExamId,
            }));
          }}
          disabled={loadingExams}
        >
          <option value="">-- Select an Exam --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.code} - {exam.title}
            </option>
          ))}
        </select>
      </div>

      {loadingCaseStudies ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading case studies...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
                <span style={{ fontSize: '32px' }}>📖</span>
              </div>
              <div className="stat-content">
                <h3>{caseStudySummary.total}</h3>
                <p>Total Case Studies</p>
              </div>
            </div>
          </div>

          {caseStudies.length === 0 ? (
            <div className="empty-state">
              <p>No case studies found for this exam.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Title</th>
                    <th style={{ width: '14%' }}>Order</th>
                    <th style={{ width: '18%' }}>Linked Questions</th>
                    <th style={{ width: '15%' }}>Created</th>
                    <th style={{ width: '15%' }}>Updated</th>
                    <th style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {caseStudies.map((caseStudy) => (
                    <tr key={caseStudy.id}>
                      <td style={{ fontWeight: 600 }}>{caseStudy.title}</td>
                      <td>{caseStudy.order_index ?? '—'}</td>
                      <td>{caseStudy.question_count ?? 0}</td>
                      <td>{formatDate(caseStudy.created_at)}</td>
                      <td>{formatDate(caseStudy.updated_at)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenDetails(caseStudy)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEditModal(caseStudy)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteCaseStudy(caseStudy.id)}
                            disabled={submitting}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {isDetailOpen && selectedCaseStudy && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content modal-large" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedCaseStudy.title}</h2>
                <p className="subtitle">Case Study Details & Linked Questions</p>
              </div>
              <button type="button" className="modal-close" onClick={handleCloseDetails}>
                ×
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="stats-grid" style={{ margin: 0 }}>
                <div className="stat-card" style={{ flex: 1 }}>
                  <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
                    <span style={{ fontSize: '32px' }}>🔢</span>
                  </div>
                  <div className="stat-content">
                    <h3>{selectedCaseStudy.order_index ?? '—'}</h3>
                    <p>Order Index</p>
                  </div>
                </div>

                <div className="stat-card" style={{ flex: 1 }}>
                  <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
                    <span style={{ fontSize: '32px' }}>❓</span>
                  </div>
                  <div className="stat-content">
                    <h3>{selectedCaseStudy.question_count ?? linkedQuestions.length}</h3>
                    <p>Linked Questions</p>
                  </div>
                </div>

                <div className="stat-card" style={{ flex: 1 }}>
                  <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
                    <span style={{ fontSize: '32px' }}>🕒</span>
                  </div>
                  <div className="stat-content">
                    <h3>{formatDate(selectedCaseStudy.updated_at)}</h3>
                    <p>Last Updated</p>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '20px', maxHeight: '260px', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0 }}>Scenario</h3>
                <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {selectedCaseStudy.scenario_text || 'No scenario text provided.'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0 }}>Linked Questions</h3>
                  {detailError && (
                    <span className="badge badge-warning">{detailError}</span>
                  )}
                </div>

                {loadingQuestions && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="spinner"></div>
                    <p>Loading linked questions…</p>
                  </div>
                )}

                {!loadingQuestions && linkedQuestions.length === 0 && !detailError && (
                  <div className="empty-state" style={{ padding: '30px 20px' }}>
                    <p>This case study does not have any linked questions yet.</p>
                  </div>
                )}

                {!loadingQuestions && linkedQuestions.length > 0 && (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '12%' }}>Order</th>
                          <th style={{ width: '18%' }}>Type</th>
                          <th style={{ width: '70%' }}>Question</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkedQuestions.map((question) => (
                          <tr key={question.id}>
                            <td>{question.order_index ?? '—'}</td>
                            <td>{questionTypeLabel(question.question_type)}</td>
                            <td title={question.text}>{truncateText(question.text)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '13px', color: '#666' }}>
                Editing tools are coming soon—this pane is read-only for now.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => openEditModal(selectedCaseStudy)}
              >
                Edit Case Study
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteCaseStudy(selectedCaseStudy.id)}
                disabled={submitting}
              >
                Delete Case Study
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseStudyManagement;