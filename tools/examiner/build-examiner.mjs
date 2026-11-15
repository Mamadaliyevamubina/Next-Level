// Turns Cambridge Principal Examiner Reports (one PDF per syllabus per session, e.g. 0620_s24_er.pdf) into
// examiner comments for each paper and each question part.
// Input: the JSON that tools/igcse/extract-chem.mjs makes from the report PDFs.
// Output: next-level-backend/seed/examiner-reports.json (loaded by `npm run db:setup`), keyed by exam paper code:
//   { "ch-s24-42": { syllabus, paper, title, session, url, key_messages, general, questions: { "1(a)": "...", "2(a)(i)": "..." } } }
// Usage: node tools/examiner/build-examiner.mjs <report json dir> <output file> [sources.json]
import fs from 'node:fs';
import path from 'node:path';

const [jsonDir, outFile, sourcesFile] = process.argv.slice(2);
if (!jsonDir || !outFile) {
  console.error('Usage: node build-examiner.mjs <report json dir> <output file> [sources.json]');
  process.exit(1);
}
// Exam paper codes in the database: IGCSE CS "ig-s24-12", IGCSE Chemistry "ch-…", A Level Chemistry "ac-…", A Level CS "s24-21".
const PREFIX = { '0478': 'ig-', '0620': 'ch-', 9701: 'ac-', 9618: '' };
const sources = sourcesFile && fs.existsSync(sourcesFile) ? JSON.parse(fs.readFileSync(sourcesFile, 'utf8')) : {};

const clean = (s) => s
  .replace(/[\u0000-\u0008]/g, ' ')
  .replace(/www\.dynamicpapers\.com/gi, '')
  .replace(//g, '→').replace(//g, '×').replace(//g, '°').replace(/\s?/g, '• ').replace(//g, 'Δ')
  .replace(//g, '−').replace(//g, '+').replace(//g, '<').replace(//g, '>').replace(//g, '✓')
  .replace(/[-]/g, '')
  .replace(/\s+\|\s+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const ROMAN = '(?:i{1,3}|iv|vi{0,3}|ix|x)';
const LETTER_RE = new RegExp(`^\\(([a-h])\\)\\s*((?:\\(${ROMAN}\\)\\s*(?:(?:,|and|&|–|-)\\s*)?)*)(.*)$`);
const ROMAN_RE = new RegExp(`^((?:\\(${ROMAN}\\)\\s*(?:(?:,|and|&|–|-)\\s*)?)+)(.*)$`);
const romans = (s) => [...(s || '').matchAll(new RegExp(`\\((${ROMAN})\\)`, 'g'))].map((m) => m[1]);

function parseReport(file) {
  const [syllabus, session] = path.basename(file, '.json').split('_');
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const papers = {};
  let paper = null;
  let section = null; // 'key' | 'general' | 'specific'
  let labels = []; // labels the current text belongs to
  let q = null;
  let letter = null;
  let titleNext = false;

  const add = (where, text) => {
    if (!paper || !text) return;
    if (where === 'key') paper.key_messages.push(text);
    else if (where === 'general') paper.general.push(text);
    else for (const l of labels) (paper.questions[l] ||= []).push(text);
  };

  for (const page of doc.pages) {
    for (const line of page.lines) {
      if (line.y < 60) continue; // running header
      const text = clean(line.text);
      if (!text || /^© ?(UCLES|Cambridge|\d{4})/.test(text) || /^\d{1,3}$/.test(text)) continue;
      if (/^(Cambridge International|Principal Examiner Report|\d{4} [A-Z][a-z]+ [A-Za-z ]+ \d{4}$)/.test(text)) continue;

      const pm = text.match(/^Paper (\d{4})\/(\d\d)\b/);
      if (pm && pm[1] === syllabus) {
        const code = `${PREFIX[syllabus]}${session}-${pm[2]}`;
        paper = papers[code] = { syllabus, paper: `${syllabus}/${pm[2]}`, session, title: '', key_messages: [], general: [], questions: {} };
        section = null; q = null; letter = null; labels = []; titleNext = true;
        continue;
      }
      if (!paper) continue;
      // The paper title follows "Paper 0620/42" and can wrap onto a second line.
      if (titleNext && !/^(Key messages?|General comments?|Comments on specific questions?)$/i.test(text)
        && !/^(Question|Key|Number)\b/.test(text) && paper.title.length < 60) {
        paper.title = `${paper.title} ${text}`.replace(/\s+\d{1,2}$/, '').trim();
        continue;
      }
      titleNext = false;
      if (/^Key messages?$/i.test(text)) { section = 'key'; continue; }
      if (/^General comments?$/i.test(text)) { section = 'general'; continue; }
      if (/^Comments on specific questions?$/i.test(text)) { section = 'specific'; labels = []; continue; }
      // The answer key table of a multiple-choice paper.
      if (/^(Question|Key|Number)( (Question|Key|Number))*$/.test(text) || /^(\d{1,2} [A-D] ?){2,}$/.test(text)) continue;
      if (!section) continue;

      if (section === 'specific') {
        const qm = text.match(/^Questions? (\d{1,2})(?:\s*(?:and|&|–|-|to)\s*(\d{1,2}))?\s*(.*)$/);
        if (qm && line.x < 75) {
          q = Number(qm[1]); letter = null;
          const last = qm[2] ? Number(qm[2]) : q;
          labels = [];
          for (let n = q; n <= last; n++) labels.push(String(n));
          add('specific', qm[3].trim());
          continue;
        }
        if (q !== null && line.x < 90) {
          const lm = text.match(LETTER_RE);
          if (lm) {
            letter = lm[1];
            const rs = romans(lm[2]);
            labels = rs.length ? rs.map((r) => `${q}(${letter})(${r})`) : [`${q}(${letter})`];
            add('specific', lm[3].trim());
            continue;
          }
          const rm = letter && text.match(ROMAN_RE);
          if (rm) {
            labels = romans(rm[1]).map((r) => `${q}(${letter})(${r})`);
            add('specific', rm[2].trim());
            continue;
          }
        }
      }
      add(section, text);
    }
  }

  // Join wrapped lines into paragraphs; bullets start a new line.
  const join = (parts) => parts.join(' ').replace(/\s*•\s*/g, '\n• ').replace(/[ \t]+/g, ' ').trim();
  for (const [code, p] of Object.entries(papers)) {
    p.key_messages = join(p.key_messages);
    p.general = join(p.general);
    p.questions = Object.fromEntries(Object.entries(p.questions).map(([l, parts]) => [l, join(parts)]).filter(([, t]) => t.length > 3));
    p.url = sources[`${syllabus}_${session}`] || `https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/${syllabus}_${session}_er.pdf`;
    if (!p.general && !p.key_messages && !Object.keys(p.questions).length) delete papers[code];
  }
  return papers;
}

const all = {};
const files = fs.readdirSync(jsonDir).filter((f) => /^\d{4}_[msw]\d\d_er\.json$/.test(f)).sort();
for (const f of files) Object.assign(all, parseReport(path.join(jsonDir, f)));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(all));
const comments = Object.values(all).reduce((t, p) => t + Object.keys(p.questions).length, 0);
console.log(JSON.stringify({ reports: files.length, papers: Object.keys(all).length, questionComments: comments }));
