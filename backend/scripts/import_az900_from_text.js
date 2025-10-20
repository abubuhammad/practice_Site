/*
Parser + importer for AZ-900 dump text. Purges existing AZ-900 questions, then inserts parsed MCQs (with options and correct answers).
Hotspot/drag-drop/testlet without explicit options are inserted as placeholders (type inferred: 'hotspot' if mentions HOTSPOT/DRAG DROP; otherwise 'single_choice').
Usage: node backend/scripts/import_az900_from_text.js az900_dump.txt
*/

const fs = require('fs');
const path = require('path');
const { promisePool } = require('../config/database');

const INPUT_PATH = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(process.cwd(), 'az900_dump.txt');

function splitBlocks(raw) {
  const lines = raw.split(/\r?\n/);
  const blocks = [];
  let current = [];
  const isQ = (s) => /^Question\s*#\s*\d+/i.test(s.trim());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isQ(line)) {
      if (current.length) blocks.push(current.join('\n'));
      current = [line];
    } else if (current.length) {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join('\n'));
  return blocks;
}

function parseBlock(block) {
  const clean = block.replace(/\uFFFE|\uFEFF/g, '').trim();
  const lines = clean.split(/\r?\n/).map(l => l.replace(/\t/g, ' ').trim());

  // Extract question title/first line
  const header = lines[0] || '';

  // Find Correct Answer line
  const caIdx = lines.findIndex(l => /^Correct Answer:/i.test(l));
  let correctRaw = '';
  if (caIdx !== -1) {
    correctRaw = lines[caIdx].replace(/.*Correct Answer:\s*/i, '').trim();
  }
  const correctLetters = (correctRaw.match(/[A-E]/gi) || []).map(s => s.toUpperCase());

  // Extract options
  const optionMap = new Map();
  const letterRegex = /^[A-E][\).]?\s*\.?\s*/; // A. or A) or A .
  let currentLetter = null;
  let currentText = [];
  const pushCurrent = () => {
    if (currentLetter) {
      const text = currentText.join(' ').replace(/\s+/g, ' ').trim();
      if (text) optionMap.set(currentLetter, text);
    }
    currentLetter = null;
    currentText = [];
  };

  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^Correct Answer:/i.test(l)) {
      pushCurrent();
      break;
    }
    const m = l.match(/^([A-E])[\).]?\s*\.?\s*(.*)$/);
    if (m) {
      pushCurrent();
      currentLetter = m[1].toUpperCase();
      currentText = [m[2] || ''];
    } else if (currentLetter) {
      // continuation of option text
      if (l && !/^Question\s*#/i.test(l)) currentText.push(l);
    }
  }
  pushCurrent();

  // Build prompt text
  const startIdx = 1; // skip header line
  const endIdx = caIdx === -1 ? lines.length : caIdx;
  // Remove pure option lines from prompt
  const promptLines = [];
  for (let i = startIdx; i < endIdx; i++) {
    const l = lines[i];
    if (letterRegex.test(l)) break; // stop at first option
    if (!/^Hot Area:$/i.test(l) && !/^NOTE:/i.test(l)) {
      promptLines.push(l);
    }
  }
  let prompt = promptLines.join(' ').replace(/\s+/g, ' ').trim();
  if (!prompt) prompt = header;

  // Determine type
  const blockUpper = block.toUpperCase();
  let question_type = 'single_choice';
  if (optionMap.size >= 2 && correctLetters.length >= 1) {
    question_type = correctLetters.length > 1 ? 'multiple_choice' : 'single_choice';
  } else if (blockUpper.includes('HOTSPOT')) {
    question_type = 'hotspot';
  } else if (blockUpper.includes('DRAG DROP') || blockUpper.includes('DRAG') && blockUpper.includes('DROP')) {
    question_type = 'drag_drop_ordering';
  }

  // Build options array
  const options = [];
  if (optionMap.size >= 2) {
    const letters = ['A','B','C','D','E'];
    let order = 1;
    for (const letter of letters) {
      if (optionMap.has(letter)) {
        options.push({
          text: optionMap.get(letter),
          is_correct: correctLetters.includes(letter),
          order_index: order++
        });
      }
    }
  }

  return { text: prompt, question_type, options };
}

