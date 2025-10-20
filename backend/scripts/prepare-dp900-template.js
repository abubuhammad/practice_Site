const fs = require('fs');
const path = require('path');

// Input and outputs
const INPUT_JSON = path.resolve(__dirname, '../../dp-900-questions.json');
const OUTPUT_CSV = path.resolve(__dirname, '../uploads/dp900-enhanced-template.csv');
const OUTPUT_MAP = path.resolve(__dirname, '../uploads/dp900-column-map.json');

// Simple text cleaner for mojibake and artifacts
function cleanText(s) {
  if (!s) return '';
  let t = String(s);
  // Common mojibake fixes
  t = t.replace(/â€”/g, '—'); // em-dash
  t = t.replace(/â€“/g, '–'); // en-dash
  t = t.replace(/â€˜/g, '‘').replace(/â€™/g, '’'); // single quotes
  t = t.replace(/â€œ/g, '“').replace(/â€/g, '”'); // double quotes (note: â€ is often opening, â€ closing)
  t = t.replace(/â€¦/g, '…'); // ellipsis
  t = t.replace(/Ã—/g, '×'); // multiply sign
  t = t.replace(/Â/g, ''); // stray Â from UTF-8/BOM issues
  // Normalize whitespace
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function inferTypeFromText(text, fallback = 'single_choice') {
  const t = text.toLowerCase();
  if (/(select|choose|pick) (two|2|three|3|all that apply)/.test(t)) return 'multiple_choice';
  return fallback;
}

function normalizeType(rawType, text) {
  const base = (rawType || '').toString().trim().toLowerCase();
  if (base === 'multiple_choice' || base === 'single_choice') return base;
  // Treat all ambiguous types as single/multiple choice, to be refined when options are added
  return inferTypeFromText(text, 'single_choice');
}

function toCsvCell(v) {
  const s = v == null ? '' : String(v);
  if (s.includes('"') || s.includes(',') || /\s*\n\s*/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function main() {
  if (!fs.existsSync(INPUT_JSON)) {
    console.error(`Input not found: ${INPUT_JSON}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(INPUT_JSON, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON in dp-900-questions.json');
    process.exit(1);
  }

  const questions = Array.isArray(data?.questions) ? data.questions : [];
  if (questions.length === 0) {
    console.error('No questions found in dp-900-questions.json');
    process.exit(1);
  }

  // Ensure uploads dir exists
  fs.mkdirSync(path.dirname(OUTPUT_CSV), { recursive: true });

  const headers = [
    'order_index',
    'question_text',
    'question_type',
    'explanation',
    'case_study_title',
    // Options placeholders (fill these in manually later)
    'option_1', 'option_2', 'option_3', 'option_4', 'option_5', 'option_6',
    // Correct indices (enter numbers like 1, 2, 3)
    'correct_1', 'correct_2', 'correct_3'
  ];

  const rows = [headers.join(',')];

  questions.forEach((q, i) => {
    const text = cleanText(q.text || '');
    const explanation = cleanText(q.explanation || '');
    const caseStudy = cleanText(q.case_study_title || '');
    const type = normalizeType(q.question_type, text);

    const row = [
      i + 1,
      toCsvCell(text),
      toCsvCell(type),
      toCsvCell(explanation),
      toCsvCell(caseStudy),
      // option_1..option_6 (empty placeholders)
      '', '', '', '', '', '',
      // correct_1..correct_3 (empty placeholders)
      '', '', ''
    ];
    rows.push(row.join(','));
  });

  fs.writeFileSync(OUTPUT_CSV, rows.join('\n'), 'utf8');

  // Column map for enhanced bulk importer
  const columnMap = {
    question_text: 'question_text',
    question_type: 'question_type',
    explanation: 'explanation',
    order_index: 'order_index',
    case_study_title: 'case_study_title',
    question_options: [
      'option_1', 'option_2', 'option_3', 'option_4', 'option_5', 'option_6'
    ],
    correct_options: [
      'correct_1', 'correct_2', 'correct_3'
    ],
    correct_mode: 'index'
  };
  fs.writeFileSync(OUTPUT_MAP, JSON.stringify(columnMap, null, 2), 'utf8');

  console.log('✅ Generated:');
  console.log(' - CSV:', OUTPUT_CSV);
  console.log(' - Column map:', OUTPUT_MAP);
  console.log('\nNext steps:');
  console.log('1) Open the CSV and fill in option_1..option_6 and correct_1..correct_3 (indices) for each question.');
  console.log('2) Save the CSV.');
  console.log('3) Use import-dp900-enhanced.ps1 to upload to the API.');
}

if (require.main === module) {
  main();
}
