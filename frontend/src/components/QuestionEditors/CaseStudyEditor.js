import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const CaseStudyEditor = ({ data, onChange, errors = {}, examId }) => {
  const [selectedCaseStudy, setSelectedCaseStudy] = useState('');
  const [availableCaseStudies, setAvailableCaseStudies] = useState([]);
  const [createNewCaseStudy, setCreateNewCaseStudy] = useState(false);
  const [newCaseStudyTitle, setNewCaseStudyTitle] = useState('');
  const [newCaseStudyScenario, setNewCaseStudyScenario] = useState('');
  const [subQuestions, setSubQuestions] = useState([
    {
      id: 1,
      text: '',
      question_type: 'single_choice',
      options: [
        { text: '', is_correct: false, order_index: 1 },
        { text: '', is_correct: false, order_index: 2 }
      ],
      explanation: ''
    }
  ]);

  // Initialize from existing data
  useEffect(() => {
    if (data) {
      setSelectedCaseStudy(data.case_study_id?.toString() || '');
      setSubQuestions(data.sub_questions || [
        {
          id: 1,
          text: '',
          question_type: 'single_choice',
          options: [
            { text: '', is_correct: false, order_index: 1 },
            { text: '', is_correct: false, order_index: 2 }
          ],
          explanation: ''
        }
      ]);
    }
  }, [data]);

  // Load case studies when exam ID changes
  useEffect(() => {
    if (examId) {
      loadCaseStudies();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Update parent component when data changes
  useEffect(() => {
    const dataToSend = {
      case_study_id: selectedCaseStudy ? parseInt(selectedCaseStudy) : null,
      sub_questions: subQuestions,
      create_new_case_study: createNewCaseStudy,
      new_case_study_title: newCaseStudyTitle,
      new_case_study_scenario: newCaseStudyScenario
    };
    
    // Only call onChange if data actually changed
    if (onChange) {
      onChange(dataToSend);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCaseStudy, subQuestions, createNewCaseStudy, newCaseStudyTitle, newCaseStudyScenario]);

  const loadCaseStudies = async () => {
    try {
      const response = await adminAPI.getAllCaseStudies(examId);
      setAvailableCaseStudies(response.data.case_studies || []);
    } catch (error) {
      console.error('Failed to load case studies:', error);
      setAvailableCaseStudies([]);
    }
  };

  const addSubQuestion = () => {
    const newId = Math.max(...subQuestions.map(q => q.id), 0) + 1;
    setSubQuestions([...subQuestions, {
      id: newId,
      text: '',
      question_type: 'single_choice',
      options: [
        { text: '', is_correct: false, order_index: 1 },
        { text: '', is_correct: false, order_index: 2 }
      ],
      explanation: ''
    }]);
  };

  const removeSubQuestion = (id) => {
    if (subQuestions.length <= 1) {
      alert('Case study must have at least one question');
      return;
    }
    setSubQuestions(subQuestions.filter(q => q.id !== id));
  };

  const updateSubQuestion = (id, field, value) => {
    setSubQuestions(subQuestions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateSubQuestionOption = (questionId, optionIndex, field, value) => {
    setSubQuestions(subQuestions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        
        // For single choice, uncheck all other options when one is checked
        if (field === 'is_correct' && value && q.question_type === 'single_choice') {
          newOptions.forEach((opt, i) => {
            opt.is_correct = i === optionIndex;
          });
        } else {
          newOptions[optionIndex] = {
            ...newOptions[optionIndex],
            [field]: value
          };
        }
        
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const addOptionToSubQuestion = (questionId) => {
    setSubQuestions(subQuestions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: [
            ...q.options,
            { text: '', is_correct: false, order_index: q.options.length + 1 }
          ]
        };
      }
      return q;
    }));
  };

  const removeOptionFromSubQuestion = (questionId, optionIndex) => {
    setSubQuestions(subQuestions.map(q => {
      if (q.id === questionId && q.options.length > 2) {
        return {
          ...q,
          options: q.options.filter((_, i) => i !== optionIndex)
        };
      }
      return q;
    }));
  };

  const getSelectedCaseStudyInfo = () => {
    const caseStudy = availableCaseStudies.find(cs => cs.id.toString() === selectedCaseStudy);
    return caseStudy;
  };

  return (
    <div className="question-editor case-study-editor">
      <h4>Case Study Question</h4>
      <p className="editor-description">
        Case studies provide a scenario with multiple related questions, just like Microsoft certification exams.
      </p>

      {/* Case Study Selection */}
      <div className="form-section">
        <label className="form-label">Case Study Selection</label>
        
        <div className="case-study-selection">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <select
                className="form-input"
                value={selectedCaseStudy}
                onChange={(e) => setSelectedCaseStudy(e.target.value)}
                disabled={createNewCaseStudy}
              >
                <option value="">-- Select Existing Case Study --</option>
                {availableCaseStudies.map(cs => (
                  <option key={cs.id} value={cs.id}>
                    {cs.title} ({cs.question_count} questions)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={createNewCaseStudy}
                  onChange={(e) => setCreateNewCaseStudy(e.target.checked)}
                />
                Create New Case Study
              </label>
            </div>
          </div>
        </div>

        {/* Display selected case study scenario */}
        {selectedCaseStudy && !createNewCaseStudy && (
          <div className="case-study-preview">
            <h5>Selected Case Study: {getSelectedCaseStudyInfo()?.title}</h5>
            <div className="scenario-text">
              {getSelectedCaseStudyInfo()?.scenario_text}
            </div>
          </div>
        )}

        {/* Create new case study fields */}
        {createNewCaseStudy && (
          <div className="new-case-study-form">
            <div className="form-group">
              <label className="form-label">Case Study Title *</label>
              <input
                type="text"
                className="form-input"
                value={newCaseStudyTitle}
                onChange={(e) => setNewCaseStudyTitle(e.target.value)}
                placeholder="e.g., 'Contoso Azure Migration', 'Fabrikam Security Implementation'"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Case Study Scenario *</label>
              <textarea
                className="form-input case-study-scenario"
                value={newCaseStudyScenario}
                onChange={(e) => setNewCaseStudyScenario(e.target.value)}
                placeholder="Describe the business scenario, environment, requirements, and constraints..."
                rows="8"
                required
              />
              <small className="form-help">
                Write a detailed scenario that provides context for all questions. Include company background, 
                current environment, business requirements, and any constraints.
              </small>
            </div>
          </div>
        )}
      </div>

      {/* Sub Questions */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Case Study Questions</label>
          <button 
            type="button" 
            className="btn btn-sm btn-secondary"
            onClick={addSubQuestion}
          >
            + Add Question
          </button>
        </div>
        
        <div className="sub-questions-list">
          {subQuestions.map((question, questionIndex) => (
            <div key={question.id} className="sub-question-card">
              <div className="sub-question-header">
                <h5>Question {questionIndex + 1}</h5>
                {subQuestions.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeSubQuestion(question.id)}
                  >
                    Remove Question
                  </button>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <textarea
                  className="form-input"
                  value={question.text}
                  onChange={(e) => updateSubQuestion(question.id, 'text', e.target.value)}
                  placeholder="Enter the question related to the case study scenario..."
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Question Type *</label>
                  <select
                    className="form-input"
                    value={question.question_type}
                    onChange={(e) => updateSubQuestion(question.id, 'question_type', e.target.value)}
                  >
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="yes_no">Yes/No</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div className="section-header">
                  <label className="form-label">Answer Options *</label>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-secondary"
                    onClick={() => addOptionToSubQuestion(question.id)}
                  >
                    + Add Option
                  </button>
                </div>

                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="option-row">
                    <input
                      type={question.question_type === 'single_choice' || question.question_type === 'yes_no' ? 'radio' : 'checkbox'}
                      name={question.question_type === 'single_choice' || question.question_type === 'yes_no' ? `correct_answer_${question.id}` : undefined}
                      checked={option.is_correct}
                      onChange={(e) => updateSubQuestionOption(question.id, optionIndex, 'is_correct', e.target.checked)}
                      style={{ marginRight: '10px' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={option.text}
                      onChange={(e) => updateSubQuestionOption(question.id, optionIndex, 'text', e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      required
                      style={{ flex: 1 }}
                    />
                    {question.options.length > 2 && (
                      <button 
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeOptionFromSubQuestion(question.id, optionIndex)}
                        style={{ marginLeft: '10px' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Explanation (Optional)</label>
                <textarea
                  className="form-input"
                  value={question.explanation}
                  onChange={(e) => updateSubQuestion(question.id, 'explanation', e.target.value)}
                  placeholder="Explain the correct answer and why other options are incorrect..."
                  rows="2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {errors.general && (
        <div className="alert alert-error">
          {errors.general}
        </div>
      )}
    </div>
  );
};

export default CaseStudyEditor;