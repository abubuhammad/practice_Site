import React, { useState, useEffect } from 'react';

const DragDropOrderingEditor = ({ data, onChange, errors = {} }) => {
  const [instructions, setInstructions] = useState('');
  const [dragItems, setDragItems] = useState([
    { id: 1, text: '', correct_position: 1 }
  ]);
  const [dropZones, setDropZones] = useState([
    { id: 1, label: 'Position 1', position: 1 }
  ]);

  // Initialize from existing data
  useEffect(() => {
    if (data) {
      setInstructions(data.instructions || '');
      setDragItems(data.drag_items || [{ id: 1, text: '', correct_position: 1 }]);
      setDropZones(data.drop_zones || [{ id: 1, label: 'Position 1', position: 1 }]);
    }
  }, [data]);

  // Update parent component when data changes
  useEffect(() => {
    onChange({
      instructions,
      drag_items: dragItems,
      drop_zones: dropZones
    });
  }, [instructions, dragItems, dropZones, onChange]);

  const addDragItem = () => {
    const newId = Math.max(...dragItems.map(item => item.id), 0) + 1;
    setDragItems([...dragItems, {
      id: newId,
      text: '',
      correct_position: dragItems.length + 1
    }]);
  };

  const removeDragItem = (id) => {
    if (dragItems.length <= 1) {
      alert('Must have at least one drag item');
      return;
    }
    setDragItems(dragItems.filter(item => item.id !== id));
  };

  const updateDragItem = (id, field, value) => {
    setDragItems(dragItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addDropZone = () => {
    const newId = Math.max(...dropZones.map(zone => zone.id), 0) + 1;
    setDropZones([...dropZones, {
      id: newId,
      label: `Position ${dropZones.length + 1}`,
      position: dropZones.length + 1
    }]);
  };

  const removeDropZone = (id) => {
    if (dropZones.length <= 1) {
      alert('Must have at least one drop zone');
      return;
    }
    setDropZones(dropZones.filter(zone => zone.id !== id));
  };

  const updateDropZone = (id, field, value) => {
    setDropZones(dropZones.map(zone =>
      zone.id === id ? { ...zone, [field]: value } : zone
    ));
  };

  return (
    <div className="question-editor drag-drop-ordering-editor">
      <h4>Drag and Drop Ordering Question</h4>
      
      <div className="form-group">
        <label className="form-label">Instructions</label>
        <textarea
          className="form-input"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Provide instructions for how to complete the drag and drop ordering..."
          rows="3"
        />
        {errors.instructions && <span className="error-text">{errors.instructions}</span>}
      </div>

      {/* Drag Items */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Drag Items</label>
          <button 
            type="button" 
            className="btn btn-sm btn-secondary"
            onClick={addDragItem}
          >
            + Add Item
          </button>
        </div>
        
        {dragItems.map((item, index) => (
          <div key={item.id} className="item-editor">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <input
                  type="text"
                  className="form-input"
                  value={item.text}
                  onChange={(e) => updateDragItem(item.id, 'text', e.target.value)}
                  placeholder={`Drag item ${index + 1}`}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <select
                  className="form-input"
                  value={item.correct_position}
                  onChange={(e) => updateDragItem(item.id, 'correct_position', parseInt(e.target.value))}
                >
                  {dropZones.map(zone => (
                    <option key={zone.id} value={zone.position}>
                      Position {zone.position}
                    </option>
                  ))}
                </select>
              </div>
              {dragItems.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeDragItem(item.id)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Drop Zones */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Drop Zones</label>
          <button 
            type="button" 
            className="btn btn-sm btn-secondary"
            onClick={addDropZone}
          >
            + Add Zone
          </button>
        </div>
        
        {dropZones.map((zone, index) => (
          <div key={zone.id} className="item-editor">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <input
                  type="text"
                  className="form-input"
                  value={zone.label}
                  onChange={(e) => updateDropZone(zone.id, 'label', e.target.value)}
                  placeholder={`Zone label ${index + 1}`}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <input
                  type="number"
                  className="form-input"
                  value={zone.position}
                  onChange={(e) => updateDropZone(zone.id, 'position', parseInt(e.target.value))}
                  min="1"
                />
              </div>
              {dropZones.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeDropZone(zone.id)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {errors.general && (
        <div className="alert alert-error">
          {errors.general}
        </div>
      )}
    </div>
  );
};

export default DragDropOrderingEditor;