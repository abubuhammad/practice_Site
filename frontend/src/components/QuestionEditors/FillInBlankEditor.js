import React, { useState, useEffect } from 'react';

const FillInBlankEditor = ({ data, onChange, errors = {} }) => {
  const [questionTemplate, setQuestionTemplate] = useState('');
  const [blanks, setBlanks] = useState([]);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [partialCredit, setPartialCredit] = useState(true);

  // Initialize from existing data
  useEffect(() => {
    if (data) {
      setQuestionTemplate(data.question_template || '');
      setBlanks(data.blanks || []);
      setCaseSensitive(data.case_sensitive || false);
      setPartialCredit(data.partial_credit !== undefined ? data.partial_credit : true);
    }
  }, [data]);

  // Update parent component when data changes
  useEffect(() => {
    onChange({
      question_template: questionTemplate,
      blanks,
      case_sensitive: caseSensitive,
      partial_credit: partialCredit
    });
  }, [questionTemplate, blanks, caseSensitive, partialCredit, onChange]);

  // Extract blanks from question template
  useEffect(() => {
    const blankPattern = /\[BLANK_(\d+)\]/g;
    const matches = [...questionTemplate.matchAll(blankPattern)];
    const blankNumbers = matches.map(match => parseInt(match[1]));
    const uniqueBlankNumbers = [...new Set(blankNumbers)].sort((a, b) => a - b);

    // Update blanks array to match the blanks found in the template
    const newBlanks = uniqueBlankNumbers.map(num => {
      const existingBlank = blanks.find(blank => blank.blank_number === num);
      return existingBlank || {
        blank_number: num,
        possible_answers: [''],
        correct_answer: ''
      };
    });

    // Only update if there's actually a change to avoid infinite loops
    if (JSON.stringify(newBlanks) !== JSON.stringify(blanks)) {
      setBlanks(newBlanks);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionTemplate]); // Don't include blanks in dependencies to avoid loop

  const updateBlank = (blankNumber, field, value) => {
    setBlanks(blanks.map(blank =>
      blank.blank_number === blankNumber ? { ...blank, [field]: value } : blank
    ));
  };

  const updatePossibleAnswer = (blankNumber, index, value) => {
    setBlanks(blanks.map(blank => {
      if (blank.blank_number === blankNumber) {
        const newPossibleAnswers = [...blank.possible_answers];
        newPossibleAnswers[index] = value;
        return { ...blank, possible_answers: newPossibleAnswers };
      }
      return blank;
    }));
  };

  const addPossibleAnswer = (blankNumber) => {
    setBlanks(blanks.map(blank =>
      blank.blank_number === blankNumber 
        ? { ...blank, possible_answers: [...blank.possible_answers, ''] }
        : blank
    ));
  };

  const removePossibleAnswer = (blankNumber, index) => {
    setBlanks(blanks.map(blank => {
      if (blank.blank_number === blankNumber && blank.possible_answers.length > 1) {
        const newPossibleAnswers = blank.possible_answers.filter((_, i) => i !== index);
        return { ...blank, possible_answers: newPossibleAnswers };
      }
      return blank;
    }));
  };

  const insertBlankAtCursor = () => {
    const nextBlankNumber = Math.max(...blanks.map(b => b.blank_number), 0) + 1;
    const blankText = `[BLANK_${nextBlankNumber}]`;
    
    // Insert at cursor position or at the end
    const textarea = document.querySelector('.question-template-input');
    if (textarea) {
      const cursorPosition = textarea.selectionStart;
      const textBefore = questionTemplate.substring(0, cursorPosition);
      const textAfter = questionTemplate.substring(cursorPosition);
      setQuestionTemplate(textBefore + blankText + textAfter);
    } else {
      setQuestionTemplate(questionTemplate + blankText);
    }
  };

  const previewQuestion = () => {
    let preview = questionTemplate;
    blanks.forEach(blank => {
      const blankPattern = new RegExp(`\\[BLANK_${blank.blank_number}\\]`, 'g');
      preview = preview.replace(blankPattern, `_______ (Blank ${blank.blank_number})`);
    });
    return preview;
  };

  return (
    <div className="question-editor fill-in-blank-editor">
      <h4>Fill in the Blank Question</h4>
      
      <div className="form-group">
        <div className="form-label-with-action">
          <label className="form-label">Question Template *</label>
          <button 
            type="button" 
            className="btn btn-sm btn-info"
            onClick={insertBlankAtCursor}
          >
            Insert Blank
          </button>
        </div>
        <textarea
          className="form-input question-template-input"
          value={questionTemplate}
          onChange={(e) => setQuestionTemplate(e.target.value)}
          placeholder="Enter your question with blanks like: The capital of France is [BLANK_1] and it has [BLANK_2] million people."
          rows="4"
          required
        />
        <small className="form-help">
          Use [BLANK_1], [BLANK_2], etc. to mark where blanks should appear. You can use the "Insert Blank" button or type them manually.
        </small>
        {errors.question_template && <span className="error-text">{errors.question_template}</span>}
      </div>

      {/* Preview */}
      {questionTemplate && (
        <div className="form-group">
          <label className="form-label">Preview</label>
          <div className="question-preview">
            {previewQuestion()}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="form-row">
        <div className="form-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            Case sensitive answers
          </label>
        </div>
        <div className="form-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={partialCredit}
              onChange={(e) => setPartialCredit(e.target.checked)}
            />
            Allow partial credit for multiple possible answers
          </label>
        </div>
      </div>

      {/* Blank Configuration */}
      {blanks.length > 0 && (
        <div className="form-section">
          <label className="form-label">Configure Blanks</label>
          
          {blanks.map((blank) => (
            <div key={blank.blank_number} className="blank-config">
              <h5>Blank {blank.blank_number}</h5>
              
              <div className="form-group">
                <label className="form-label">Correct Answer</label>
                <input
                  type="text"
                  className="form-input"
                  value={blank.correct_answer}
                  onChange={(e) => updateBlank(blank.blank_number, 'correct_answer', e.target.value)}
                  placeholder="Enter the correct answer"
                  required
                />
              </div>

              <div className="form-group">
                <div className="form-label-with-action">
                  <label className="form-label">Alternative Acceptable Answers</label>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-secondary"
                    onClick={() => addPossibleAnswer(blank.blank_number)}
                  >
                    + Add Alternative
                  </button>
                </div>
                
                {blank.possible_answers.map((answer, index) => (
                  <div key={index} className="possible-answer-row">
                    <input
                      type="text"
                      className="form-input"
                      value={answer}
                      onChange={(e) => updatePossibleAnswer(blank.blank_number, index, e.target.value)}
                      placeholder={`Alternative answer ${index + 1}`}
                    />
                    {blank.possible_answers.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removePossibleAnswer(blank.blank_number, index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                
                <small className="form-help">
                  Add alternative acceptable answers (e.g., abbreviations, synonyms). 
                  Leave blank if only the correct answer should be accepted.
                </small>
              </div>
            </div>
          ))}
        </div>
      )}

      {blanks.length === 0 && questionTemplate && (
        <div className="alert alert-warning">
          No blanks detected in your question template. Make sure to use the format [BLANK_1], [BLANK_2], etc.
        </div>
      )}

      {errors.general && (
        <div className="alert alert-error">
          {errors.general}
        </div>
      )}
    </div>
  );
};

export default FillInBlankEditor;