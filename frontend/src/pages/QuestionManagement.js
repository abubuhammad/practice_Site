import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, examsAPI } from '../services/api';
import '../styles/AdminDashboard.css';
import '../styles/QuestionEditors.css';
import {
  DragDropOrderingEditor,
  BuildListEditor,
  MatchingEditor,
  FillInBlankEditor,
  SimulationEditor,
  SequenceOrderingEditor,
  TestletEditor,
  ActiveScreenEditor,
  DragDropEditor,
  CaseStudyEditor,
  HotspotEditor
} from '../components/QuestionEditors';
import { QuestionPreview } from '../components/QuestionDisplays/QuestionPreview';

const QuestionManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    exam_id: '',
    text: '',
    explanation: '',
    question_type: 'single_choice',
    order_index: 0,
    options: [
      { text: '', is_correct: false, order_index: 1 },
      { text: '', is_correct: false, order_index: 2 },
    ],
    // Advanced question type data
    drag_drop_ordering_data: null,
    build_list_data: null,
    simulation_data: null,
    active_screen_data: null,
    testlet_data: null,
    fill_in_blank_data: null,
    matching_data: null,
    sequence_ordering_data: null,
    drag_drop_data: null,
    hotspot_data: null,
    hotspot_areas: null,
    case_study_data: null
  });

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchQuestions(selectedExam);
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const response = await examsAPI.getAllExams();
      setExams(response.data.exams);
      if (response.data.exams.length > 0) {
        setSelectedExam(response.data.exams[0].id.toString());
      }
    } catch (err) {
      setError('Failed to load exams');
      console.error('Fetch exams error:', err);
    }
  };

  const fetchQuestions = async (examId) => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllQuestions(examId);
      setQuestions(response.data.questions);
      setError('');
    } catch (err) {
      setError('Failed to load questions');
      console.error('Fetch questions error:', err);
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

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    
    // For single choice, uncheck all other options when one is checked
    if (field === 'is_correct' && value && formData.question_type === 'single_choice') {
      newOptions.forEach((opt, i) => {
        opt.is_correct = i === index;
      });
    } else {
      newOptions[index] = {
        ...newOptions[index],
        [field]: value
      };
    }
    
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { text: '', is_correct: false, order_index: prev.options.length + 1 }
      ]
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) {
      alert('A question must have at least 2 options');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation based on question type
    if (isTraditionalOptions(formData.question_type)) {
      // Validate traditional option-based questions
      const hasCorrectAnswer = formData.options.some(opt => opt.is_correct);
      if (!hasCorrectAnswer) {
        alert('Please mark at least one option as correct');
        return;
      }

      const emptyOptions = formData.options.some(opt => !opt.text.trim());
      if (emptyOptions) {
        alert('All options must have text');
        return;
      }
    } else {
      // Validate advanced question types have required data
      const dataKey = `${formData.question_type}_data`;
      if (!formData[dataKey]) {
        alert(`Please configure the ${getQuestionTypeDisplayName(formData.question_type)} question settings`);
        return;
      }
    }

    try {
      const dataToSend = {
        ...formData,
        exam_id: parseInt(formData.exam_id),
        order_index: parseInt(formData.order_index)
      };

      console.log('Submitting question data:', dataToSend);

      if (editingQuestion) {
        const response = await adminAPI.updateQuestion(editingQuestion.id, dataToSend);
        console.log('Update response:', response);
        alert('Question updated successfully!');
      } else {
        const response = await adminAPI.createQuestion(dataToSend);
        console.log('Create response:', response);
        alert('Question created successfully!');
      }
      
      setShowModal(false);
      setEditingQuestion(null);
      resetForm();
      fetchQuestions(selectedExam);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Submit error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save question';
      setError(errorMessage);
      alert(errorMessage); // Show alert for immediate feedback
    }
  };

  const handleEdit = async (question) => {
    try {
      const response = await adminAPI.getQuestion(question.id);
      const fullQuestion = response.data.question;
      
      setEditingQuestion(fullQuestion);
      
      // Prepare base form data
      const newFormData = {
        exam_id: fullQuestion.exam_id.toString(),
        text: fullQuestion.text,
        explanation: fullQuestion.explanation || '',
        question_type: fullQuestion.question_type,
        order_index: fullQuestion.order_index,
        options: [],
      // Reset all advanced question type data
      drag_drop_ordering_data: null,
      build_list_data: null,
      simulation_data: null,
      active_screen_data: null,
      testlet_data: null,
      fill_in_blank_data: null,
      matching_data: null,
      sequence_ordering_data: null,
      drag_drop_data: null,
      hotspot_data: null,
      hotspot_areas: null,
      case_study_data: null
      };

      // Load type-specific data
      switch (fullQuestion.question_type) {
        case 'single_choice':
        case 'multiple_choice':
        case 'yes_no':
          newFormData.options = fullQuestion.options.map((opt, idx) => ({
            text: opt.text,
            is_correct: opt.is_correct === 1 || opt.is_correct === true,
            order_index: idx + 1
          }));
          break;
          
        case 'hotspot':
          newFormData.hotspot_data = fullQuestion.hotspot_data;
          newFormData.hotspot_areas = fullQuestion.hotspot_areas || [];
          break;
          
        case 'drag_drop_ordering':
          newFormData.drag_drop_ordering_data = fullQuestion.drag_drop_ordering_data;
          break;
          
        case 'build_list':
          newFormData.build_list_data = fullQuestion.build_list_data;
          break;
          
        case 'simulation':
          newFormData.simulation_data = fullQuestion.simulation_data;
          break;
          
        case 'active_screen':
          newFormData.active_screen_data = fullQuestion.active_screen_data;
          break;
          
        case 'testlet':
          newFormData.testlet_data = fullQuestion.testlet_data;
          break;
          
        case 'fill_in_blank':
          newFormData.fill_in_blank_data = fullQuestion.fill_in_blank_data;
          break;
          
        case 'matching':
          newFormData.matching_data = fullQuestion.matching_data;
          break;
          
        case 'sequence_ordering':
          newFormData.sequence_ordering_data = fullQuestion.sequence_ordering_data;
          break;
          
        case 'drag_drop':
          newFormData.drag_drop_data = fullQuestion.drag_drop_data;
          break;
          
        case 'case_study':
          // For case studies, we need special handling since they create multiple questions
          newFormData.case_study_data = {
            case_study_id: fullQuestion.case_study_id,
            sub_questions: [] // Will be populated if this is editing an existing case study question
          };
          break;
          
        default:
          // For unknown question types, just use the base form data
          break;
      }
      
      setFormData(newFormData);
      setShowModal(true);
    } catch (err) {
      setError('Failed to load question details');
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await adminAPI.deleteQuestion(questionId);
      fetchQuestions(selectedExam);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete question');
    }
  };

  const resetForm = () => {
    setFormData({
      exam_id: selectedExam,
      text: '',
      explanation: '',
      question_type: 'single_choice',
      order_index: 0,
      options: [
        { text: '', is_correct: false, order_index: 1 },
        { text: '', is_correct: false, order_index: 2 },
      ],
      // Reset all advanced question type data
      drag_drop_ordering_data: null,
      build_list_data: null,
      simulation_data: null,
      active_screen_data: null,
      testlet_data: null,
      fill_in_blank_data: null,
      matching_data: null,
      sequence_ordering_data: null,
      drag_drop_data: null,
      hotspot_data: null,
      hotspot_areas: null,
      case_study_data: null
    });
  };

  // Handle question type specific data changes
  const handleQuestionTypeDataChange = useCallback((questionType, data) => {
    const dataKey = `${questionType}_data`;
    setFormData(prev => {
      // Only update if the data has actually changed
      if (JSON.stringify(prev[dataKey]) !== JSON.stringify(data)) {
        return {
          ...prev,
          [dataKey]: data
        };
      }
      return prev;
    });
  }, []);

  // Get question type display name
  const getQuestionTypeDisplayName = (type) => {
    const typeNames = {
      'single_choice': 'Single Choice',
      'multiple_choice': 'Multiple Choice',
      'yes_no': 'Yes/No',
      'drag_drop': 'Drag and Drop',
      'hotspot': 'Hotspot',
      'drag_drop_ordering': 'Drag Drop Ordering',
      'build_list': 'Build List',
      'simulation': 'Simulation',
      'active_screen': 'Active Screen',
      'testlet': 'Testlet',
      'fill_in_blank': 'Fill in the Blank',
      'matching': 'Matching',
      'sequence_ordering': 'Sequence Ordering',
      'case_study': 'Case Study'
    };
    return typeNames[type] || type;
  };

  // Render question type specific editor
  const renderQuestionTypeEditor = () => {
    const questionType = formData.question_type;
    
    switch (questionType) {
      case 'drag_drop_ordering':
        return (
          <DragDropOrderingEditor
            data={formData.drag_drop_ordering_data}
            onChange={(data) => handleQuestionTypeDataChange('drag_drop_ordering', data)}
          />
        );
        
      case 'build_list':
        return (
          <BuildListEditor
            data={formData.build_list_data}
            onChange={(data) => handleQuestionTypeDataChange('build_list', data)}
          />
        );
        
      case 'matching':
        return (
          <MatchingEditor
            data={formData.matching_data}
            onChange={(data) => handleQuestionTypeDataChange('matching', data)}
          />
        );
        
      case 'fill_in_blank':
        return (
          <FillInBlankEditor
            data={formData.fill_in_blank_data}
            onChange={(data) => handleQuestionTypeDataChange('fill_in_blank', data)}
          />
        );
        
      case 'simulation':
        return (
          <SimulationEditor
            data={formData.simulation_data}
            onChange={(data) => handleQuestionTypeDataChange('simulation', data)}
          />
        );
        
      case 'sequence_ordering':
        return (
          <SequenceOrderingEditor
            data={formData.sequence_ordering_data}
            onChange={(data) => handleQuestionTypeDataChange('sequence_ordering', data)}
          />
        );
        
      case 'testlet':
        return (
          <TestletEditor
            data={formData.testlet_data}
            onChange={(data) => handleQuestionTypeDataChange('testlet', data)}
          />
        );
        
      case 'active_screen':
        return (
          <ActiveScreenEditor
            data={formData.active_screen_data}
            onChange={(data) => handleQuestionTypeDataChange('active_screen', data)}
          />
        );
        
      case 'drag_drop':
        return (
          <DragDropEditor
            data={formData.drag_drop_data}
            onChange={(data) => handleQuestionTypeDataChange('drag_drop', data)}
          />
        );

      case 'hotspot':
        return (
          <HotspotEditor
            data={{ hotspot_data: formData.hotspot_data, hotspot_areas: formData.hotspot_areas }}
            onChange={(data) => {
              handleQuestionTypeDataChange('hotspot', data.hotspot_data);
              setFormData(prev => ({ ...prev, hotspot_areas: data.hotspot_areas }));
            }}
          />
        );
        
      case 'case_study':
        return (
          <CaseStudyEditor
            data={formData.case_study_data}
            onChange={(data) => handleQuestionTypeDataChange('case_study', data)}
            examId={formData.exam_id}
          />
        );
      
      default:
        // Traditional option-based questions
        return null; // Will render the traditional options UI below
    }
  };

  // Check if question type uses traditional options
  const isTraditionalOptions = (questionType) => {
    return ['single_choice', 'multiple_choice', 'yes_no'].includes(questionType);
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="container admin-page">
      <div className="page-header">
        <div>
          <h1>Question Management</h1>
          <p className="subtitle">Create and manage exam questions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link 
            to="/admin/questions/enhanced-bulk-upload" 
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            📥 Enhanced Bulk Upload
          </Link>
          <button 
            className="btn btn-primary" 
            onClick={openCreateModal}
            disabled={!selectedExam}
          >
            + Create New Question
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Exam Filter */}
      <div className="filter-section">
        <label className="form-label">Select Exam:</label>
        <select
          className="form-input"
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          style={{ maxWidth: '400px' }}
        >
          <option value="">-- Select an Exam --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.code} - {exam.title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading questions...</p>
        </div>
      ) : (
        <div className="questions-list">
          {questions.length === 0 ? (
            <div className="empty-state">
              <p>No questions found for this exam.</p>
              <button className="btn btn-primary" onClick={openCreateModal}>
                Create First Question
              </button>
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question.id} className="question-card">
                <div className="question-header">
                  <div>
                    <span className="question-number">Question {index + 1}</span>
                    <span className={`badge ${
                      ['single_choice', 'multiple_choice', 'yes_no'].includes(question.question_type) ? 'badge-info' :
                      ['drag_drop_ordering', 'build_list', 'matching', 'sequence_ordering', 'drag_drop', 'hotspot'].includes(question.question_type) ? 'badge-success' :
                      question.question_type === 'case_study' ? 'badge-primary' :
                      'badge-warning'
                    }`}>
                      {getQuestionTypeDisplayName(question.question_type)}
                    </span>
                  </div>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(question)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(question.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="question-text">
                  {question.text}
                </div>
                <div className="question-meta">
                  <span>Options: {question.option_count}</span>
                  {question.case_study_title && (
                    <span>Case Study: {question.case_study_title}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingQuestion ? 'Edit Question' : 'Create New Question'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Exam *</label>
                <select
                  name="exam_id"
                  className="form-input"
                  value={formData.exam_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select Exam --</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.code} - {exam.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <textarea
                  name="text"
                  className="form-input"
                  value={formData.text}
                  onChange={handleInputChange}
                  placeholder="Enter the question..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Question Type *</label>
                  <select
                    name="question_type"
                    className="form-input"
                    value={formData.question_type}
                    onChange={handleInputChange}
                    required
                  >
                    <optgroup label="Traditional Questions">
                      <option value="single_choice">Single Choice</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="yes_no">Yes/No</option>
                    </optgroup>
                    <optgroup label="Interactive Questions">
                      <option value="drag_drop_ordering">Drag Drop Ordering</option>
                      <option value="build_list">Build List</option>
                      <option value="matching">Matching</option>
                      <option value="sequence_ordering">Sequence Ordering</option>
                      <option value="drag_drop">Drag and Drop</option>
                      <option value="hotspot">Hotspot</option>
                    </optgroup>
                    <optgroup label="Advanced Questions">
                      <option value="fill_in_blank">Fill in the Blank</option>
                      <option value="simulation">Simulation</option>
                      <option value="active_screen">Active Screen</option>
                      <option value="testlet">Testlet</option>
                      <option value="case_study">Case Study</option>
                    </optgroup>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Order Index</label>
                  <input
                    type="number"
                    name="order_index"
                    className="form-input"
                    value={formData.order_index}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Explanation</label>
                <textarea
                  name="explanation"
                  className="form-input"
                  value={formData.explanation}
                  onChange={handleInputChange}
                  placeholder="Explain the correct answer..."
                  rows="3"
                />
              </div>

              {/* Question Type Specific Editor */}
              <div className="question-type-editor-section">
                {renderQuestionTypeEditor()}
                
                {/* Traditional Options for single_choice, multiple_choice, yes_no */}
                {isTraditionalOptions(formData.question_type) && (
                  <div className="options-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Answer Options * (Check the correct answer{formData.question_type === 'multiple_choice' ? 's' : ''})
                      </label>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-secondary"
                        onClick={addOption}
                      >
                        + Add Option
                      </button>
                    </div>

                    {formData.options.map((option, index) => (
                      <div key={index} className="option-row">
                        <input
                          type={formData.question_type === 'single_choice' || formData.question_type === 'yes_no' ? 'radio' : 'checkbox'}
                          name={formData.question_type === 'single_choice' || formData.question_type === 'yes_no' ? 'correct_answer' : undefined}
                          checked={option.is_correct}
                          onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)}
                          style={{ marginRight: '10px' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          required
                          style={{ flex: 1 }}
                        />
                        {formData.options.length > 2 && (
                          <button 
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => removeOption(index)}
                            style={{ marginLeft: '10px' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Question Preview Section */}
              {formData.text.trim() && formData.question_type && (
                <div className="question-preview-section" style={{ marginTop: '30px', borderTop: '2px solid #e5e5e5', paddingTop: '20px' }}>
                  <h3 style={{ marginBottom: '20px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👁️</span> Live Preview
                    <span style={{ fontSize: '14px', fontWeight: '400', color: '#666' }}>
                      - How this question will appear to exam takers
                    </span>
                  </h3>
                  <QuestionPreview 
                    question={{
                      ...formData,
                      id: editingQuestion?.id || 'preview',
                      options: isTraditionalOptions(formData.question_type) ? formData.options.map((opt, idx) => ({
                        ...opt,
                        id: idx + 1,
                        order_index: idx + 1
                      })) : undefined
                    }}
                    showHeader={false}
                    isPreviewMode={true}
                  />
                </div>
              )}

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingQuestion ? 'Update Question' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;