async function ensureExam() {
  const [rows] = await promisePool.query('SELECT id FROM exams WHERE code = ? LIMIT 1', ['AZ-900']);
  if (rows.length) return rows[0].id;
  const [res] = await promisePool.query(
    'INSERT INTO exams (code, title, description, path, time_limit_minutes, passing_score, total_questions) VALUES (?, ?, ?, ?, ?, ?, 0)',
    ['AZ-900', 'Azure Fundamentals (AZ-900)', 'Imported from text dump', '/az-900', 60, 700]
  );
  return res.insertId;
}

async function purgeExam(examId) {
  const [qIdsRows] = await promisePool.query('SELECT id FROM questions WHERE exam_id = ?', [examId]);
  const ids = qIdsRows.map(r => r.id);
  if (ids.length) {
    const idList = ids.join(',');
    const childTables = [
      'options','hotspot_areas','hotspot_data','drag_drop_ordering_data','build_list_data','simulation_data','active_screen_data','testlet_data','fill_in_blank_data','matching_data','sequence_ordering_data','drag_drop_data'
    ];
    for (const t of childTables) {
      await promisePool.query(`DELETE FROM ${t} WHERE question_id IN (${idList})`);
    }
    await promisePool.query('DELETE FROM questions WHERE id IN (' + idList + ')');
  }
  // Remove case studies for this exam as well (now orphaned)
  await promisePool.query('DELETE FROM case_studies WHERE exam_id = ?', [examId]);
  await promisePool.query('UPDATE exams SET total_questions = 0 WHERE id = ?', [examId]);
}

async function insertQuestions(examId, parsed) {
  let imported = 0, skipped = 0, withOptions = 0;
  for (let i = 0; i < parsed.length; i++) {
    const q = parsed[i];
    const text = (q.text || '').trim();
    if (!text) { skipped++; continue; }
    const order_index = i + 1;
    const question_type = q.question_type || 'single_choice';
    try {
      const [res] = await promisePool.query(
        'INSERT INTO questions (exam_id, case_study_id, text, explanation, question_type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [examId, null, text, '', question_type, order_index]
      );
      const qid = res.insertId;
      if (q.options && q.options.length >= 2) {
        let oi = 1;
        for (const opt of q.options) {
          await promisePool.query(
            'INSERT INTO options (question_id, text, is_correct, order_index) VALUES (?, ?, ?, ?)',
            [qid, opt.text, opt.is_correct ? 1 : 0, opt.order_index || oi++]
          );
        }
        withOptions++;
      }
      imported++;
    } catch (e) {
      skipped++;
    }
  }
  await promisePool.query(
    'UPDATE exams SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = ?) WHERE id = ?',
    [examId, examId]
  );
  return { imported, skipped, withOptions };
}

(async () => {
  try {
    if (!fs.existsSync(INPUT_PATH)) {
      console.error('Input file not found:', INPUT_PATH);
      process.exit(1);
    }
    const raw = fs.readFileSync(INPUT_PATH, 'utf8');
    const blocks = splitBlocks(raw);
    const parsed = blocks.map(parseBlock);

    await promisePool.query('START TRANSACTION');
    const examId = await ensureExam();
    await purgeExam(examId);
    const summary = await insertQuestions(examId, parsed);
    await promisePool.query('COMMIT');

    console.log(JSON.stringify({ examId, processed: parsed.length, ...summary }, null, 2));
    process.exit(0);
  } catch (e) {
    try { await promisePool.query('ROLLBACK'); } catch {}
    console.error('Import failed:', e.message);
    process.exit(2);
  }
})();
