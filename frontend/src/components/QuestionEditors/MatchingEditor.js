import React, { useState, useEffect } from 'react';

const MatchingEditor = ({ data, onChange, errors = {} }) => {
  const [instructions, setInstructions] = useState('');
  const [leftColumn, setLeftColumn] = useState([
    { id: 1, text: '' }
  ]);
  const [rightColumn, setRightColumn] = useState([
    { id: 1, text: '' }
  ]);
  const [correctMatches, setCorrectMatches] = useState([]);
  const [allowMultipleMatches, setAllowMultipleMatches] = useState(false);

  // Initialize from existing data
  useEffect(() => {
    if (data) {
      setInstructions(data.instructions || '');
      setLeftColumn(data.left_column || [{ id: 1, text: '' }]);
      setRightColumn(data.right_column || [{ id: 1, text: '' }]);
      setCorrectMatches(data.correct_matches || []);
      setAllowMultipleMatches(data.allow_multiple_matches || false);
    }
  }, [data]);

  // Update parent component when data changes
  useEffect(() => {
    onChange({
      instructions,
      left_column: leftColumn,
      right_column: rightColumn,
      correct_matches: correctMatches,
      allow_multiple_matches: allowMultipleMatches
    });
  }, [instructions, leftColumn, rightColumn, correctMatches, allowMultipleMatches, onChange]);

  const addLeftItem = () => {
    const newId = Math.max(...leftColumn.map(item => item.id), 0) + 1;
    setLeftColumn([...leftColumn, { id: newId, text: '' }]);
  };

  const removeLeftItem = (id) => {
    if (leftColumn.length <= 1) {
      alert('Must have at least one item in the left column');
      return;
    }
    setLeftColumn(leftColumn.filter(item => item.id !== id));
    // Remove any matches involving this item
    setCorrectMatches(correctMatches.filter(match => match.left_id !== id));
  };

  const updateLeftItem = (id, text) => {
    setLeftColumn(leftColumn.map(item =>
      item.id === id ? { ...item, text } : item
    ));
  };

  const addRightItem = () => {
    const newId = Math.max(...rightColumn.map(item => item.id), 0) + 1;
    setRightColumn([...rightColumn, { id: newId, text: '' }]);
  };

  const removeRightItem = (id) => {
    if (rightColumn.length <= 1) {
      alert('Must have at least one item in the right column');
      return;
    }
    setRightColumn(rightColumn.filter(item => item.id !== id));
    // Remove any matches involving this item
    setCorrectMatches(correctMatches.filter(match => match.right_id !== id));
  };

  const updateRightItem = (id, text) => {
    setRightColumn(rightColumn.map(item =>
      item.id === id ? { ...item, text } : item
    ));
  };

  const addMatch = (leftId, rightId) => {
    // Check if match already exists
    const existsMatch = correctMatches.find(
      match => match.left_id === leftId && match.right_id === rightId
    );
    if (existsMatch) {
      alert('This match already exists');
      return;
    }

    // If multiple matches not allowed, remove existing matches for this left item
    let newMatches = [...correctMatches];
    if (!allowMultipleMatches) {
      newMatches = newMatches.filter(match => match.left_id !== leftId);
    }

    newMatches.push({ left_id: leftId, right_id: rightId });
    setCorrectMatches(newMatches);
  };

  const removeMatch = (leftId, rightId) => {
    setCorrectMatches(correctMatches.filter(
      match => !(match.left_id === leftId && match.right_id === rightId)
    ));
  };

  const getLeftItemText = (leftId) => {
    const item = leftColumn.find(item => item.id === leftId);
    return item ? item.text : 'Unknown';
  };

  const getRightItemText = (rightId) => {
    const item = rightColumn.find(item => item.id === rightId);
    return item ? item.text : 'Unknown';
  };

  return (
    <div className="question-editor matching-editor">
      <h4>Matching Question</h4>
      
      <div className="form-group">
        <label className="form-label">Instructions</label>
        <textarea
          className="form-input"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instructions for the matching question (e.g., 'Match each item on the left with the correct item on the right')"
          rows="3"
        />
        {errors.instructions && <span className="error-text">{errors.instructions}</span>}
      </div>

      <div className="form-group">
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={allowMultipleMatches}
            onChange={(e) => setAllowMultipleMatches(e.target.checked)}
          />
          Allow one left item to match multiple right items
        </label>
      </div>

      <div className="matching-columns">
        {/* Left Column */}
        <div className="column-section">
          <div className="section-header">
            <label className="form-label">Left Column</label>
            <button 
              type="button" 
              className="btn btn-sm btn-secondary"
              onClick={addLeftItem}
            >
              + Add Item
            </button>
          </div>
          
          {leftColumn.map((item, index) => (
            <div key={item.id} className="item-editor">
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    value={item.text}
                    onChange={(e) => updateLeftItem(item.id, e.target.value)}
                    placeholder={`Left item ${index + 1}`}
                    required
                  />
                </div>
                {leftColumn.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeLeftItem(item.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="column-section">
          <div className="section-header">
            <label className="form-label">Right Column</label>
            <button 
              type="button" 
              className="btn btn-sm btn-secondary"
              onClick={addRightItem}
            >
              + Add Item
            </button>
          </div>
          
          {rightColumn.map((item, index) => (
            <div key={item.id} className="item-editor">
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    value={item.text}
                    onChange={(e) => updateRightItem(item.id, e.target.value)}
                    placeholder={`Right item ${index + 1}`}
                    required
                  />
                </div>
                {rightColumn.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeRightItem(item.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Correct Matches */}
      <div className="form-section">
        <label className="form-label">Set Correct Matches</label>
        
        <div className="matches-grid">
          {leftColumn
            .filter(leftItem => leftItem.text.trim())
            .map((leftItem) => (
              <div key={leftItem.id} className="match-row">
                <div className="left-item-label">
                  {leftItem.text}
                </div>
                <div className="match-controls">
                  {rightColumn
                    .filter(rightItem => rightItem.text.trim())
                    .map((rightItem) => {
                      const isMatched = correctMatches.some(
                        match => match.left_id === leftItem.id && match.right_id === rightItem.id
                      );
                      
                      return (
                        <button
                          key={rightItem.id}
                          type="button"
                          className={`btn btn-sm ${isMatched ? 'btn-success' : 'btn-outline'}`}
                          onClick={() => {
                            if (isMatched) {
                              removeMatch(leftItem.id, rightItem.id);
                            } else {
                              addMatch(leftItem.id, rightItem.id);
                            }
                          }}
                          title={rightItem.text}
                        >
                          {rightItem.text.length > 20 
                            ? rightItem.text.substring(0, 20) + '...' 
                            : rightItem.text
                          }
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>

        {/* Current Matches Summary */}
        {correctMatches.length > 0 && (
          <div className="matches-summary">
            <h5>Current Matches:</h5>
            <ul>
              {correctMatches.map((match, index) => (
                <li key={index}>
                  <strong>{getLeftItemText(match.left_id)}</strong> ↔ {getRightItemText(match.right_id)}
                  <button
                    type="button"
                    className="btn btn-xs btn-danger"
                    onClick={() => removeMatch(match.left_id, match.right_id)}
                    style={{ marginLeft: '10px' }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {errors.general && (
        <div className="alert alert-error">
          {errors.general}
        </div>
      )}
    </div>
  );
};

export default MatchingEditor;