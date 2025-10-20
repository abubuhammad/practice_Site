import React, { useEffect, useState } from 'react';
import { adminAPI, examsAPI } from '../services/api';
import '../styles/AdminDashboard.css';

const SUPPORTED_QUESTION_TYPES = [
  'single_choice',
  'multiple_choice', 
  'yes_no',
  'drag_drop_ordering',
  'build_list',
  'matching',
  'fill_in_blank',
  'hotspot',
  'sequence_ordering',
  'simulation',
  'case_study'
];

const ENHANCED_COLUMN_MAPPINGS = {
  // Basic fields
  question_text: '',
  question_type: '',
  explanation: '',
  order_index: '',
  
  // Case study fields
  case_study_title: '',
  case_study_scenario: '',
  
  // Traditional question options
  question_options: ['', '', '', '', '', ''],
  correct_options: [''],
  correct_mode: 'index',
  
  // Complex question data (JSON format)
  drag_drop_ordering_data: '',
  build_list_data: '',
  matching_data: '',
  fill_in_blank_data: '',
  sequence_ordering_data: '',
  simulation_data: '',
  
  // Hotspot specific
  hotspot_image_url: '',
  image_width: '',
  image_height: '',
  hotspot_instructions: '',
  hotspot_areas: '',
  
  // Alternative simple fields
  instructions: '',
  drag_items: '',
  drop_zones: '',
  available_items: '',
  max_items: '',
  left_column: '',
  right_column: '',
  allow_multiple_matches: '',
  question_template: '',
  blanks: '',
  case_sensitive: '',
  sequence_items: '',
  scenario: '',
  tasks: '',
  validation_rules: ''
};

const EnhancedBulkUploadPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [rowPreview, setRowPreview] = useState([]);
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState(ENHANCED_COLUMN_MAPPINGS);
  const [createMissingCaseStudies, setCreateMissingCaseStudies] = useState(false);
  const [linkMode, setLinkMode] = useState('link');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [useEnhancedImport, setUseEnhancedImport] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await examsAPI.getAllExams();
        setExams(data.exams || []);
      } catch (err) {
        console.error('Failed to load exams', err);
        setError('Failed to load exams. Please refresh the page.');
      }
    };

    fetchExams();
  }, []);

  const handleExamChange = (event) => {
    setSelectedExamId(event.target.value);
  };

  const updateColumnMap = (key, value) => {
    setColumnMap((prev) => ({ ...prev, [key]: value }));
  };

  const updateColumnArray = (key, index, value) => {
    setColumnMap((prev) => {
      const updated = { ...prev };
      const arrayCopy = [...(updated[key] || [])];
      arrayCopy[index] = value;
      updated[key] = arrayCopy;
      return updated;
    });
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setFilename(selectedFile.name);
    setError(null);
    setFeedback(null);

    const isValidFile = selectedFile.name.toLowerCase().endsWith('.xlsx') || 
                       selectedFile.name.toLowerCase().endsWith('.csv') || 
                       selectedFile.name.toLowerCase().endsWith('.json');
    
    if (!isValidFile) {
      setError('Unsupported file type. Please upload an .xlsx, .csv, or .json file.');
      setRowPreview([]);
      setColumnHeaders([]);
      return;
    }

    try {
      setIsLoadingPreview(true);
      const headers = await extractHeaders(selectedFile);
      setColumnHeaders(headers.headers || headers);
      setRowPreview(headers.previewRows || []);
      
      // Auto-map columns
      const headersList = headers.headers || headers;
      autoMapColumns(headersList);
      
      setError(null);
    } catch (err) {
      console.error('Failed to extract headers', err);
      setError('Failed to read file headers. Please ensure the file is valid.');
      setColumnHeaders([]);
      setRowPreview([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const extractHeaders = async (selectedFile) => {
    if (selectedFile.name.endsWith('.json')) {
      const jsonContent = await selectedFile.text();
      const parsed = JSON.parse(jsonContent);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('JSON file must contain an array with at least one row.');
      }
      const firstRow = parsed[0];
      return { headers: Object.keys(firstRow), previewRows: parsed.slice(0, 3) };
    }

    if (selectedFile.name.endsWith('.csv')) {
      const csvContent = await selectedFile.text();
      const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
      const headerLine = lines[0];
      const headers = headerLine.split(',').map((value) => value.trim());
      const rows = lines.slice(1, 4).map((line) => line.split(',').map((value) => value.trim()));
      const previewRows = rows.map((row) => headers.reduce((acc, header, index) => {
        acc[header] = row[index];
        return acc;
      }, {}));
      return { headers, previewRows };
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const buffer = await selectedFile.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Worksheet is empty.');
    }

    const headers = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value || '').trim();
    });

    const previewRows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      if (previewRows.length >= 3) return;
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        rowData[headers[colNumber - 1]] = cell.text?.trim?.() ?? String(cell.value || '').trim();
      });
      previewRows.push(rowData);
    });

    return { headers, previewRows };
  };

  const autoMapColumns = (headers) => {
    if (!headers || headers.length === 0) return;
    
    const newColumnMap = { ...columnMap };
    
    // Auto-map basic fields
    const basicMappings = {
      question_text: ['question_text', 'question text', 'question', 'text'],
      question_type: ['question_type', 'question type', 'type'],
      explanation: ['explanation', 'explain', 'description'],
      order_index: ['order_index', 'order', 'index'],
      case_study_title: ['case_study_title', 'case study title', 'case_title'],
      case_study_scenario: ['case_study_scenario', 'case study scenario', 'scenario']
    };
    
    Object.keys(basicMappings).forEach(fieldName => {
      const variations = basicMappings[fieldName];
      const matchingHeader = headers.find(header => 
        variations.some(variation => 
          header.toLowerCase().trim() === variation.toLowerCase().trim()
        )
      );
      if (matchingHeader) {
        newColumnMap[fieldName] = matchingHeader;
      }
    });
    
    // Auto-map option columns
    const optionHeaders = headers.filter(header => 
      /^option\d+$/i.test(header.trim()) || 
      /^opt\d+$/i.test(header.trim()) ||
      /^choice\d+$/i.test(header.trim())
    );
    
    if (optionHeaders.length > 0) {
      optionHeaders.sort((a, b) => {
        const aNum = parseInt(a.match(/\d+/)[0]);
        const bNum = parseInt(b.match(/\d+/)[0]);
        return aNum - bNum;
      });
      
      newColumnMap.question_options = optionHeaders.slice(0, 6);
      
      while (newColumnMap.question_options.length < 6) {
        newColumnMap.question_options.push('');
      }
    }
    
    // Auto-map correct answer
    const correctHeaders = headers.filter(header => 
      /correct.*answer.*index/i.test(header) ||
      /correct.*index/i.test(header) ||
      header.toLowerCase().trim() === 'correct_answer_index'
    );
    
    if (correctHeaders.length > 0) {
      newColumnMap.correct_options = [correctHeaders[0]];
    }
    
    // Auto-map complex question fields
    const complexMappings = {
      drag_drop_ordering_data: ['drag_drop_ordering_data'],
      build_list_data: ['build_list_data'],
      matching_data: ['matching_data'],
      fill_in_blank_data: ['fill_in_blank_data'],
      sequence_ordering_data: ['sequence_ordering_data'],
      simulation_data: ['simulation_data'],
      hotspot_image_url: ['hotspot_image_url', 'image_url'],
      hotspot_areas: ['hotspot_areas'],
      instructions: ['instructions'],
      drag_items: ['drag_items'],
      drop_zones: ['drop_zones'],
      available_items: ['available_items'],
      left_column: ['left_column'],
      right_column: ['right_column'],
      question_template: ['question_template'],
      blanks: ['blanks'],
      sequence_items: ['sequence_items'],
      tasks: ['tasks'],
      validation_rules: ['validation_rules']
    };
    
    Object.keys(complexMappings).forEach(fieldName => {
      const variations = complexMappings[fieldName];
      const matchingHeader = headers.find(header => 
        variations.some(variation => 
          header.toLowerCase().trim() === variation.toLowerCase().trim()
        )
      );
      if (matchingHeader) {
        newColumnMap[fieldName] = matchingHeader;
      }
    });
    
    setColumnMap(newColumnMap);
  };

  const validateInputs = () => {
    if (!selectedExamId) {
      setError('Please select an exam before uploading.');
      return false;
    }

    if (!file) {
      setError('Please choose a file to upload.');
      return false;
    }

    if (!columnMap.question_text || columnMap.question_text.trim() === '') {
      setError('Please map a column to the field: question text');
      return false;
    }

    return true;
  };

  const buildColumnMapPayload = () => {
    const cleanedOptions = columnMap.question_options.filter((value) => value && value.trim());
    const cleanedCorrectOptions = columnMap.correct_options.filter((value) => value && value.trim());

    return {
      question_text: columnMap.question_text || null,
      question_type: columnMap.question_type || null,
      explanation: columnMap.explanation || null,
      order_index: columnMap.order_index || null,
      case_study_title: columnMap.case_study_title || null,
      case_study_scenario: columnMap.case_study_scenario || null,
      question_options: cleanedOptions,
      correct_options: cleanedCorrectOptions,
      correct_mode: columnMap.correct_mode || 'index',
      
      // Complex question fields
      drag_drop_ordering_data: columnMap.drag_drop_ordering_data || null,
      build_list_data: columnMap.build_list_data || null,
      matching_data: columnMap.matching_data || null,
      fill_in_blank_data: columnMap.fill_in_blank_data || null,
      sequence_ordering_data: columnMap.sequence_ordering_data || null,
      simulation_data: columnMap.simulation_data || null,
      
      // Hotspot fields
      hotspot_image_url: columnMap.hotspot_image_url || null,
      image_width: columnMap.image_width || null,
      image_height: columnMap.image_height || null,
      hotspot_instructions: columnMap.hotspot_instructions || null,
      hotspot_areas: columnMap.hotspot_areas || null,
      
      // Simple alternative fields
      instructions: columnMap.instructions || null,
      drag_items: columnMap.drag_items || null,
      drop_zones: columnMap.drop_zones || null,
      available_items: columnMap.available_items || null,
      max_items: columnMap.max_items || null,
      left_column: columnMap.left_column || null,
      right_column: columnMap.right_column || null,
      allow_multiple_matches: columnMap.allow_multiple_matches || null,
      question_template: columnMap.question_template || null,
      blanks: columnMap.blanks || null,
      case_sensitive: columnMap.case_sensitive || null,
      sequence_items: columnMap.sequence_items || null,
      scenario: columnMap.scenario || null,
      tasks: columnMap.tasks || null,
      validation_rules: columnMap.validation_rules || null
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    const isValid = validateInputs();
    if (!isValid) return;

    const formData = new FormData();
    formData.append('exam_id', selectedExamId);
    formData.append('file', file);
    formData.append('case_study_mode', linkMode);
    formData.append('create_missing_case_studies', createMissingCaseStudies ? 'true' : 'false');

    const payload = buildColumnMapPayload();
    formData.append('column_map', JSON.stringify(payload));

    setIsSubmitting(true);

    try {
      const importFunction = useEnhancedImport ? 
        adminAPI.bulkImportQuestionsEnhanced : 
        adminAPI.bulkImportQuestions;
        
      const { data } = await importFunction(formData);
      setFeedback({
        message: 'Upload completed successfully!',
        summary: data?.summary || data,
      });
      setFile(null);
      setFilename('');
      setColumnHeaders([]);
      setRowPreview([]);
    } catch (err) {
      console.error('Bulk upload failed', err);
      const serverMessage = err.response?.data?.error || err.message || 'Bulk upload failed.';
      setError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = async () => {
    setError(null);
    
    try {
      const downloadFunction = useEnhancedImport ? 
        adminAPI.downloadEnhancedTemplate : 
        adminAPI.downloadTemplate;
        
      const response = await downloadFunction();
      
      if (response.data.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      const templateName = useEnhancedImport ? 
        'enhanced-question-template.xlsx' : 
        'question-bulk-template.xlsx';
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', templateName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Template download failed:', err);
      setError('Failed to download template. Please try refreshing the page.');
    }
  };

  const renderPreviewTable = () => {
    if (!columnHeaders.length || rowPreview.length === 0) {
      return null;
    }

    return (
      <div className="table-container" style={{ marginTop: '20px' }}>
        <h3>File Preview</h3>
        <table className="data-table">
          <thead>
            <tr>
              {columnHeaders.slice(0, 10).map((header) => (
                <th key={header}>{header}</th>
              ))}
              {columnHeaders.length > 10 && <th>... (+{columnHeaders.length - 10} more)</th>}
            </tr>
          </thead>
          <tbody>
            {rowPreview.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columnHeaders.slice(0, 10).map((header) => (
                  <td key={`${rowIndex}-${header}`}>
                    {row[header] ?? ''}
                  </td>
                ))}
                {columnHeaders.length > 10 && <td>...</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubmissionFeedback = () => {
    if (!feedback?.summary) return null;

    const {
      processed_rows: processedRows,
      imported_rows: importedRows,
      skipped_rows: skippedRows,
      errors = [],
    } = feedback.summary;

    return (
      <div className="alert alert-success" style={{ marginTop: '20px' }}>
        <h3>Upload Summary</h3>
        <ul>
          <li><strong>Total Rows Processed:</strong> {processedRows}</li>
          <li><strong>Imported:</strong> {importedRows}</li>
          <li><strong>Skipped:</strong> {skippedRows}</li>
        </ul>
        {errors.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Row Errors:</strong>
            <ul>
              {errors.slice(0, 10).map((item, index) => (
                <li key={index}>
                  Row {item.row} — {Array.isArray(item.errors) ? item.errors.join(', ') : item.error}
                </li>
              ))}
              {errors.length > 10 && <li>... and {errors.length - 10} more errors</li>}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container admin-page">
      <div className="page-header">
        <div>
          <h1>Enhanced Bulk Question Upload</h1>
          <p className="subtitle">Import questions with support for all Microsoft exam question types</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="use-enhanced"
              checked={useEnhancedImport}
              onChange={(e) => setUseEnhancedImport(e.target.checked)}
            />
            <label htmlFor="use-enhanced">Use Enhanced Import (All Question Types)</label>
          </div>
          <button className="btn btn-secondary" type="button" onClick={downloadTemplate}>
            Download {useEnhancedImport ? 'Enhanced ' : ''}Template
          </button>
        </div>
      </div>

      {useEnhancedImport && (
        <div className="alert alert-info" style={{ marginBottom: '20px' }}>
          <h4>🚀 Enhanced Import Features:</h4>
          <ul style={{ marginBottom: 0 }}>
            <li><strong>All 11 Question Types:</strong> Traditional, Drag & Drop, Build List, Matching, Fill-in-Blank, Hotspot, Sequence Ordering, Simulation, Case Study</li>
            <li><strong>Flexible Data Format:</strong> Use JSON columns for complex data OR simple field columns</li>
            <li><strong>Sample Data:</strong> Template includes examples for all question types</li>
            <li><strong>Enhanced Validation:</strong> Better error reporting and validation</li>
          </ul>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {feedback && !error && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          {feedback.message}
        </div>
      )}

      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Select Exam *</label>
          <select
            className="form-input"
            value={selectedExamId}
            onChange={handleExamChange}
            required
          >
            <option value="">-- Choose an exam --</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.code} — {exam.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Upload File *</label>
          <input
            className="form-input"
            type="file"
            accept=".xlsx,.csv,.json"
            onChange={handleFileChange}
            required
          />
          {filename && <p style={{ marginTop: '8px', color: '#555' }}>Selected: {filename}</p>}
          {isLoadingPreview && (
            <div style={{ marginTop: '10px' }}>
              <div className="spinner" />
              <p>Reading file...</p>
            </div>
          )}
        </div>

        {columnHeaders.length > 0 && (
          <div className="form-group" style={{ marginTop: '30px' }}>
            <h2>Column Mapping</h2>
            <p className="subtitle">
              Map spreadsheet columns to question fields. {useEnhancedImport ? 'Enhanced import supports all question types.' : 'Standard import supports traditional questions only.'}
            </p>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <select
                  className="form-input"
                  value={columnMap.question_text}
                  onChange={(event) => updateColumnMap('question_text', event.target.value)}
                  required
                >
                  <option value="">-- Select column --</option>
                  {columnHeaders.map((header) => (
                    <option key={`question_text-${header}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Question Type</label>
                <select
                  className="form-input"
                  value={columnMap.question_type}
                  onChange={(event) => updateColumnMap('question_type', event.target.value)}
                >
                  <option value="">-- Select column (optional) --</option>
                  {columnHeaders.map((header) => (
                    <option key={`question_type-${header}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {useEnhancedImport && (
              <>
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <h3>📊 Supported Question Types</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {SUPPORTED_QUESTION_TYPES.map(type => (
                      <div key={type} style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px', fontSize: '14px' }}>
                        <code>{type}</code>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Complex Question Data (JSON)</label>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                      For complex questions, map these JSON data columns OR use the simple field columns below
                    </p>
                    {[
                      'drag_drop_ordering_data', 'build_list_data', 'matching_data', 
                      'fill_in_blank_data', 'sequence_ordering_data', 'simulation_data'
                    ].map(field => (
                      <div key={field} className="form-group" style={{ marginBottom: '8px' }}>
                        <label className="form-label" style={{ fontSize: '13px' }}>{field.replace(/_/g, ' ').replace(/data/g, '').trim()}</label>
                        <select
                          className="form-input"
                          value={columnMap[field]}
                          onChange={(event) => updateColumnMap(field, event.target.value)}
                          style={{ fontSize: '13px', padding: '4px' }}
                        >
                          <option value="">-- Select column (optional) --</option>
                          {columnHeaders.map((header) => (
                            <option key={`${field}-${header}`} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Traditional Question Options</label>
              <p className="subtitle">For single_choice, multiple_choice, and yes_no questions</p>

              {columnMap.question_options.map((optionColumn, index) => (
                <div key={`option-${index}`} className="form-row" style={{ marginBottom: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Option Column {index + 1}</label>
                    <select
                      className="form-input"
                      value={optionColumn}
                      onChange={(event) => updateColumnArray('question_options', index, event.target.value)}
                    >
                      <option value="">-- Select column --</option>
                      {columnHeaders.map((header) => (
                        <option key={`question_option-${index}-${header}`} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              <div className="form-row" style={{ marginTop: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Correct Answer Column</label>
                  <select
                    className="form-input"
                    value={columnMap.correct_options[0] || ''}
                    onChange={(event) => updateColumnArray('correct_options', 0, event.target.value)}
                  >
                    <option value="">-- Select column --</option>
                    {columnHeaders.map((header) => (
                      <option key={`correct_option-${header}`} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Correct Answer Mode</label>
                  <select
                    className="form-input"
                    value={columnMap.correct_mode}
                    onChange={(event) => updateColumnMap('correct_mode', event.target.value)}
                  >
                    <option value="index">Index (1-based)</option>
                    <option value="text">Exact option text</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Case Study Linking</label>
                <select
                  className="form-input"
                  value={linkMode}
                  onChange={(event) => setLinkMode(event.target.value)}
                >
                  <option value="link">Link to existing case studies</option>
                  <option value="create">Create if missing</option>
                </select>
              </div>

              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <div>
                  <input
                    id="create-missing-case-studies"
                    type="checkbox"
                    checked={createMissingCaseStudies}
                    onChange={(event) => setCreateMissingCaseStudies(event.target.checked)}
                    disabled={linkMode !== 'create'}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor="create-missing-case-studies">
                    Allow automatic case study creation
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderPreviewTable()}

        <div className="form-group" style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : `Start ${useEnhancedImport ? 'Enhanced ' : ''}Import`}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              setFile(null);
              setFilename('');
              setColumnHeaders([]);
              setRowPreview([]);
              setColumnMap(ENHANCED_COLUMN_MAPPINGS);
              setError(null);
              setFeedback(null);
            }}
            disabled={isSubmitting}
          >
            Reset
          </button>
        </div>
      </form>

      {renderSubmissionFeedback()}
    </div>
  );
};

export default EnhancedBulkUploadPage;