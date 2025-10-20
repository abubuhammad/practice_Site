import React, { useState, useEffect } from 'react';
import { 
  TraditionalQuestionDisplay,
  HotspotDisplay,
  DragDropOrderingDisplay,
  BuildListDisplay,
  MatchingDisplay,
  FillInBlankDisplay,
  SequenceOrderingDisplay,
  SimulationDisplay
} from './index';

export const CaseStudyDisplay = ({ 
  question, 
  caseStudy, 
  subQuestions = [], 
  answers = {}, 
  onAnswerChange, 
  currentSubQuestionIndex = 0,
  onSubQuestionChange,
  showAllQuestions = false 
}) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // If no sub-questions provided, try to get from question object
  const questionsToDisplay = subQuestions.length > 0 ? subQuestions : 
    (question.sub_questions || []);
  
  const currentSubQuestion = questionsToDisplay[currentSubQuestionIndex] || questionsToDisplay[0];
  
  const handleSubQuestionAnswer = (questionId, answer, isMultipleChoice = false) => {
    let newAnswer;
    
    if (isMultipleChoice) {
      const currentAnswers = answers[questionId] || [];
      if (currentAnswers.includes(answer)) {
        newAnswer = currentAnswers.filter(id => id !== answer);
      } else {
        newAnswer = [...currentAnswers, answer];
      }
    } else {
      newAnswer = Array.isArray(answer) ? answer : [answer];
    }
    
    onAnswerChange(questionId, newAnswer);
  };
  
  const renderSubQuestion = (subQuestion, index) => {
    const subQuestionAnswer = answers[subQuestion.id] || [];
    
    // Create a props object for the sub-question component
    const subQuestionProps = {
      question: subQuestion,
      answer: subQuestionAnswer,
      onAnswerChange: (answer, isMultipleChoice) => 
        handleSubQuestionAnswer(subQuestion.id, answer, isMultipleChoice)
    };
    
    // Render appropriate component based on question type
    switch (subQuestion.question_type) {
      case 'single_choice':
      case 'multiple_choice':
      case 'yes_no':
        return (
          <TraditionalQuestionDisplay 
            key={subQuestion.id}
            {...subQuestionProps}
          />
        );
        
      case 'hotspot':
        return (
          <HotspotDisplay 
            key={subQuestion.id}
            {...subQuestionProps}
          />
        );
        
      case 'drag_drop_ordering':
        return (
          <DragDropOrderingDisplay 
            key={subQuestion.id}
            {...subQuestionProps}
          />
        );
        
      case 'build_list':
        return (
          <BuildListDisplay 
            key={subQuestion.id}
            {...subQuestionProps}
          />
        );
        
      case 'matching':
        return (
          <MatchingDisplay 
            key={subQuestion.id}
            {...subQuestionProps}
          />
        );
        
      case 'fill_in_blank':
        return (
          <FillInBlankDisplay 
            key={subQuestion.id}
            {...subQuestionProps}
          />
        );
        
      case 'sequence_ordering':
        return (
          <SequenceOrderingDisplay 
            key={subQuestion.id}
            {...subQuestionProps}
          />
        );
        
      case 'simulation':
        return (
          <SimulationDisplay 
            key={subQuestion.id}
            {...subQuestionProps}
          />
        );
        
      default:
        return (
          <div key={subQuestion.id} className="question-display">
            <div className="error">
              Unknown question type: {subQuestion.question_type}
            </div>
          </div>
        );
    }
  };
  
  if (!caseStudy && !question.case_study_id) {
    return (
      <div className="question-display case-study-display">
        <div className="error">
          Case study data not available.
        </div>
      </div>
    );
  }
  
  const displayCaseStudy = caseStudy || { 
    title: question.case_study_title, 
    scenario: question.case_study_scenario 
  };
  
  return (
    <div className="question-display case-study-display">
      <div className="question-type-badge">
        Case Study
      </div>
      
      {/* Case Study Header */}
      <div className="case-study-header">
        <h2 className="case-study-title">
          {displayCaseStudy.title || 'Case Study'}
        </h2>
      </div>
      
      {/* Case Study Layout */}
      <div className="case-study-layout">
        {/* Left Panel: Case Study Scenario */}
        <div className="case-study-scenario-panel">
          <div className="scenario-header">
            <h3>Scenario</h3>
          </div>
          <div className="scenario-content">
            <div className="scenario-text">
              {displayCaseStudy.scenario || question.text}
            </div>
          </div>
          
          {/* Question Navigation (if multiple questions) */}
          {questionsToDisplay.length > 1 && !showAllQuestions && (
            <div className="question-navigation">
              <h4>Questions in this Case Study:</h4>
              <div className="question-tabs">
                {questionsToDisplay.map((subQ, index) => (
                  <button
                    key={subQ.id}
                    className={`question-tab ${index === currentSubQuestionIndex ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(index);
                      if (onSubQuestionChange) {
                        onSubQuestionChange(index);
                      }
                    }}
                  >
                    Question {index + 1}
                    {answers[subQ.id] && answers[subQ.id].length > 0 && (
                      <span className="answered-indicator">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel: Current Question */}
        <div className="case-study-question-panel">
          {showAllQuestions ? (
            /* Show all questions at once */
            <div className="all-questions-container">
              <h3>All Questions ({questionsToDisplay.length})</h3>
              {questionsToDisplay.map((subQuestion, index) => (
                <div key={subQuestion.id} className="case-study-sub-question">
                  <div className="sub-question-header">
                    <h4>Question {index + 1}</h4>
                  </div>
                  {renderSubQuestion(subQuestion, index)}
                </div>
              ))}
            </div>
          ) : (
            /* Show current question only */
            <div className="current-question-container">
              {currentSubQuestion ? (
                <>
                  <div className="sub-question-header">
                    <h3>
                      Question {currentSubQuestionIndex + 1} of {questionsToDisplay.length}
                    </h3>
                  </div>
                  {renderSubQuestion(currentSubQuestion, currentSubQuestionIndex)}
                  
                  {/* Navigation buttons */}
                  {questionsToDisplay.length > 1 && (
                    <div className="case-study-navigation">
                      <button
                        className="btn btn-secondary"
                        disabled={currentSubQuestionIndex === 0}
                        onClick={() => {
                          const newIndex = Math.max(0, currentSubQuestionIndex - 1);
                          setActiveTab(newIndex);
                          if (onSubQuestionChange) {
                            onSubQuestionChange(newIndex);
                          }
                        }}
                      >
                        ← Previous Question
                      </button>
                      
                      <span className="question-counter">
                        {currentSubQuestionIndex + 1} / {questionsToDisplay.length}
                      </span>
                      
                      <button
                        className="btn btn-secondary"
                        disabled={currentSubQuestionIndex === questionsToDisplay.length - 1}
                        onClick={() => {
                          const newIndex = Math.min(questionsToDisplay.length - 1, currentSubQuestionIndex + 1);
                          setActiveTab(newIndex);
                          if (onSubQuestionChange) {
                            onSubQuestionChange(newIndex);
                          }
                        }}
                      >
                        Next Question →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-questions">
                  <p>No questions available for this case study.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Case Study Footer */}
      <div className="case-study-footer">
        <div className="progress-summary">
          <strong>
            Questions Answered: {
              Object.keys(answers).filter(questionId => 
                answers[questionId] && answers[questionId].length > 0
              ).length
            } / {questionsToDisplay.length}
          </strong>
        </div>
        
        {questionsToDisplay.length > 1 && (
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              // Toggle between showing all questions and showing one at a time
              // This would need to be handled by parent component
            }}
          >
            {showAllQuestions ? 'Show One at a Time' : 'Show All Questions'}
          </button>
        )}
      </div>
    </div>
  );
};