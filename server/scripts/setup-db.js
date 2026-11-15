// Creates the database (if missing), creates the tables, and loads every question:
// A Level 9618 from the paper1-4.html pages, IGCSE 0478 from data/igcse-paper1-2.json,
// IGCSE Chemistry 0620 from data/chemistry-paper2/4/6.json.
// Run with: npm run db:setup
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

const SUBJECTS = {
  9618: 'Computer Science (9618)',
  '0478': 'Computer Science IGCSE (0478)',
  '0620': 'Chemistry IGCSE (0620)',
  9701: 'Chemistry (9701)',
  9700: 'Biology (9700)',
};

// number: internal paper id. IGCSE Computer Science papers are 11 and 12 and IGCSE Chemistry papers are 21–26 (the paper's own number + 20) A Level Chemistry papers are 41–45 and A Level Biology papers are 51–55,
// so they never clash with 9618 Papers 1-4.
const PAPERS = [
  { number: 1, subject: '9618', label: 'Paper 1', title: 'Theory Fundamentals', description: 'AS Level theory: data representation, hardware, networks, security, databases.', source: 'paper1.html' },
  { number: 2, subject: '9618', label: 'Paper 2', title: 'Fundamental Problem-solving and Programming Skills', description: 'AS Level pseudocode, algorithms and program design.', source: 'paper2.html' },
  { number: 3, subject: '9618', label: 'Paper 3', title: 'Advanced Theory', description: 'A Level theory: floating point, protocols, AI, further programming.', source: 'paper3.html' },
  { number: 4, subject: '9618', label: 'Paper 4', title: 'Practical (Python)', description: 'A Level practical programming in Python.', source: 'paper4.html' },
  { number: 11, subject: '0478', label: 'IGCSE Paper 1', title: 'Computer Systems', description: 'IGCSE theory: data, transmission, hardware, software, the internet, emerging technologies.', source: 'data/igcse-paper1.json', examPrefix: 'ig-' },
  { number: 12, subject: '0478', label: 'IGCSE Paper 2', title: 'Algorithms, Programming and Logic', description: 'IGCSE algorithms, pseudocode programming, databases and Boolean logic.', source: 'data/igcse-paper2.json', examPrefix: 'ig-' },
  { number: 21, subject: '0620', label: 'Chemistry Paper 1', title: 'Multiple Choice (Core)', description: 'IGCSE Chemistry Core: 40 multiple-choice questions per paper.', source: 'data/chemistry-paper1.json', examPrefix: 'ch-' },
  { number: 22, subject: '0620', label: 'Chemistry Paper 2', title: 'Multiple Choice (Extended)', description: 'IGCSE Chemistry: 40 multiple-choice questions per paper across the whole syllabus.', source: 'data/chemistry-paper2.json', examPrefix: 'ch-' },
  { number: 23, subject: '0620', label: 'Chemistry Paper 3', title: 'Theory (Core)', description: 'IGCSE Chemistry Core structured questions across the whole syllabus.', source: 'data/chemistry-paper3.json', examPrefix: 'ch-' },
  { number: 24, subject: '0620', label: 'Chemistry Paper 4', title: 'Theory (Extended)', description: 'IGCSE Chemistry structured questions: bonding, moles, electrolysis, energetics, organic and more.', source: 'data/chemistry-paper4.json', examPrefix: 'ch-' },
  { number: 25, subject: '0620', label: 'Chemistry Paper 5', title: 'Practical Test', description: 'IGCSE Chemistry practical test: experiments, observations, tests for ions and gases.', source: 'data/chemistry-paper5.json', examPrefix: 'ch-' },
  { number: 26, subject: '0620', label: 'Chemistry Paper 6', title: 'Alternative to Practical', description: 'IGCSE Chemistry practical skills: apparatus, tests for ions and gases, titrations, planning.', source: 'data/chemistry-paper6.json', examPrefix: 'ch-' },
  { number: 41, subject: '9701', label: 'A Level Chemistry Paper 1', title: 'Multiple Choice (AS)', description: 'AS Level Chemistry: 40 multiple-choice questions on physical, inorganic and organic chemistry.', source: 'data/chemistry-alevel-paper1.json', examPrefix: 'ac-' },
  { number: 42, subject: '9701', label: 'A Level Chemistry Paper 2', title: 'AS Level Structured Questions', description: 'AS Level Chemistry structured questions: atomic structure, bonding, energetics, equilibria, organic.', source: 'data/chemistry-alevel-paper2.json', examPrefix: 'ac-' },
  { number: 43, subject: '9701', label: 'A Level Chemistry Paper 3', title: 'Advanced Practical Skills (AS)', description: 'AS Level Chemistry practical: titrations, enthalpy experiments, qualitative analysis.', source: 'data/chemistry-alevel-paper3.json', examPrefix: 'ac-' },
  { number: 44, subject: '9701', label: 'A Level Chemistry Paper 4', title: 'A Level Structured Questions', description: 'A Level Chemistry: lattice energy, electrochemistry, kinetics, transition elements, NMR and more.', source: 'data/chemistry-alevel-paper4.json', examPrefix: 'ac-' },
  { number: 45, subject: '9701', label: 'A Level Chemistry Paper 5', title: 'Planning, Analysis and Evaluation', description: 'A Level Chemistry: planning experiments, processing data and evaluating results.', source: 'data/chemistry-alevel-paper5.json', examPrefix: 'ac-' },
  { number: 51, subject: '9700', label: 'A Level Biology Paper 1', title: 'Multiple Choice (AS)', description: 'AS Level Biology: 40 multiple-choice questions on cells, molecules, enzymes, transport and immunity.', source: 'biology-alevel-paper1.json', examPrefix: 'ab-' },
  { number: 52, subject: '9700', label: 'A Level Biology Paper 2', title: 'AS Level Structured Questions', description: 'AS Level Biology structured questions: cell structure, biological molecules, enzymes, membranes, DNA, transport, infectious diseases and immunity.', source: 'biology-alevel-paper2.json', examPrefix: 'ab-' },
  { number: 53, subject: '9700', label: 'A Level Biology Paper 3', title: 'Advanced Practical Skills (AS)', description: 'AS Level Biology practical: investigations, microscopy, drawings, graphs and food tests.', source: 'biology-alevel-paper3.json', examPrefix: 'ab-' },
  { number: 54, subject: '9700', label: 'A Level Biology Paper 4', title: 'A Level Structured Questions', description: 'A Level Biology: respiration, photosynthesis, homeostasis, coordination, inheritance, evolution and genetic technology.', source: 'biology-alevel-paper4.json', examPrefix: 'ab-' },
  { number: 55, subject: '9700', label: 'A Level Biology Paper 5', title: 'Planning, Analysis and Evaluation', description: 'A Level Biology: planning investigations, analysing data, statistics and evaluating results.', source: 'biology-alevel-paper5.json', examPrefix: 'ab-' },
];

