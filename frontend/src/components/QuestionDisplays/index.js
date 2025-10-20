import React, { useState } from 'react';

// Traditional question display (single_choice, multiple_choice, yes_no)
export const TraditionalQuestionDisplay = ({ question, answer, onAnswerChange }) => {
  const isMultipleChoice = question.question_type === 'multiple_choice';
  
  return (
    <div className="question-display traditional-question">
      <div className="question-type-badge">
        {isMultipleChoice ? 'Multiple Choice (Select all that apply)' : 'Single Choice'}
      </div>
      
      <div className="question-text">
        {question.text}
      </div>
      
      <ul className="options-list">
        {question.options.map((option) => {
          const isSelected = answer?.includes(option.id) || false;
          
          return (
            <li
              key={option.id}
              className={`option-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onAnswerChange(option.id, isMultipleChoice)}
            >
              <input
                type={isMultipleChoice ? 'checkbox' : 'radio'}
                className={isMultipleChoice ? 'option-checkbox' : 'option-radio'}
                checked={isSelected}
                onChange={() => {}}
                readOnly
              />
              <span className="option-text">{option.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// Drag Drop Ordering display
export const DragDropOrderingDisplay = ({ question, answer, onAnswerChange }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const dragItems = question.drag_drop_ordering_data?.drag_items || [];
  const dropZones = question.drag_drop_ordering_data?.drop_zones || [];
  
  // Initialize answer if not exists
  const currentAnswer = answer || {};
  
  const handleDragStart = (item) => {
    setDraggedItem(item);
  };
  
  const handleDrop = (zone, e) => {
    e.preventDefault();
    if (draggedItem) {
      const newAnswer = {
        ...currentAnswer,
        [draggedItem.id]: zone.id
      };
      onAnswerChange(newAnswer);
      setDraggedItem(null);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  return (
    <div className="question-display drag-drop-ordering-display">
      <div className="question-type-badge">
        Drag and Drop Ordering
      </div>
      
      <div className="question-text">
        {question.text}
      </div>
      
      {question.drag_drop_ordering_data?.instructions && (
        <div className="instructions">
          {question.drag_drop_ordering_data.instructions}
        </div>
      )}
      
      <div className="drag-drop-container">
        <div className="drag-items-section">
          <h4>Items to Drag:</h4>
          <div className="drag-items">
            {dragItems.map((item) => (
              <div
                key={item.id}
                className={`drag-item ${Object.values(currentAnswer).includes(item.id) ? 'placed' : ''}`}
                draggable={!Object.values(currentAnswer).includes(item.id)}
                onDragStart={() => handleDragStart(item)}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>
        
        <div className="drop-zones-section">
          <h4>Drop Zones:</h4>
          <div className="drop-zones">
            {dropZones.map((zone) => {
              const placedItem = dragItems.find(item => currentAnswer[item.id] === zone.id);
              
              return (
                <div
                  key={zone.id}
                  className={`drop-zone ${placedItem ? 'filled' : ''}`}
                  onDrop={(e) => handleDrop(zone, e)}
                  onDragOver={handleDragOver}
                >
                  <div className="zone-label">{zone.label}</div>
                  {placedItem && (
                    <div className="placed-item">
                      {placedItem.text}
                      <button 
                        onClick={() => {
                          const newAnswer = { ...currentAnswer };
                          delete newAnswer[placedItem.id];
                          onAnswerChange(newAnswer);
                        }}
                        className="remove-item"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Build List display
export const BuildListDisplay = ({ question, answer, onAnswerChange }) => {
  const availableItems = question.build_list_data?.available_items || [];
  const maxItems = question.build_list_data?.max_items;
  const currentList = answer || [];
  
  const addToList = (item) => {
    if (maxItems && currentList.length >= maxItems) {
      alert(`Maximum ${maxItems} items allowed`);
      return;
    }
    if (!currentList.find(listItem => listItem.id === item.id)) {
      onAnswerChange([...currentList, { ...item, order: currentList.length + 1 }]);
    }
  };
  
  const removeFromList = (itemId) => {
    const newList = currentList
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index + 1 }));
    onAnswerChange(newList);
  };
  
  const moveItem = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === currentList.length - 1)
    ) {
      return;
    }
    
    const newList = [...currentList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    
    // Update order numbers
    const updatedList = newList.map((item, idx) => ({ ...item, order: idx + 1 }));
    onAnswerChange(updatedList);
  };
  
  return (
    <div className="question-display build-list-display">
      <div className="question-type-badge">
        Build List
      </div>
      
      <div className="question-text">
        {question.text}
      </div>
      
      {question.build_list_data?.instructions && (
        <div className="instructions">
          {question.build_list_data.instructions}
        </div>
      )}
      
      <div className="build-list-container">
        <div className="available-items-section">
          <h4>Available Items:</h4>
          <div className="available-items">
            {availableItems.map((item) => (
              <div
                key={item.id}
                className={`available-item ${currentList.find(listItem => listItem.id === item.id) ? 'used' : ''}`}
                onClick={() => addToList(item)}
              >
                <div className="item-text">{item.text}</div>
                {item.category && <div className="item-category">{item.category}</div>}
              </div>
            ))}
          </div>
        </div>
        
        <div className="build-list-section">
          <h4>Your List {maxItems && `(${currentList.length}/${maxItems})`}:</h4>
          <div className="built-list">
            {currentList.length === 0 ? (
              <div className="empty-list">No items added yet. Click items from the left to add them.</div>
            ) : (
              currentList.map((item, index) => (
                <div key={item.id} className="list-item">
                  <span className="item-order">{index + 1}.</span>
                  <span className="item-text">{item.text}</span>
                  <div className="item-controls">
                    {index > 0 && (
                      <button onClick={() => moveItem(index, 'up')} className="btn-move">↑</button>
                    )}
                    {index < currentList.length - 1 && (
                      <button onClick={() => moveItem(index, 'down')} className="btn-move">↓</button>
                    )}
                    <button onClick={() => removeFromList(item.id)} className="btn-remove">×</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Matching display
export const MatchingDisplay = ({ question, answer, onAnswerChange }) => {
  const leftColumn = question.matching_data?.left_column || [];
  const rightColumn = question.matching_data?.right_column || [];
  const allowMultiple = question.matching_data?.allow_multiple_matches || false;
  const currentMatches = answer || [];
  
  const toggleMatch = (leftId, rightId) => {
    const existingMatch = currentMatches.find(
      match => match.left_id === leftId && match.right_id === rightId
    );
    
    if (existingMatch) {
      // Remove the match
      onAnswerChange(currentMatches.filter(
        match => !(match.left_id === leftId && match.right_id === rightId)
      ));
    } else {
      // Add the match
      let newMatches = [...currentMatches];
      
      // If multiple matches not allowed, remove existing matches for this left item
      if (!allowMultiple) {
        newMatches = newMatches.filter(match => match.left_id !== leftId);
      }
      
      newMatches.push({ left_id: leftId, right_id: rightId });
      onAnswerChange(newMatches);
    }
  };
  
  const isMatched = (leftId, rightId) => {
    return currentMatches.some(match => match.left_id === leftId && match.right_id === rightId);
  };
  
  return (
    <div className="question-display matching-display">
      <div className="question-type-badge">
        Matching
      </div>
      
      <div className="question-text">
        {question.text}
      </div>
      
      {question.matching_data?.instructions && (
        <div className="instructions">
          {question.matching_data.instructions}
        </div>
      )}
      
      <div className="matching-container">
        {leftColumn.map((leftItem) => (
          <div key={leftItem.id} className="matching-row">
            <div className="left-item">
              {leftItem.text}
            </div>
            <div className="match-options">
              {rightColumn.map((rightItem) => (
                <button
                  key={rightItem.id}
                  className={`match-button ${isMatched(leftItem.id, rightItem.id) ? 'matched' : ''}`}
                  onClick={() => toggleMatch(leftItem.id, rightItem.id)}
                  title={rightItem.text}
                >
                  {rightItem.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="match-summary">
        <strong>Matches made: {currentMatches.length}</strong>
      </div>
    </div>
  );
};

// Fill in Blank display
export const FillInBlankDisplay = ({ question, answer, onAnswerChange }) => {
  const template = question.fill_in_blank_data?.question_template || '';
  const blanks = question.fill_in_blank_data?.blanks || [];
  const currentAnswers = answer || {};
  
  const handleBlankChange = (blankNumber, value) => {
    onAnswerChange({
      ...currentAnswers,
      [blankNumber]: value
    });
  };
  
  // Render the template with input fields
  const renderTemplate = () => {
    let renderedTemplate = template;
    
    blanks.forEach((blank) => {
      const blankPattern = new RegExp(`\\[BLANK_${blank.blank_number}\\]`, 'g');
      const inputField = `<input type="text" class="blank-input" data-blank="${blank.blank_number}" value="${currentAnswers[blank.blank_number] || ''}" placeholder="Enter answer..." />`;
      renderedTemplate = renderedTemplate.replace(blankPattern, inputField);
    });
    
    return { __html: renderedTemplate };
  };
  
  // Handle input changes in the rendered template
  const handleTemplateInputChange = (e) => {
    if (e.target.classList.contains('blank-input')) {
      const blankNumber = parseInt(e.target.dataset.blank);
      handleBlankChange(blankNumber, e.target.value);
    }
  };
  
  return (
    <div className="question-display fill-in-blank-display">
      <div className="question-type-badge">
        Fill in the Blank
      </div>
      
      <div className="question-text">
        {question.text}
      </div>
      
      <div 
        className="template-container"
        dangerouslySetInnerHTML={renderTemplate()}
        onChange={handleTemplateInputChange}
      />
      
      <div className="blanks-summary">
        <strong>Blanks filled: {Object.keys(currentAnswers).length} / {blanks.length}</strong>
      </div>
    </div>
  );
};

// Hotspot display
export const HotspotDisplay = ({ question, answer, onAnswerChange }) => {
  const hotspotData = question.hotspot_data;
  const hotspotAreas = question.hotspot_areas || [];
  const selectedAreas = answer || [];
  
  const handleAreaClick = (areaId) => {
    if (selectedAreas.includes(areaId)) {
      onAnswerChange(selectedAreas.filter(id => id !== areaId));
    } else {
      onAnswerChange([...selectedAreas, areaId]);
    }
  };
  
  if (!hotspotData?.image_url) {
    return (
      <div className="question-display hotspot-display">
        <div className="question-type-badge">Hotspot</div>
        <div className="question-text">{question.text}</div>
        <div className="error">Hotspot image not available.</div>
      </div>
    );
  }
  
  return (
    <div className="question-display hotspot-display">
      <div className="question-type-badge">
        Hotspot
      </div>
      
      <div className="question-text">
        {question.text}
      </div>
      
      {hotspotData.instructions && (
        <div className="instructions">
          {hotspotData.instructions}
        </div>
      )}
      
      <div className="hotspot-container">
        <div 
          className="hotspot-image-container"
          style={{ 
            position: 'relative',
            width: hotspotData.image_width || 800,
            height: hotspotData.image_height || 600,
            maxWidth: '100%',
            margin: '0 auto'
          }}
        >
          <img
            src={hotspotData.image_url}
            alt="Hotspot question"
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'contain',
              border: '1px solid #ccc'
            }}
          />
          
          {hotspotAreas.map((area) => {
            const isSelected = selectedAreas.includes(area.id);
            const coords = area.coordinates;
            
            return (
              <div
                key={area.id}
                className={`hotspot-area ${isSelected ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${(coords.x / hotspotData.image_width) * 100}%`,
                  top: `${(coords.y / hotspotData.image_height) * 100}%`,
                  width: `${(coords.width / hotspotData.image_width) * 100}%`,
                  height: `${(coords.height / hotspotData.image_height) * 100}%`,
                  border: '2px solid transparent',
                  backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: isSelected ? '#007bff' : '#ddd',
                  cursor: 'pointer'
                }}
                onClick={() => handleAreaClick(area.id)}
                title={area.label || 'Click to select'}
              />
            );
          })}
        </div>
        
        <div className="hotspot-summary">
          <strong>Areas selected: {selectedAreas.length}</strong>
        </div>
      </div>
    </div>
  );
};

// Placeholder for advanced question types
export const SimulationDisplay = ({ question }) => (
  <div className="question-display simulation-display">
    <div className="question-type-badge">Simulation</div>
    <div className="question-text">{question.text}</div>
    <div className="simulation-placeholder">
      <h3>🖥️ Simulation Environment</h3>
      <p>This would be an interactive simulation environment.</p>
      <div className="alert alert-info">
        Simulation questions are not yet fully implemented for the exam interface.
      </div>
    </div>
  </div>
);

export const SequenceOrderingDisplay = ({ question, answer, onAnswerChange }) => {
  const sequenceItems = question.sequence_ordering_data?.sequence_items || [];
  const currentOrder = answer || [];
  
  // Initialize order if not set
  if (currentOrder.length === 0 && sequenceItems.length > 0) {
    const shuffledItems = [...sequenceItems].sort(() => Math.random() - 0.5);
    onAnswerChange(shuffledItems.map(item => item.id));
  }
  
  const moveItem = (fromIndex, toIndex) => {
    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    onAnswerChange(newOrder);
  };
  
  const getItemById = (id) => sequenceItems.find(item => item.id === id);
  
  return (
    <div className="question-display sequence-ordering-display">
      <div className="question-type-badge">Sequence Ordering</div>
      <div className="question-text">{question.text}</div>
      
      {question.sequence_ordering_data?.instructions && (
        <div className="instructions">{question.sequence_ordering_data.instructions}</div>
      )}
      
      <div className="sequence-container">
        <h4>Put these items in the correct order:</h4>
        <div className="sequence-items">
          {currentOrder.map((itemId, index) => {
            const item = getItemById(itemId);
            if (!item) return null;
            
            return (
              <div key={itemId} className="sequence-item">
                <span className="item-number">{index + 1}.</span>
                <span className="item-text">{item.text}</span>
                <div className="item-controls">
                  {index > 0 && (
                    <button onClick={() => moveItem(index, index - 1)} className="btn-move">↑</button>
                  )}
                  {index < currentOrder.length - 1 && (
                    <button onClick={() => moveItem(index, index + 1)} className="btn-move">↓</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};