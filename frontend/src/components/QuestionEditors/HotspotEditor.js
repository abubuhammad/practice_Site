import React, { useState, useEffect } from 'react';

const HotspotEditor = ({ data, onChange, errors = {} }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [imageWidth, setImageWidth] = useState(800);
  const [imageHeight, setImageHeight] = useState(600);
  const [instructions, setInstructions] = useState('');
  const [hotspotAreas, setHotspotAreas] = useState([]);

  // Initialize from existing data
  useEffect(() => {
    if (data && data.hotspot_data) {
      setImageUrl(data.hotspot_data.image_url || '');
      setImageWidth(data.hotspot_data.image_width || 800);
      setImageHeight(data.hotspot_data.image_height || 600);
      setInstructions(data.hotspot_data.instructions || '');
    }
    if (data && data.hotspot_areas) {
      setHotspotAreas(data.hotspot_areas || []);
    }
  }, [data]);

  // Update parent component when data changes
  useEffect(() => {
    if (onChange) {
      onChange({
        hotspot_data: {
          image_url: imageUrl,
          image_width: imageWidth,
          image_height: imageHeight,
          instructions: instructions
        },
        hotspot_areas: hotspotAreas
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, imageWidth, imageHeight, instructions, hotspotAreas]);

  const addHotspotArea = () => {
    const newArea = {
      id: Date.now(),
      area_type: 'rectangle',
      coordinates: { x: 50, y: 50, width: 100, height: 50 },
      is_correct: false,
      label: '',
      explanation: ''
    };
    setHotspotAreas([...hotspotAreas, newArea]);
  };

  const removeHotspotArea = (id) => {
    setHotspotAreas(hotspotAreas.filter(area => area.id !== id));
  };

  const updateHotspotArea = (id, field, value) => {
    setHotspotAreas(hotspotAreas.map(area =>
      area.id === id ? { ...area, [field]: value } : area
    ));
  };

  return (
    <div className="question-editor hotspot-editor">
      <h4>Hotspot Question</h4>
      <p className="editor-description">
        Create interactive hotspot questions where users click on specific areas of an image.
      </p>

      <div className="form-section">
        <div className="form-group">
          <label className="form-label">Image URL *</label>
          <input
            type="url"
            className="form-input"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.png"
            required
          />
          <small className="form-help">
            Enter the URL of the image for the hotspot question. Use a high-quality image with clear areas to click.
          </small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Image Width (px)</label>
            <input
              type="number"
              className="form-input"
              value={imageWidth}
              onChange={(e) => setImageWidth(parseInt(e.target.value))}
              min="100"
              max="1920"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Image Height (px)</label>
            <input
              type="number"
              className="form-input"
              value={imageHeight}
              onChange={(e) => setImageHeight(parseInt(e.target.value))}
              min="100"
              max="1080"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Instructions</label>
          <textarea
            className="form-input"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Provide instructions for the hotspot interaction (e.g., 'Click on the Azure services that support auto-scaling')"
            rows="3"
          />
        </div>
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="form-section">
          <label className="form-label">Image Preview</label>
          <div className="image-preview" style={{ maxWidth: '100%', overflow: 'auto' }}>
            <img
              src={imageUrl}
              alt="Hotspot question"
              style={{
                maxWidth: '600px',
                maxHeight: '400px',
                border: '1px solid #dee2e6',
                borderRadius: '4px'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              onLoad={(e) => {
                e.target.style.display = 'block';
              }}
            />
          </div>
        </div>
      )}

      {/* Hotspot Areas */}
      <div className="form-section">
        <div className="section-header">
          <label className="form-label">Hotspot Areas</label>
          <button 
            type="button" 
            className="btn btn-sm btn-secondary"
            onClick={addHotspotArea}
          >
            + Add Hotspot Area
          </button>
        </div>

        {hotspotAreas.length === 0 ? (
          <div className="empty-state">
            <p>No hotspot areas defined. Add areas that users can click on.</p>
          </div>
        ) : (
          <div className="hotspot-areas-list">
            {hotspotAreas.map((area, index) => (
              <div key={area.id} className="hotspot-area-card">
                <div className="area-header">
                  <h5>Hotspot Area {index + 1}</h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeHotspotArea(area.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Area Type</label>
                    <select
                      className="form-input"
                      value={area.area_type}
                      onChange={(e) => updateHotspotArea(area.id, 'area_type', e.target.value)}
                    >
                      <option value="rectangle">Rectangle</option>
                      <option value="circle">Circle</option>
                      <option value="polygon">Polygon</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={area.is_correct}
                        onChange={(e) => updateHotspotArea(area.id, 'is_correct', e.target.checked)}
                      />
                      Correct hotspot area
                    </label>
                  </div>
                </div>

                {area.area_type === 'rectangle' && (
                  <div className="coordinate-inputs">
                    <label className="form-label">Rectangle Coordinates</label>
                    <div className="form-row">
                      <div className="form-group">
                        <input
                          type="number"
                          className="form-input"
                          value={area.coordinates?.x || 0}
                          onChange={(e) => updateHotspotArea(area.id, 'coordinates', {
                            ...area.coordinates,
                            x: parseInt(e.target.value)
                          })}
                          placeholder="X"
                        />
                        <small>X Position</small>
                      </div>
                      <div className="form-group">
                        <input
                          type="number"
                          className="form-input"
                          value={area.coordinates?.y || 0}
                          onChange={(e) => updateHotspotArea(area.id, 'coordinates', {
                            ...area.coordinates,
                            y: parseInt(e.target.value)
                          })}
                          placeholder="Y"
                        />
                        <small>Y Position</small>
                      </div>
                      <div className="form-group">
                        <input
                          type="number"
                          className="form-input"
                          value={area.coordinates?.width || 100}
                          onChange={(e) => updateHotspotArea(area.id, 'coordinates', {
                            ...area.coordinates,
                            width: parseInt(e.target.value)
                          })}
                          placeholder="Width"
                        />
                        <small>Width</small>
                      </div>
                      <div className="form-group">
                        <input
                          type="number"
                          className="form-input"
                          value={area.coordinates?.height || 50}
                          onChange={(e) => updateHotspotArea(area.id, 'coordinates', {
                            ...area.coordinates,
                            height: parseInt(e.target.value)
                          })}
                          placeholder="Height"
                        />
                        <small>Height</small>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Label (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={area.label || ''}
                    onChange={(e) => updateHotspotArea(area.id, 'label', e.target.value)}
                    placeholder="Label for this hotspot area"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Explanation (Optional)</label>
                  <textarea
                    className="form-input"
                    value={area.explanation || ''}
                    onChange={(e) => updateHotspotArea(area.id, 'explanation', e.target.value)}
                    placeholder="Explain why this area is correct or incorrect"
                    rows="2"
                  />
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

export default HotspotEditor;