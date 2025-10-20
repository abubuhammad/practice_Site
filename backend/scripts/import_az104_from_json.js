/*
Appends AZ-104 questions from JSON file into DB.
Usage: node backend/scripts/import_az104_from_json.js C:\\path\\to\\az104_questions_import.json
*/
const fs = require('fs');
const path = require('path');
const { promisePool } = require('../config/database');

const INPUT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(process.cwd(), 'az104_questions_import.json');

async function ensureExam(code, title) {
  const [rows] = await promisePool.query('SELECT id FROM exams WHERE code = ? LIMIT 1', [code]);
  if (rows.length) return rows[0].id;
  const [res] = await promisePool.query(
    'INSERT INTO exams (code, title, description, path, time_limit_minutes, passing_score, total_questions) VALUES (?, ?, ?, ?, ?, ?, 0)',
    [code, title, `${code} imported`, `/${code.toLowerCase()}`, 90, 700]
  );
  return res.insertId;
}

async function currentCount(examId) {
  const [r] = await promisePool.query('SELECT COUNT(*) as c FROM questions WHERE exam_id = ?', [examId]);
  return r[0].c || 0;
}

async function insert(examId, questions, startIndex) {
  let imported = 0, withOptions = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] || {};
    const text = (q.text || '').trim();
    if (!text) continue;
    const question_type = (q.question_type || 'single_choice').trim();
    const order_index = startIndex + i + 1;
    const [res] = await promisePool.query(
      'INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [examId, null, text, '', question_type, order_index]
    );
    const qid = res.insertId;
    if (Array.isArray(q.options) && q.options.length > 0) {
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await promisePool.query(
          'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
          [qid, String(opt.text || '').trim(), opt.is_correct ? 1 : 0, opt.order_index || (j + 1)]
        );
      }
      withOptions++;
    }
    imported++;
  }
  await promisePool.query(
    'UPDATE exams SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = ?) WHERE id = ?',
    [examId, examId]
  );
  return { imported, withOptions };
}

(async () => {
  try {
    if (!fs.existsSync(INPUT)) {
      console.error('Input file not found:', INPUT);
      process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
    if (!Array.isArray(data) || data.length === 0) {
      console.error('No questions found in input JSON');
      process.exit(1);
    }
    await promisePool.query('START TRANSACTION');
    const examId = await ensureExam('AZ-104', 'Microsoft Azure Administrator (AZ-104)');
    const startIdx = await currentCount(examId);
    const summary = await insert(examId, data, startIdx);
    await promisePool.query('COMMIT');
    console.log(JSON.stringify({ examId, appended: data.length, ...summary }, null, 2));
    process.exit(0);
  } catch (e) {
    try { await promisePool.query('ROLLBACK'); } catch {}
    console.error('Import error:', e.message);
    process.exit(2);
  }
})();
