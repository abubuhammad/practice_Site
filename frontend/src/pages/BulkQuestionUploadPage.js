import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI, examsAPI } from '../services/api';
import '../styles/AdminDashboard.css';

const REQUIRED_FIELDS = ['question_text', 'question_options', 'correct_options'];
const DEFAULT_CORRECT_MODE = 'index';
const AVAILABLE_CORRECT_MODES = [
  { value: 'index', label: 'Index (1-based)' },
  { value: 'text', label: 'Exact option text' },
  { value: 'boolean', label: 'Boolean columns' },
];

const BulkQuestionUploadPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [rowPreview, setRowPreview] = useState([]);
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({
    question_text: '',
    question_type: '',
    explanation: '',
    order_index: '',
    case_study_title: '',
    case_study_scenario: '',
    correct_mode: DEFAULT_CORRECT_MODE,
    create_missing_case_studies: false,
    question_options: ['', '', '', ''],
    correct_options: [''],
    correct_boolean_suffix: '',
  });
  const [createMissingCaseStudies, setCreateMissingCaseStudies] = useState(false);
  const [linkMode, setLinkMode] = useState('link');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

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

  const isExcelFile = useMemo(() => {
    if (!file) {
      return false;
    }

    return file.name.endsWith('.xlsx');
  }, [file]);

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

    if (!selectedFile) {
      return;
    }

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
      
      // Auto-map columns if they match expected names
      const headersList = headers.headers || headers;
      autoMapColumns(headersList);
      
      // Show success message if key columns were mapped
      const hasQuestionText = headersList.some(h => h.toLowerCase().includes('question'));
      const hasOptions = headersList.some(h => h.toLowerCase().includes('option'));
      if (hasQuestionText && hasOptions) {
        setError(null);
        console.log('✅ Template columns auto-mapped successfully!');
      }
    } catch (err) {
      console.error('Failed to extract headers', err);
      setError('Failed to read file headers. Please ensure the file is valid.');
      setColumnHeaders([]);
      setRowPreview([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const autoMapColumns = (headers) => {
    if (!headers || headers.length === 0) return;
    
    const newColumnMap = { ...columnMap };
    
    // Auto-map exact matches (case-insensitive)
    const autoMappings = {
      question_text: 'question_text',
      question_type: 'question_type',
      explanation: 'explanation',
      order_index: 'order_index',
      case_study_title: 'case_study_title',
      case_study_scenario: 'case_study_scenario',
      correct_answer_index: 'correct_answer_index'
    };
    
    // Map basic fields with fallbacks
    const fieldMappings = {
      question_text: ['question_text', 'question text', 'question', 'text', 'questiontext'],
      question_type: ['question_type', 'question type', 'type', 'questiontype'],
      explanation: ['explanation', 'explain', 'description', 'desc'],
      order_index: ['order_index', 'order index', 'order', 'index', 'orderindex'],
      case_study_title: ['case_study_title', 'case study title', 'case_title', 'casestudytitle'],
      case_study_scenario: ['case_study_scenario', 'case study scenario', 'case_scenario', 'scenario', 'casestudyscenario'],
      correct_answer_index: ['correct_answer_index', 'correct answer index', 'correct_answer', 'correct answer', 'answer_index', 'answer index', 'correct', 'correctanswerindex']
    };
    
    Object.keys(fieldMappings).forEach(fieldName => {
      const variations = fieldMappings[fieldName];
      const matchingHeader = headers.find(header => {
        const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
        return variations.some(variation => 
          normalizedHeader === variation.toLowerCase().replace(/[_\s-]/g, '')
        );
      });
      if (matchingHeader) {
        newColumnMap[fieldName] = matchingHeader;
      }
    });
    
    // Auto-map option columns
    const optionHeaders = headers.filter(header => {
      const normalized = header.toLowerCase().replace(/[_\s-]/g, '');
      return /^option\d+$/i.test(normalized) || /^opt\d+$/i.test(normalized) || /^choice\d+$/i.test(normalized) || /^answer\d+$/i.test(normalized);
    });
    
    if (optionHeaders.length > 0) {
      // Sort option headers by number
      optionHeaders.sort((a, b) => {
        const aNum = parseInt(a.match(/\d+/)[0]);
        const bNum = parseInt(b.match(/\d+/)[0]);
        return aNum - bNum;
      });
      
      newColumnMap.question_options = optionHeaders.slice(0, 6); // Limit to 6 options
      
      // Fill remaining option slots with empty strings
      while (newColumnMap.question_options.length < 4) {
        newColumnMap.question_options.push('');
      }
    }
    
    // Auto-map correct answer column
    const correctAnswerHeaders = headers.filter(header => {
      const normalized = header.toLowerCase().replace(/[_\s-]/g, '');
      return /correct.*answer.*index/i.test(normalized) || 
             /correct.*index/i.test(normalized) || 
             /answer.*index/i.test(normalized) ||
             normalized === 'correct' ||
             normalized === 'correctanswer';
    });
    
    if (correctAnswerHeaders.length > 0) {
      newColumnMap.correct_options = [correctAnswerHeaders[0]];
    }
    
    console.log('Auto-mapped columns:', {
      headers,
      newColumnMap,
      optionHeaders,
      correctAnswerHeaders
    });
    
    setColumnMap(newColumnMap);
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

  const validateInputs = () => {
    if (!selectedExamId) {
      setError('Please select an exam before uploading.');
      return false;
    }

    if (!file) {
      setError('Please choose a file to upload.');
      return false;
    }

    // Check question_text mapping
    if (!columnMap.question_text || columnMap.question_text.trim() === '') {
      setError('Please map a column to the field: question text');
      return false;
    }

    // Check question options mapping
    if (!columnMap.question_options.some((entry) => entry && entry.trim())) {
      setError('Please map at least one column to question options.');
      return false;
    }

    // Check correct options mapping
    if (!columnMap.correct_options.some((entry) => entry && entry.trim())) {
      setError('Please map a column to specify correct answers.');
      return false;
    }

    if (columnMap.correct_mode === 'boolean' && !columnMap.correct_boolean_suffix) {
      setError('Please specify the suffix used for boolean correctness columns (e.g., "_isCorrect").');
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
      correct_mode: columnMap.correct_mode || DEFAULT_CORRECT_MODE,
      correct_boolean_suffix: columnMap.correct_boolean_suffix || null,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    const isValid = validateInputs();
    if (!isValid) {
      return;
    }

    const formData = new FormData();
    formData.append('exam_id', selectedExamId);
    formData.append('file', file);
    formData.append('case_study_mode', linkMode);
    formData.append('create_missing_case_studies', createMissingCaseStudies ? 'true' : 'false');

    const payload = buildColumnMapPayload();
    formData.append('column_map', JSON.stringify(payload));

    setIsSubmitting(true);

    try {
      const { data } = await adminAPI.bulkImportQuestions(formData);
      setFeedback({
        message: 'Upload completed successfully!',
        summary: data?.summary || data,
      });
      setFile(null);
      setFilename('');
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
      // First check if template exists
      console.log('Checking template status...');
      const statusResponse = await adminAPI.checkTemplateStatus();
      console.log('Template status:', statusResponse.data);
      
      if (!statusResponse.data.exists) {
        setError('Template file does not exist. Please contact administrator to regenerate the template.');
        return;
      }
      
      // Try API download
      console.log('Attempting API download...');
      const response = await adminAPI.downloadTemplate();
      
      if (response.data.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'question-bulk-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Template downloaded successfully via API');
      
    } catch (err) {
      console.error('API download failed, trying static file fallback:', err);
      
      // Fallback to static file download
      try {
        const link = document.createElement('a');
        link.href = '/templates/question-bulk-template.xlsx';
        link.download = 'question-bulk-template.xlsx';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Template downloaded via static file fallback');
        
      } catch (fallbackErr) {
        console.error('Fallback download also failed:', fallbackErr);
        setError('Failed to download template. Please try refreshing the page or contact support.');
      }
    }
  };

  const renderPreviewTable = () => {
    if (!columnHeaders.length || rowPreview.length === 0) {
      return null;
    }

    return (
      <div className="table-container" style={{ marginTop: '20px' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columnHeaders.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowPreview.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columnHeaders.map((header) => (
                  <td key={`${rowIndex}-${header}`}>
                    {row[header] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubmissionFeedback = () => {
    if (!feedback?.summary) {
      return null;
    }

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
              {errors.map((item, index) => (
                <li key={index}>
                  Row {item.row} — {item.error}
                </li>
              ))}
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
          <h1>Bulk Question Upload</h1>
          <p className="subtitle">Import questions from Excel, CSV, or JSON files</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={downloadTemplate}>
          Download Template
        </button>
      </div>

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
              Map spreadsheet columns to question fields. Only map columns that exist in your file.
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Explanation</label>
                <select
                  className="form-input"
                  value={columnMap.explanation}
                  onChange={(event) => updateColumnMap('explanation', event.target.value)}
                >
                  <option value="">-- Select column (optional) --</option>
                  {columnHeaders.map((header) => (
                    <option key={`explanation-${header}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Order Index</label>
                <select
                  className="form-input"
                  value={columnMap.order_index}
                  onChange={(event) => updateColumnMap('order_index', event.target.value)}
                >
                  <option value="">-- Select column (optional) --</option>
                  {columnHeaders.map((header) => (
                    <option key={`order_index-${header}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Case Study Title</label>
                <select
                  className="form-input"
                  value={columnMap.case_study_title}
                  onChange={(event) => updateColumnMap('case_study_title', event.target.value)}
                >
                  <option value="">-- Select column (optional) --</option>
                  {columnHeaders.map((header) => (
                    <option key={`case_study_title-${header}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Case Study Scenario</label>
                <select
                  className="form-input"
                  value={columnMap.case_study_scenario}
                  onChange={(event) => updateColumnMap('case_study_scenario', event.target.value)}
                >
                  <option value="">-- Select column (optional) --</option>
                  {columnHeaders.map((header) => (
                    <option key={`case_study_scenario-${header}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Question Options *</label>
              <p className="subtitle">Map each option column. You can add or remove columns as needed.</p>

              {columnMap.question_options.map((optionColumn, index) => (
                <div key={`option-${index}`} className="form-row">
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

              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => updateColumnMap('question_options', [...columnMap.question_options, ''])}
                style={{ marginTop: '10px' }}
              >
                + Add Option Column
              </button>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Correct Answers *</label>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Correct Mode</label>
                  <select
                    className="form-input"
                    value={columnMap.correct_mode}
                    onChange={(event) => updateColumnMap('correct_mode', event.target.value)}
                    required
                  >
                    {AVAILABLE_CORRECT_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Correct Columns</label>
                  <select
                    className="form-input"
                    value={columnMap.correct_options[0] || ''}
                    onChange={(event) => updateColumnArray('correct_options', 0, event.target.value)}
                    required
                  >
                    <option value="">-- Select column --</option>
                    {columnHeaders.map((header) => (
                      <option key={`correct_option-${header}`} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {columnMap.correct_mode === 'boolean' && (
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label className="form-label">Boolean Column Suffix *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Example: _isCorrect"
                    value={columnMap.correct_boolean_suffix}
                    onChange={(event) => updateColumnMap('correct_boolean_suffix', event.target.value)}
                    required
                  />
                </div>
              )}
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
                <label className="form-label">&nbsp;</label>
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
            {isSubmitting ? 'Uploading...' : 'Start Import'}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              setFile(null);
              setFilename('');
              setColumnHeaders([]);
              setRowPreview([]);
              setColumnMap({
                question_text: '',
                question_type: '',
                explanation: '',
                order_index: '',
                case_study_title: '',
                case_study_scenario: '',
                correct_mode: DEFAULT_CORRECT_MODE,
                create_missing_case_studies: false,
                question_options: ['', '', '', ''],
                correct_options: [''],
                correct_boolean_suffix: '',
              });
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

export default BulkQuestionUploadPage;