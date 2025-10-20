import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examsAPI, attemptsAPI } from '../services/api';
import { 
  TraditionalQuestionDisplay,
  HotspotDisplay,
  DragDropOrderingDisplay,
  BuildListDisplay,
  MatchingDisplay,
  FillInBlankDisplay,
  SequenceOrderingDisplay,
  SimulationDisplay
} from '../components/QuestionDisplays/index';
import { CaseStudyDisplay } from '../components/QuestionDisplays/CaseStudyDisplay';
import '../components/QuestionDisplays/QuestionDisplays.css';
import './ExamInterfacePage.css';

const ExamInterfacePage = () => {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  
  // Additional state for case studies
  const [caseStudies, setCaseStudies] = useState({});
  const [currentSubQuestionIndex, setCurrentSubQuestionIndex] = useState(0);

  useEffect(() => {
    fetchExamData();
  }, [examId, attemptId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitExam(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      
      // Fetch exam details
      const examResponse = await examsAPI.getExamById(examId);
      setExam(examResponse.data.exam);

      // Fetch questions
      const questionsResponse = await examsAPI.getExamQuestions(examId, attemptId);
      setQuestions(questionsResponse.data.questions);

      // Fetch progress to get time remaining and saved answers
      const progressResponse = await attemptsAPI.getProgress(attemptId);
      setTimeRemaining(progressResponse.data.time_remaining_seconds);
      
      // Load saved answers - handle both simple and complex answer formats
      const savedAnswers = {};
      const savedMarked = {};
      progressResponse.data.answers.forEach(answer => {
        // For traditional questions, use selected_option_ids
        // For complex questions, use answer_data or fallback to selected_option_ids
        const answerValue = answer.answer_data ? 
          (typeof answer.answer_data === 'string' ? JSON.parse(answer.answer_data) : answer.answer_data) 
          : answer.selected_option_ids;
        
        savedAnswers[answer.question_id] = answerValue;
        savedMarked[answer.question_id] = answer.marked_for_review;
      });
      setAnswers(savedAnswers);
      setMarkedForReview(savedMarked);
      
      // Load case studies for case study questions
      const caseStudyData = {};
      questionsResponse.data.questions.forEach(q => {
        if (q.question_type === 'case_study' && q.case_study_id) {
          // Case study info should be included in the question data
          caseStudyData[q.case_study_id] = {
            id: q.case_study_id,
            title: q.case_study_title,
            scenario: q.case_study_scenario
          };
        }
      });
      setCaseStudies(caseStudyData);
      
    } catch (error) {
      console.error('Error fetching exam data:', error);
      alert('Failed to load exam. Please try again.');
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = async (questionId, answer, isMultiple = false) => {
    let newAnswer;
    
    // Handle traditional questions (backward compatibility)
    if (typeof answer === 'number' || typeof answer === 'string') {
      const optionId = answer;
      if (isMultiple) {
        // Multiple choice - toggle option
        const currentAnswers = answers[questionId] || [];
        if (currentAnswers.includes(optionId)) {
          newAnswer = currentAnswers.filter(id => id !== optionId);
        } else {
          newAnswer = [...currentAnswers, optionId];
        }
      } else {
        // Single choice - replace answer
        newAnswer = [optionId];
      }
    } else {
      // Handle complex question types (drag/drop, matching, etc.)
      newAnswer = answer;
    }

    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswer
    }));

    // Auto-save answer
    await saveAnswer(questionId, newAnswer);
  };
  
  // Special handler for case study sub-questions
  const handleCaseStudyAnswerChange = async (subQuestionId, answer) => {
    await handleAnswerChange(subQuestionId, answer);
  };
  
  const handleSubQuestionNavigation = (index) => {
    setCurrentSubQuestionIndex(index);
  };

  const saveAnswer = async (questionId, answerData) => {
    try {
      setAutoSaving(true);
      
      const payload = {
        question_id: questionId,
        marked_for_review: markedForReview[questionId] || false
      };
      
      // For traditional questions (arrays of option IDs), use selected_option_ids
      // For complex questions, use answer_data
      if (Array.isArray(answerData) && answerData.every(id => typeof id === 'number' || typeof id === 'string')) {
        payload.selected_option_ids = answerData;
      } else {
        payload.answer_data = typeof answerData === 'string' ? answerData : JSON.stringify(answerData);
        payload.selected_option_ids = []; // Provide empty array for backward compatibility
      }
      
      await attemptsAPI.saveAnswer(attemptId, payload);
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleMarkForReview = async (questionId) => {
    const newMarked = !markedForReview[questionId];
    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: newMarked
    }));

    // Save marked status
    try {
      await attemptsAPI.saveAnswer(attemptId, {
        question_id: questionId,
        selected_option_ids: answers[questionId] || [],
        marked_for_review: newMarked
      });
    } catch (error) {
      console.error('Error saving marked status:', error);
    }
  };

  const handleSubmitExam = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const confirmed = window.confirm(
        'Are you sure you want to submit your exam? You cannot change your answers after submission.'
      );
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      await attemptsAPI.submitExam(attemptId);
      navigate(`/results/${attemptId}`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId) => {
    if (markedForReview[questionId]) return 'marked';
    
    const answer = answers[questionId];
    if (!answer) return 'unanswered';
    
    // For traditional questions (arrays)
    if (Array.isArray(answer) && answer.length > 0) return 'answered';
    
    // For complex questions (objects, strings, etc.)
    if (typeof answer === 'object' && Object.keys(answer).length > 0) return 'answered';
    if (typeof answer === 'string' && answer.trim() !== '') return 'answered';
    
    return 'unanswered';
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(questionId => {
      const answer = answers[questionId];
      if (!answer) return false;
      
      // For traditional questions (arrays)
      if (Array.isArray(answer) && answer.length > 0) return true;
      
      // For complex questions
      if (typeof answer === 'object' && Object.keys(answer).length > 0) return true;
      if (typeof answer === 'string' && answer.trim() !== '') return true;
      
      return false;
    }).length;
  };
  
  const renderQuestion = (question) => {
    const questionAnswer = answers[question.id];
    const questionProps = {
      question,
      answer: questionAnswer,
      onAnswerChange: (answer, isMultiple) => handleAnswerChange(question.id, answer, isMultiple)
    };
    
    switch (question.question_type) {
      case 'single_choice':
      case 'multiple_choice':
      case 'yes_no':
        return <TraditionalQuestionDisplay {...questionProps} />;
        
      case 'hotspot':
        return <HotspotDisplay {...questionProps} />;
        
      case 'drag_drop_ordering':
        return <DragDropOrderingDisplay {...questionProps} />;
        
      case 'build_list':
        return <BuildListDisplay {...questionProps} />;
        
      case 'matching':
        return <MatchingDisplay {...questionProps} />;
        
      case 'fill_in_blank':
        return <FillInBlankDisplay {...questionProps} />;
        
      case 'sequence_ordering':
        return <SequenceOrderingDisplay {...questionProps} />;
        
      case 'simulation':
        return <SimulationDisplay {...questionProps} />;
        
      case 'case_study':
        const caseStudy = caseStudies[question.case_study_id];
        const subQuestions = question.sub_questions || [];
        
        return (
          <CaseStudyDisplay
            question={question}
            caseStudy={caseStudy}
            subQuestions={subQuestions}
            answers={answers}
            onAnswerChange={handleCaseStudyAnswerChange}
            currentSubQuestionIndex={currentSubQuestionIndex}
            onSubQuestionChange={handleSubQuestionNavigation}
          />
        );
        
      default:
        return (
          <div className="question-display">
            <div className="error">
              Unknown question type: {question.question_type}
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isMultipleChoice = currentQuestion?.question_type === 'multiple_choice';
  const isCaseStudyQuestion = currentQuestion?.question_type === 'case_study';

  // Review Screen
  if (showReviewScreen) {
    return (
      <div className="exam-interface">
        <div className="exam-header">
          <div>
            <strong>{exam?.code}</strong> - Review Screen
          </div>
          <div className="exam-timer">
            <span>⏱️</span>
            <span className={timeRemaining < 300 ? 'timer-danger' : timeRemaining < 600 ? 'timer-warning' : ''}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        <div className="container">
          <div className="review-screen">
            <div className="review-header">
              <h1 className="review-title">Review Your Answers</h1>
              <p className="review-subtitle">
                {getAnsweredCount()} of {questions.length} questions answered
              </p>
            </div>

            <div className="review-legend">
              <div className="legend-item">
                <div className="legend-box status-answered"></div>
                <span>Answered</span>
              </div>
              <div className="legend-item">
                <div className="legend-box status-unanswered"></div>
                <span>Unanswered</span>
              </div>
              <div className="legend-item">
                <div className="legend-box status-marked"></div>
                <span>Marked for Review</span>
              </div>
            </div>

            <div className="review-grid">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className={`review-question-box status-${getQuestionStatus(q.id)}`}
                  onClick={() => {
                    setCurrentQuestionIndex(index);
                    setShowReviewScreen(false);
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>

            <div className="review-actions">
              <button 
                onClick={() => setShowReviewScreen(false)} 
                className="btn btn-secondary"
              >
                Continue Exam
              </button>
              <button 
                onClick={() => handleSubmitExam(false)} 
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Exam Interface
  return (
    <div className="exam-interface">
      <div className="exam-header">
        <div>
          <strong>{exam?.code}</strong> - Question {currentQuestionIndex + 1} of {questions.length}
          {autoSaving && <span style={{ marginLeft: '15px', fontSize: '14px' }}>💾 Saving...</span>}
        </div>
        <div className="exam-timer">
          <span>⏱️</span>
          <span className={timeRemaining < 300 ? 'timer-danger' : timeRemaining < 600 ? 'timer-warning' : ''}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      <div className="exam-content">
        <div className="question-panel">
          {/* Header for case studies is handled within CaseStudyDisplay */}
          {!isCaseStudyQuestion && (
            <div className="question-header">
              <div className="question-number">
                Question {currentQuestionIndex + 1}
              </div>
              <button
                onClick={() => handleMarkForReview(currentQuestion.id)}
                className={`mark-review-btn ${markedForReview[currentQuestion.id] ? 'marked' : ''}`}
              >
                {markedForReview[currentQuestion.id] ? '⭐ Marked' : '☆ Mark for Review'}
              </button>
            </div>
          )}
          
          {/* Render the appropriate question component */}
          {renderQuestion(currentQuestion)}

          <div className="exam-navigation">
            <div className="nav-buttons">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="btn btn-secondary"
              >
                ← Previous
              </button>
              <button
                onClick={() => setShowReviewScreen(true)}
                className="btn btn-outline"
              >
                Review Screen
              </button>
            </div>
            <div className="nav-buttons">
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="btn btn-primary"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => handleSubmitExam(false)}
                  className="btn btn-success"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Exam'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterfacePage;