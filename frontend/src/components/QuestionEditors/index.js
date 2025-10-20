import React, { useState, useEffect } from 'react';

// Export all question editor components
export { default as DragDropOrderingEditor } from './DragDropOrderingEditor';
export { default as BuildListEditor } from './BuildListEditor';
export { default as MatchingEditor } from './MatchingEditor';
export { default as FillInBlankEditor } from './FillInBlankEditor';
export { default as CaseStudyEditor } from './CaseStudyEditor';
export { default as HotspotEditor } from './HotspotEditor';

// Simple Simulation Editor
export const SimulationEditor = ({ data, onChange, errors = {} }) => {
  const [instructions, setInstructions] = useState('');
  const [simulationType, setSimulationType] = useState('general');
  const [tasks, setTasks] = useState([{ id: 1, description: '', required: true }]);
  const [validationRules, setValidationRules] = useState([{ id: 1, rule: '', description: '' }]);

  useEffect(() => {
    if (data) {
      setInstructions(data.instructions || '');
      setSimulationType(data.simulation_type || 'general');
      setTasks(data.tasks || [{ id: 1, description: '', required: true }]);
      setValidationRules(data.validation_rules || [{ id: 1, rule: '', description: '' }]);
    }
  }, [data]);

  useEffect(() => {
    onChange({
      instructions,
      simulation_type: simulationType,
      tasks,
      validation_rules: validationRules
    });
  }, [instructions, simulationType, tasks, validationRules, onChange]);

  const addTask = () => {
    const newId = Math.max(...tasks.map(task => task.id), 0) + 1;
    setTasks([...tasks, { id: newId, description: '', required: true }]);
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, [field]: value } : task));
  };

  const removeTask = (id) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="question-editor simulation-editor">
      <h4>Simulation Question</h4>
      
      <div className="form-group">
        <label className="form-label">Instructions</label>
        <textarea
          className="form-input"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instructions for the simulation..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Simulation Type</label>
        <select
          className="form-input"
          value={simulationType}
          onChange={(e) => setSimulationType(e.target.value)}
        >
          <option value="general">General</option>
          <option value="azure_portal">Azure Portal</option>
          <option value="powershell">PowerShell</option>
          <option value="command_line">Command Line</option>
          <option value="gui">GUI Application</option>
        </select>
      </div>

      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Tasks</label>
          <button type="button" className="btn btn-sm btn-secondary" onClick={addTask}>
            + Add Task
          </button>
        </div>

        {tasks.map((task) => (
          <div key={task.id} className="item-editor">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <textarea
                  className="form-input"
                  value={task.description}
                  onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                  placeholder="Describe what the user needs to do..."
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={task.required}
                    onChange={(e) => updateTask(task.id, 'required', e.target.checked)}
                  />
                  Required
                </label>
              </div>
              {tasks.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeTask(task.id)}
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

// Simple Sequence Ordering Editor
export const SequenceOrderingEditor = ({ data, onChange, errors = {} }) => {
  const [instructions, setInstructions] = useState('');
  const [sequenceItems, setSequenceItems] = useState([
    { id: 1, text: '', correct_order: 1 }
  ]);

  useEffect(() => {
    if (data) {
      setInstructions(data.instructions || '');
      setSequenceItems(data.sequence_items || [{ id: 1, text: '', correct_order: 1 }]);
    }
  }, [data]);

  useEffect(() => {
    const correctOrder = sequenceItems
      .sort((a, b) => a.correct_order - b.correct_order)
      .map(item => item.id);
    
    onChange({
      instructions,
      sequence_items: sequenceItems,
      correct_order: correctOrder
    });
  }, [instructions, sequenceItems, onChange]);

  const addItem = () => {
    const newId = Math.max(...sequenceItems.map(item => item.id), 0) + 1;
    setSequenceItems([...sequenceItems, {
      id: newId,
      text: '',
      correct_order: sequenceItems.length + 1
    }]);
  };

  const updateItem = (id, field, value) => {
    setSequenceItems(sequenceItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id) => {
    if (sequenceItems.length <= 1) return;
    setSequenceItems(sequenceItems.filter(item => item.id !== id));
  };

  return (
    <div className="question-editor sequence-ordering-editor">
      <h4>Sequence Ordering Question</h4>
      
      <div className="form-group">
        <label className="form-label">Instructions</label>
        <textarea
          className="form-input"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instructions for ordering the sequence..."
          rows="3"
        />
      </div>

      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Sequence Items</label>
          <button type="button" className="btn btn-sm btn-secondary" onClick={addItem}>
            + Add Item
          </button>
        </div>

        {sequenceItems
          .sort((a, b) => a.correct_order - b.correct_order)
          .map((item) => (
            <div key={item.id} className="item-editor">
              <div className="form-row">
                <div className="form-group" style={{ width: '80px' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={item.correct_order}
                    onChange={(e) => updateItem(item.id, 'correct_order', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <input
                    type="text"
                    className="form-input"
                    value={item.text}
                    onChange={(e) => updateItem(item.id, 'text', e.target.value)}
                    placeholder={`Step ${item.correct_order}`}
                    required
                  />
                </div>
                {sequenceItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeItem(item.id)}
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

// Placeholder for other editors
export const TestletEditor = ({ data, onChange, errors = {} }) => (
  <div className="question-editor">
    <h4>Testlet Question</h4>
    <div className="alert alert-info">
      Testlet editor coming soon. This will allow creating question groups with shared scenarios.
    </div>
  </div>
);

export const ActiveScreenEditor = ({ data, onChange, errors = {} }) => (
  <div className="question-editor">
    <h4>Active Screen Question</h4>
    <div className="alert alert-info">
      Active screen editor coming soon. This will allow creating interactive screen simulations.
    </div>
  </div>
);

export const DragDropEditor = ({ data, onChange, errors = {} }) => (
  <div className="question-editor">
    <h4>Drag and Drop Question</h4>
    <div className="alert alert-info">
      General drag and drop editor coming soon. This will allow creating flexible drag and drop interactions.
    </div>
  </div>
);