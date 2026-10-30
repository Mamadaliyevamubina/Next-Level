// Creates the database (if missing), creates the tables, and loads every
// question from the paper1-4.html pages in the project root.
// Run with: npm run db:setup
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

const PAPERS = {
  1: { title: 'Theory Fundamentals', description: 'AS Level theory: data representation, hardware, networks, security, databases.' },
  2: { title: 'Fundamental Problem-solving and Programming Skills', description: 'AS Level pseudocode, algorithms and program design.' },
  3: { title: 'Advanced Theory', description: 'A Level theory: floating point, protocols, AI, further programming.' },
  4: { title: 'Practical (Python)', description: 'A Level practical programming in Python.' },
};

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

  await ensureDatabase(url);
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  await client.query(fs.readFileSync(path.join(here, '../db/schema.sql'), 'utf8'));
  console.log('Tables ready');

  await client.query('BEGIN');
  await client.query(
    `INSERT INTO subjects (code, name) VALUES ('9618', 'Computer Science (9618)')
     ON CONFLICT (code) DO NOTHING`,
  );
  let total = 0;
  for (const [num, info] of Object.entries(PAPERS)) {
    const paper = Number(num);
    const html = fs.readFileSync(path.join(root, `paper${paper}.html`), 'utf8');
    const bank = readEmbedded(html, 'bank');
    const chapters = readChapters(html);

    await client.query(
      `INSERT INTO papers (number, title, description) VALUES ($1, $2, $3)
       ON CONFLICT (number) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description`,
      [paper, info.title, info.description],
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
        [code, paper, p.code, p.qp?.startsWith('http') ? p.qp : '', p.ms?.startsWith('http') ? p.ms : ''],
      );
    }
    for (const q of bank.items) {
      const examCode = `${q.session}-${q.variant}`;
      await client.query(
        `INSERT INTO questions (id, paper, exam_code, session, variant, label, marks, chapter, subtopic, prompt,
                                context_note, answer_type, criteria, max_note, rejects, final_answer, confidence)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT (id) DO UPDATE SET
           paper = EXCLUDED.paper, exam_code = EXCLUDED.exam_code, session = EXCLUDED.session,
           variant = EXCLUDED.variant, label = EXCLUDED.label, marks = EXCLUDED.marks,
           chapter = EXCLUDED.chapter, subtopic = EXCLUDED.subtopic, prompt = EXCLUDED.prompt,
           context_note = EXCLUDED.context_note, answer_type = EXCLUDED.answer_type,
           criteria = EXCLUDED.criteria, max_note = EXCLUDED.max_note, rejects = EXCLUDED.rejects,
           final_answer = EXCLUDED.final_answer, confidence = EXCLUDED.confidence`,
        [
          q.id, paper, bank.papers[examCode] ? examCode : null, q.session, q.variant, q.q, q.marks,
          q.chapter, q.subtopic || '', q.prompt, q.context_note || '', q.answer_type || 'text',
          JSON.stringify(q.criteria || []), q.max_note || '', JSON.stringify(q.rejects || []),
          q.final_answer || '', q.confidence || '',
        ],
      );
    }
    total += bank.items.length;
    console.log(`Paper ${paper}: ${bank.items.length} questions`);
  }
  await client.query('COMMIT');
  await client.end();
  console.log(`Done. ${total} questions loaded.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