// Every IGCSE question must come from a Cambridge (CAIE) paper of its own syllabus, e.g. 0620/42 for Chemistry.
function checkCambridgeSource(info, bank) {
  if (!info.source.endsWith('.json')) return;
  for (const [code, p] of Object.entries(bank.papers)) {
    const fromCaie = p.code.startsWith(`${info.subject}/`)
      && [p.qp, p.ms].every((u) => /\/CAIE\//.test(u) && u.includes(`/${info.subject}_`));
    if (!fromCaie) throw new Error(`${info.source}: ${code} (${p.code}) is not a Cambridge ${info.subject} paper.`);
  }
  const bad = bank.items.find((q) => !q.paper_code.startsWith(`${info.subject}/`) || !bank.papers[`${q.session}-${q.variant}`]);
  if (bad) throw new Error(`${info.source}: question ${bad.id} is not from a Cambridge ${info.subject} paper.`);
}

function loadBank(source) {
  const text = fs.readFileSync(path.join(root, source), 'utf8');
  if (source.endsWith('.json')) {
    const bank = JSON.parse(text);
    return { bank, chapters: bank.chapters };
  }
  return { bank: readEmbedded(text, 'bank'), chapters: readChapters(text) };
}

function readEmbedded(html, id) {
  const m = html.match(new RegExp(`<script id="${id}" type="application/json">([\\s\\S]*?)</script>`));
  return m ? JSON.parse(m[1]) : null;
}

function readChapters(html) {
  const m = html.match(/CHAPS = (\{[^}]*\})/);
  if (!m) throw new Error('Chapter list not found');
  // Keys are unquoted numbers, so quote them to make it valid JSON.
  return JSON.parse(m[1].replace(/([{,])(\d+):/g, '$1"$2":'));
}

async function ensureDatabase(url) {
  const target = new URL(url);
  const dbName = decodeURIComponent(target.pathname.slice(1));
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!rowCount) {
    await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`Created database ${dbName}`);
  }
  await client.end();
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set. Copy server/.env.example to server/.env first.');

  // Read and check every question bank before touching the database.
  const banks = PAPERS.map((info) => {
    const loaded = loadBank(info.source);
    checkCambridgeSource(info, loaded.bank);
    return loaded;
  });
  console.log('Question banks checked: every IGCSE question is from a Cambridge (CAIE) paper of its syllabus');

  await ensureDatabase(url);
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  await client.query(fs.readFileSync(path.join(here, '../db/schema.sql'), 'utf8'));
  console.log('Tables ready');

  await client.query('BEGIN');
  const subjectIds = {};
  for (const [code, name] of Object.entries(SUBJECTS)) {
    const { rows } = await client.query(
      `INSERT INTO subjects (code, name) VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [code, name],
    );
    subjectIds[code] = rows[0].id;
  }
  let total = 0;
  for (const [i, info] of PAPERS.entries()) {
    const paper = info.number;
    const prefix = info.examPrefix || '';
    const { bank, chapters } = banks[i];

    await client.query(
      `INSERT INTO papers (number, title, description, subject_id, label) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (number) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description,
         subject_id = EXCLUDED.subject_id, label = EXCLUDED.label`,
      [paper, info.title, info.description, subjectIds[info.subject], info.label],
    );
    for (const [ch, name] of Object.entries(chapters)) {
      await client.query(
        `INSERT INTO chapters (paper, number, name) VALUES ($1, $2, $3)
         ON CONFLICT (paper, number) DO UPDATE SET name = EXCLUDED.name`,
        [paper, Number(ch), name],
      );
    }
    for (const [code, p] of Object.entries(bank.papers)) {
      await client.query(
        `INSERT INTO exam_papers (code, paper, label, qp_url, ms_url) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, qp_url = EXCLUDED.qp_url, ms_url = EXCLUDED.ms_url`,
        [prefix + code, paper, p.code, p.qp?.startsWith('http') ? p.qp : '', p.ms?.startsWith('http') ? p.ms : ''],
      );
    }
    for (const q of bank.items) {
      const examCode = `${q.session}-${q.variant}`;
      await client.query(
        `INSERT INTO questions (id, paper, exam_code, session, variant, label, marks, chapter, subtopic, prompt,
                                context_note, answer_type, criteria, max_note, rejects, final_answer, confidence,
                                figures, answer_figures)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO UPDATE SET
           paper = EXCLUDED.paper, exam_code = EXCLUDED.exam_code, session = EXCLUDED.session,
           variant = EXCLUDED.variant, label = EXCLUDED.label, marks = EXCLUDED.marks,
           chapter = EXCLUDED.chapter, subtopic = EXCLUDED.subtopic, prompt = EXCLUDED.prompt,
           context_note = EXCLUDED.context_note, answer_type = EXCLUDED.answer_type,
           criteria = EXCLUDED.criteria, max_note = EXCLUDED.max_note, rejects = EXCLUDED.rejects,
           final_answer = EXCLUDED.final_answer, confidence = EXCLUDED.confidence,
           figures = EXCLUDED.figures, answer_figures = EXCLUDED.answer_figures`,
        [
          q.id, paper, bank.papers[examCode] ? prefix + examCode : null, q.session, q.variant, q.q, q.marks,
          q.chapter, q.subtopic || '', q.prompt, q.context_note || '', q.answer_type || 'text',
          JSON.stringify(q.criteria || []), q.max_note || '', JSON.stringify(q.rejects || []),
          q.final_answer || '', q.confidence || '',
          JSON.stringify(q.figures || []), JSON.stringify(q.answer_figures || []),
        ],
      );
    }
    total += bank.items.length;
    console.log(`${info.subject} ${info.label}: ${bank.items.length} questions`);
  }
  await client.query('COMMIT');
  await client.end();
  console.log(`Done. ${total} questions loaded.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
