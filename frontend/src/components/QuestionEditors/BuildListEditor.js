import React, { useState, useEffect } from 'react';

const BuildListEditor = ({ data, onChange, errors = {} }) => {
  const [instructions, setInstructions] = useState('');
  const [availableItems, setAvailableItems] = useState([
    { id: 1, text: '', category: '' }
  ]);
  const [correctList, setCorrectList] = useState([]);
  const [maxItems, setMaxItems] = useState('');
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  // Initialize from existing data
  useEffect(() => {
    if (data) {
      setInstructions(data.instructions || '');
      setAvailableItems(data.available_items || [{ id: 1, text: '', category: '' }]);
      setCorrectList(data.correct_list || []);
      setMaxItems(data.max_items?.toString() || '');
      setAllowDuplicates(data.allow_duplicates || false);
    }
  }, [data]);

  // Update parent component when data changes
  useEffect(() => {
    const dataToSend = {
      instructions,
      available_items: availableItems,
      correct_list: correctList,
      allow_duplicates: allowDuplicates
    };
    
    if (maxItems && !isNaN(parseInt(maxItems))) {
      dataToSend.max_items = parseInt(maxItems);
    }
    
    onChange(dataToSend);
  }, [instructions, availableItems, correctList, maxItems, allowDuplicates, onChange]);

  const addAvailableItem = () => {
    const newId = Math.max(...availableItems.map(item => item.id), 0) + 1;
    setAvailableItems([...availableItems, {
      id: newId,
      text: '',
      category: ''
    }]);
  };

  const removeAvailableItem = (id) => {
    if (availableItems.length <= 1) {
      alert('Must have at least one available item');
      return;
    }
    setAvailableItems(availableItems.filter(item => item.id !== id));
    // Remove from correct list if present
    setCorrectList(correctList.filter(item => item.id !== id));
  };

  const updateAvailableItem = (id, field, value) => {
    setAvailableItems(availableItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
    // Update in correct list if present
    setCorrectList(correctList.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addToCorrectList = (item) => {
    if (correctList.find(cItem => cItem.id === item.id)) {
      alert('Item is already in the correct list');
      return;
    }
    setCorrectList([...correctList, { ...item, order: correctList.length + 1 }]);
  };

  const removeFromCorrectList = (id) => {
    setCorrectList(correctList.filter(item => item.id !== id));
  };

  const moveCorrectItem = (index, direction) => {
    const newList = [...correctList];
    if (direction === 'up' && index > 0) {
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
    } else if (direction === 'down' && index < newList.length - 1) {
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    }
    // Update order numbers
    setCorrectList(newList.map((item, idx) => ({ ...item, order: idx + 1 })));
  };

  return (
    <div className="question-editor build-list-editor">
      <h4>Build List Question</h4>
      
      <div className="form-group">
        <label className="form-label">Instructions</label>
        <textarea
          className="form-input"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instructions for building the list (e.g., 'Build a list of steps in the correct order...')"
          rows="3"
        />
        {errors.instructions && <span className="error-text">{errors.instructions}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Max Items (Optional)</label>
          <input
            type="number"
            className="form-input"
            value={maxItems}
            onChange={(e) => setMaxItems(e.target.value)}
            placeholder="Maximum number of items in the final list"
            min="1"
          />
        </div>
        <div className="form-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={allowDuplicates}
              onChange={(e) => setAllowDuplicates(e.target.checked)}
            />
            Allow duplicate items in the list
          </label>
        </div>
      </div>

      {/* Available Items */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Available Items</label>
          <button 
            type="button" 
            className="btn btn-sm btn-secondary"
            onClick={addAvailableItem}
          >
            + Add Item
          </button>
        </div>
        
        {availableItems.map((item, index) => (
          <div key={item.id} className="item-editor">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <input
                  type="text"
                  className="form-input"
                  value={item.text}
                  onChange={(e) => updateAvailableItem(item.id, 'text', e.target.value)}
                  placeholder={`Available item ${index + 1}`}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <input
                  type="text"
                  className="form-input"
                  value={item.category}
                  onChange={(e) => updateAvailableItem(item.id, 'category', e.target.value)}
                  placeholder="Category (optional)"
                />
              </div>
              <button
                type="button"
                className="btn btn-sm btn-info"
                onClick={() => addToCorrectList(item)}
                disabled={!item.text.trim()}
              >
                Add to Correct List
              </button>
              {availableItems.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeAvailableItem(item.id)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Correct List */}
      <div className="form-section">
        <label className="form-label">Correct List (in correct order)</label>
        
        {correctList.length === 0 ? (
          <div className="empty-state">
            <p>No items in the correct list. Add items from the available items above.</p>
          </div>
        ) : (
          <div className="correct-list">
            {correctList.map((item, index) => (
              <div key={`correct-${item.id}`} className="correct-item">
                <div className="item-content">
                  <span className="item-order">{index + 1}.</span>
                  <span className="item-text">{item.text}</span>
                  {item.category && (
                    <span className="item-category">({item.category})</span>
                  )}
                </div>
                <div className="item-controls">
                  {index > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => moveCorrectItem(index, 'up')}
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {index < correctList.length - 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => moveCorrectItem(index, 'down')}
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeFromCorrectList(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
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

export default BuildListEditor;