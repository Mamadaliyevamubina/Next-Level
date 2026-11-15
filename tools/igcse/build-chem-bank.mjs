// Builds Cambridge (CAIE) Chemistry question banks from the question papers and mark schemes:
//   0620 IGCSE Chemistry: Papers 1–6 (Core and Extended)        → data/chemistry-paper<N>.json
//   9701 AS & A Level Chemistry: Papers 1–5                      → data/chemistry-alevel-paper<N>.json
//   9700 AS & A Level Biology: Papers 1–5                        → data/biology-alevel-paper<N>.json
// The papers, topics and topic rules of each syllabus are in chem-syllabus-<code>.mjs (bio-syllabus-9700.mjs for Biology).
// Input is the output of extract-chem.mjs and render-pages.mjs.
// Usage: node build-chem-bank.mjs <json dir> <page png dir> <repo root> [0620|9701|9700]
// Figures go to public/figures/chemistry (0620), chemistry-alevel (9701) or biology-alevel (9700); uses macOS sips.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [jsonDir, pageDir, repo, syllabus = '0620'] = process.argv.slice(2);
const SYLLABUS_FILES = { '0620': './chem-syllabus-0620.mjs', 9701: './chem-syllabus-9701.mjs', 9700: './bio-syllabus-9700.mjs' };
if (!repo || !SYLLABUS_FILES[syllabus]) {
  console.error('Usage: node build-chem-bank.mjs <json dir> <page png dir> <repo root> [0620|9701|9700]');
  process.exit(1);
}
const SYL = await import(SYLLABUS_FILES[syllabus]);
const { TOPICS, HINTS, FIG_DIR } = SYL;
const figDir = path.join(repo, 'public', FIG_DIR);
fs.mkdirSync(figDir, { recursive: true });

const SESSIONS = { m: 'Feb/March', s: 'May/June', w: 'Oct/Nov' };
const PDF_URL = (name) => `https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/${name}.pdf`;

// ---------- text helpers ----------
const clean = (s) => s
  .replace(/[\u0000-\u0008]/g, ' ') // some 2023 papers use control characters as spaces
  .replace(//g, '→').replace(//g, '×').replace(//g, '°').replace(//g, '÷')
  .replace(/\s?/g, '• ').replace(//g, 'Δ').replace(//g, '%').replace(//g, '−').replace(//g, '+')
  .replace(//g, '<').replace(//g, '>').replace(//g, ' ').replace(//g, '✓').replace(//g, '✗')
  .replace(/[-]/g, '')
  .replace(/Tick \((?:ü|3|)\)/g, 'Tick (✓)')
  .replace(/\s+/g, ' ').trim();

const MARGIN = /DO NOT WRITE IN THIS MARGIN/g;
const NOISE = [/^© UCLES/, /^\[Turn over/, /^\*\s?\d{6,}/, /^BLANK PAGE/, /^Permission to reproduce/, /^Cambridge Assessment International Education is part/,
  /^To avoid the issue of disclosure/, /^© Cambridge University Press/, /^PUBLISHED$/, /– Mark Scheme$|^Cambridge (IGCSE|International AS & A Level)/, /^Page \d+ of \d+/,
  /^\[Total: \d+\]$/, /^Trace ID/, /^Re-uploading/, /^Licensed for hosting/, /PapaCambridge/, /^Downloaded from/, /^Source: papacambridge/i,
  /reasonable effort has been made/i, /Copyright Acknowledgements/i, /^Cambridge Assessment International Education Copyright/,
  /^Cambridge University Press & Assessment is/i, /^of the University of Cambridge/, /^Every reasonable effort/,
  /unwittingly/i, /third-party owned material/i, /pleased to make amends/i, /cambridgeinternational\.org/i, /Copyright Acknowledgements Booklet/i];
const isGarbled = (t) => /[\u0000-\u0008]/.test(t) || /^,.*,$/.test(t) || (/^[ -ɏ\s]+$/.test(t) && /[Ā-ɏ]/.test(t));

// Lines of a page with headers, footers, margin notes and barcodes removed. Cells are cleaned too.
function pageLines(page) {
  const out = [];
  let prevX = 92;
  for (const l of page.lines) {
    // The copyright acknowledgement at the end of the paper: nothing after it is a question.
    if (/^Permissiontoreproduce/i.test(l.text.replace(/\s+/g, ""))) break;
    if (l.y < 50 || l.y > page.h - (page.w > page.h ? 40 : 30)) continue;
    const cells = [];
    for (const c of l.cells) {
      const hadMargin = MARGIN.test(c.text);
      MARGIN.lastIndex = 0;
      const text = clean(c.text.replace(MARGIN, ' '));
      if (!text || isGarbled(text)) continue;
      // Text glued to the rotated margin note sits at the margin's x; put it back at the running indent.
      let x = c.x;
      if (hadMargin && (c.x < 40 || c.x > 575)) {
        x = /^\([a-h]\)/.test(text) ? 71 : /^\((i{1,3}|iv|v|vi{0,3})\)/.test(text) ? 92 : prevX;
      }
      cells.push({ ...c, x, text });
    }
    if (!cells.length) continue;
    const text = cells.map((c) => c.text).join(' | ');
    if (NOISE.some((r) => r.test(text))) continue;
    if (/^\d{1,2}$/.test(text) && l.y < 70) continue; // page number
    out.push({ ...l, x: cells[0].x, cells, text });
    prevX = cells[0].x;
  }
  return out;
}

const skipPage = (lines) => {
  const t = lines.map((l) => l.text).join(' ');
  return lines.length < 3 && /BLANK PAGE/.test(t)
    || /The Periodic Table of Elements/.test(t)
    || (/Permission to reproduce items/.test(t) && lines.length < 12)
    || lines.length === 0;
};

// ---------- figures ----------
let figCount = 0;
function crop(stem, pageIdx, y0, y1, name, pageH, pageW) {
  const png = path.join(pageDir, `${stem}-${pageIdx + 1}.png`);
  if (!fs.existsSync(png)) return null;
  const scale = 2;
  const top = Math.max(0, Math.floor((y0 - 11) * scale));
  const bottom = Math.min(Math.floor((pageH - (pageW > pageH ? 40 : 58)) * scale), Math.ceil((y1 + 6) * scale));
  const h = bottom - top;
  if (h < 40) return null;
  const out = path.join(figDir, `${name}.jpg`);
  if (!fs.existsSync(out)) {
    const tmp = out.replace('.jpg', '.png');
    const width = Math.round(pageW * scale);
    // Leave out the page margins (and the "DO NOT WRITE IN THIS MARGIN" notes printed in them).
    const left = pageW > pageH ? 80 : 64;
    const right = pageW > pageH ? 80 : 64;
    execFileSync('sips', ['-c', String(h), String(width - left - right), '--cropOffset', String(top), String(left), png, '--out', tmp], { stdio: 'ignore' });
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '62', '-Z', pageW > pageH ? '1200' : '900', tmp, '--out', out], { stdio: 'ignore' });
    fs.rmSync(tmp);
  }
  figCount += 1;
  return `${FIG_DIR}/${name}.jpg`;
}

// ---------- topics (from chem-syllabus-<code>.mjs) ----------
const mcqPrior = (n) => (SYL.MCQ_ORDER.find(([last]) => n <= last) || [0, SYL.MCQ_ORDER.at(-1)[1]])[1];

// Picks the topic with the most keyword hits; opts.chapters limits it to the topics a paper can test.
function classify(rawText, msText, opts = {}) {
  const text = rawText.replace(/boiling tubes?/gi, 'tube');
  const focus = opts.focus || text;
  const chapters = opts.chapters || Object.keys(TOPICS).map(Number);
  let best = chapters[0];
  let bestScore = -1;
  for (const ch of chapters) {
    let score = (text.match(HINTS[ch]) || []).length * 2 + (msText.match(HINTS[ch]) || []).length;
    if (opts.prior === ch) score += 3;
    else if (opts.prior && Math.abs(opts.prior - ch) === 1) score += 0.5;
    if (opts.fallback === ch) score += 3;
    if (opts.practical && ch === SYL.PRACTICAL_TOPIC) score += 4;
    score += SYL.strong(ch, text);
    if (score > bestScore) { bestScore = score; best = ch; }
  }
  const all = `${text}\n${msText}`;
  const subs = TOPICS[best][1];
  const sub = subs.find(([, re]) => re.source !== '.' && re.test(focus)) || subs.find(([, re]) => re.source !== '.' && re.test(text))
    || subs.find(([, re]) => re.test(all));
  return { chapter: best, subtopic: sub[0] };
}

// ---------- mark schemes ----------
const LABEL = /^(\d{1,2}(?:\s?\([a-h]\))?(?:\s?\((?:i{1,3}|iv|v|vi{0,3}|ix|x)\))?)(?=\s|$)\s*(.*)$/;
const normLabel = (s) => s.replace(/\s+/g, '');

function parseMS(file) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, file)));
  const entries = {};
  let cols = null;
  let cur = null;
  doc.pages.forEach((page, pageIdx) => {
    const lines = pageLines(page);
    for (const l of lines) {
      if (/^Question\b/.test(l.text) && /Answer/.test(l.text) && /Marks/.test(l.text)) {
        const find = (w) => l.cells.find((c) => new RegExp(`\\b${w}\\b`).test(c.text));
        const marks = find('Marks');
        const guid = find('Guidance');
        // "Question Answer | Marks Guidance": two headers in one cell.
        cols = { marks: marks ? marks.x + (/^Answer/.test(marks.text) ? 200 : 0) : 700, guidance: guid ? (marks === guid ? guid.x + 60 : guid.x) : null };
        continue;
      }
      if (!cols) continue;
      const answer = [];
      const guidance = [];
      let marks = null;
      let label = null;
      // Some mark schemes put "[1]" beside each marking point: drop it (each line is then one point).
      l.cells.filter((c) => !/^\[\d\]$/.test(c.text)).forEach((c, i) => {
        let t = c.text.replace(/\s*\[\d\]$/, '');
        if (i === 0 && c.x < 105) {
          const m = t.match(LABEL);
          if (m) { label = normLabel(m[1]); t = m[2]; }
        }
        if (!t) return;
        if (c.x >= cols.marks - 30) {
          const mm = t.match(/^(\d{1,2})(?:\s+(.*))?$/);
          if (mm && c.x < cols.marks + 60) { marks = Number(mm[1]); if (mm[2]) guidance.push(mm[2]); return; }
          if (cols.guidance || c.x > cols.marks + 60) { guidance.push(t); return; }
        }
        answer.push({ x: c.x, xe: c.xe, text: t });
      });
      if (label) {
        cur = entries[label] || (entries[label] = { label, marks: null, lines: [], guidance: [], page: pageIdx, y: l.y, segments: [] });
      }
      if (!cur) continue;
      if (marks !== null && cur.marks === null) cur.marks = marks;
      if (answer.length) cur.lines.push({ cells: answer, y: l.y, page: pageIdx });
      cur.guidance.push(...guidance);
      cur.segments.push({ page: pageIdx, y: l.y });
    }
  });
  // Where answer text starts (x ≈ 127); lines indented well past it are cells of a drawn table.
  const xs = {};
  for (const e of Object.values(entries)) for (const l of e.lines) for (const c of l.cells) if (c.x > 100 && c.x < 200) xs[Math.round(c.x)] = (xs[Math.round(c.x)] || 0) + 1;
  const base = Number(Object.entries(xs).sort((a, b) => b[1] - a[1])[0]?.[0] || 127);
  return { doc, entries, base, stem: file.replace('.json', '') };
}

const NOTE = /^(\d( or \d)? correct\s*=|any (one|two|three|four|five|six|\d)\b|max(imum)?\b|award\b|(one|two|1|2) marks? (for|if)\b|ignore\b|note:|for \d marks|marks? (can|may|are)\b)/i;

function msToCriteria(entry, base) {
  const criteria = [];
  const notes = [];
  const headline = [];
  let figure = false;
  let mode = null; // 'M' when the scheme lists M1, M2 …
  const hasM = entry.lines.some((l) => /^(M|MP)\s?\d+\b/.test(l.cells[0].text));
  for (const l of entry.lines) {
    const c = l.cells[0];
    // A drawn answer or table: shown as an image.
    if (l.cells.length > 1 || c.x > base + 30) { figure = true; continue; }
    let t = c.text.replace(/^[•▪]\s*/, '');
    if (!t) continue;
    const mp = t.match(/^(?:M|MP)\s?\d+\s*[:.\-–]?\s*(.*)$/);
    if (mp) { criteria.push({ point: mp[1] || t, x: c.x, xe: c.xe }); mode = 'M'; continue; }
    if (hasM && mode !== 'M') { headline.push(t); continue; }
    if (NOTE.test(t)) { notes.push(t); continue; }
    const last = criteria[criteria.length - 1];
    // Continuation of the previous point: wrapped text, an "OR" alternative, or an indented line under an M point.
    const wrapped = last && (/^[a-z(]/.test(t) || /[,/(–-]$|\b(and|or|of|the|to|in|with|by)$/i.test(last.point));
    if (last && (/^(OR|or)\b/.test(t) || wrapped || (mode === 'M' && c.x > last.x + 4))) {
      last.point += ` ${t}`;
      continue;
    }
    criteria.push({ point: t, x: c.x, xe: c.xe });
  }
  return {
    criteria: criteria.map((c) => ({ point: c.point.replace(/\s+/g, ' ').trim(), key_terms: [] })).filter((c) => c.point),
    headline, notes, figure,
  };
}

// Biology (9700) mark schemes have no Guidance column: each marking point ends in ";", alternatives ("or") and
// wrapped text sit indented under it, and "A …" (accept), "R …" (reject), "I …" (ignore), "AW", "ora" lines are guidance.
const BIO_GUIDE = /^(A|R|I|Ignore|Accept|Reject|Allow|AW|ora|DO NOT CREDIT|CREDIT)\b\s*/;
const BIO_NOTE = /^(\d( ?\/ ?\d)* correct = |must be\b|.*\brequired$|accept\b|allow max\b|(and )?any (one|two|three|four|five|six|seven|eight|\d+) from:?$)/i;
function bioCriteria(entry, base) {
  const criteria = [];
  const notes = [];
  const headline = [];
  const guidance = [];
  let figure = false;
  const isNumbered = (t) => /^\d{1,2}\s+(?!correct|marks?\b|\/)\S/.test(t);
  const hasNum = entry.lines.some((l) => l.cells.length === 1 && Math.abs(l.cells[0].x - base) < 5 && isNumbered(l.cells[0].text));
  const add = (text, x) => {
    // "point ; A alternative" on one line: the part after "; A " is guidance.
    const [pt, ...rest] = text.split(/\s*;\s*(?=(?:A|R|I|Ignore|AW|ora)\b)/);
    if (pt) criteria.push({ point: pt, x, open: !/;\s*$/.test(text) || rest.length > 0 });
    if (rest.length) guidance.push(...rest);
  };
  for (const l of entry.lines) {
    const cells = l.cells.filter((c) => c.text !== ';');
    if (!cells.length) continue;
    const c = cells[0];
    // A drawn answer or table (several cells, or text far to the right of the answer column): shown as an image.
    if (cells.length > 1 || c.x > base + 70) { figure = true; continue; }
    const t = c.text.replace(/^[•▪]\s*/, '');
    if (!t) continue;
    const last = criteria[criteria.length - 1];
    const indented = c.x > base + 8;
    if (BIO_GUIDE.test(t) && (criteria.length || indented)) { guidance.push(t); continue; }
    if (NOTE.test(t) || BIO_NOTE.test(t)) { notes.push(t); continue; }
    // A lead-in line before numbered points ("with red light ora green light") is a note, not the answer.
    if (hasNum && !isNumbered(t) && !criteria.length && !indented) { notes.push(t); continue; }
    if (last && indented) {
      // "or" / "and" / "either" between alternatives, or a wrapped line: part of the point above.
      last.point += /^(or|and|either)$/i.test(t) ? ` ${t.toUpperCase()}` : ` ${t}`;
      last.open = !/;\s*$/.test(t);
      continue;
    }
    if (last && !isNumbered(t) && last.open && /[,/(–-]$|\b(and|or|of|the|to|in|with|by|for)$/i.test(last.point.trim())) {
      last.point += ` ${t}`;
      last.open = !/;\s*$/.test(t);
      continue;
    }
    add(t, c.x);
  }
  const tidy = (s) => s.replace(/^\d{1,2}\s+/, '').replace(/(\s*;)+\s*$/, '').replace(/\s*;\s*;(\s*;)*/g, ';').replace(/\s+/g, ' ').trim();
  return {
    criteria: criteria.map((c) => ({ point: tidy(c.point), key_terms: [] })).filter((c) => c.point),
    headline, notes, figure, guidance,
  };
}

function guidanceNotes(list) {
  const text = list.join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  return [`${text} (A = accept, R = reject, I = ignore)`];
}

// ---------- structured question papers ----------
const ROMAN = /^\((i{1,3}|iv|v|vi{0,3}|ix|x)\)\s*(.*)$/;
function parseQP(file) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, file)));
  const parts = [];
  let q = 0; let letter = null; let roman = null; let cur = null;
  const start = (label, kind, line, pageIdx) => {
    cur = { q, letter, roman, label, kind, lines: [], marks: 0, page: pageIdx, y: line.y, segments: [] };
    parts.push(cur);
  };
  let stop = false;
  doc.pages.forEach((page, pageIdx) => {
    if (pageIdx === 0 || stop) return;
    const lines = pageLines(page);
    if (skipPage(lines)) return;
    for (const l of lines) {
      if (/Permission to reproduce items|third-party owned material/.test(l.text)) { stop = true; break; }
      let text = l.text;
      let labelled = false;
      const qm = l.x < 60 && text.match(/^(\d{1,2})\s+(.*)$/);
      const lm = l.x > 62 && l.x < 82 && text.match(/^\(([a-h])\)\s*(.*)$/);
      const rm = l.x > 80 && l.x < 104 && text.match(ROMAN);
      if ((qm && Number(qm[1]) === q + 1) || lm || (rm && q && letter)) labelled = true;
      if (qm && Number(qm[1]) === q + 1) {
        q += 1; letter = null; roman = null;
        start(`${q}`, 'stem', l, pageIdx);
        text = qm[2];
        const inner = text.match(/^\(([a-h])\)\s*(.*)$/);
        if (inner) { letter = inner[1]; start(`${q}(${letter})`, 'part', l, pageIdx); text = inner[2]; }
        const innerR = text.match(ROMAN);
        if (inner && innerR) { roman = innerR[1]; start(`${q}(${letter})(${roman})`, 'part', l, pageIdx); text = innerR[2]; }
      } else if (lm && q) {
        letter = lm[1]; roman = null; start(`${q}(${letter})`, 'part', l, pageIdx); text = lm[2];
        const inner = text.match(ROMAN);
        if (inner) { roman = inner[1]; start(`${q}(${letter})(${roman})`, 'part', l, pageIdx); text = inner[2]; }
      } else if (rm && q && letter) {
        roman = rm[1]; start(`${q}(${letter})(${roman})`, 'part', l, pageIdx); text = rm[2];
      }
      if (!cur) continue;
      const mk = text.match(/\[(\d{1,2})\]\s*$/);
      if (mk) { cur.marks += Number(mk[1]); text = text.replace(/\s*\|?\s*\[(\d{1,2})\]\s*$/, ''); }
      // Answer lines made of dots.
      const undotted = text.replace(/\.{6,}|…{3,}/g, ' ').replace(/\s+/g, ' ').trim();
      if (undotted.length < text.length - 5) {
        cur.segments.push({ page: pageIdx, y: l.y });
        if (!undotted || /^[A-Z]?\s*[|:]?$/.test(undotted) || undotted.length < 30) {
          if (undotted && !/^[|:]$/.test(undotted)) cur.lines.push({ ...l, text: undotted, page: pageIdx, label: true });
          continue;
        }
        text = undotted;
      }
      cur.segments.push({ page: pageIdx, y: l.y });
      if (!text.trim()) continue;
      cur.lines.push({ ...l, text, page: pageIdx, labelled });
    }
  });
  return { doc, parts, stem: file.replace('.json', ''), pageH: doc.pages[0].h, pageW: doc.pages[0].w };
}

// Running text sits at the standard indents; anything else (tables, diagrams, labels, structures) is a figure.
const NORMAL_X = [49.7, 70.9, 72.3, 92.2, 95.2, 113.9, 117.7, 119.9];
const isFigureLine = (l) => l.label || l.cells.length > 1 || (!l.labelled && !NORMAL_X.some((x) => Math.abs(l.x - x) < 2.6));
const FIGURE_WORDS = /\b(Fig\.|Table \d|diagram|graph|grid|draw|plot|sketch|shown below|complete the|structure of|displayed formula|dot-and-cross|label|shade|circle|tick)\b/i;

function toText(lines) {
  const out = [];
  let para = null;
  for (const l of lines) {
    const t = l.text.replace(/^[•▪]\s*/, '- ');
    if (para && !/^- /.test(t) && para.xe > 470 && Math.abs(para.x - l.x) < 30) {
      para.text += ` ${t}`;
      para.xe = l.xe;
    } else {
      if (para) out.push(para.text);
      para = { text: t, x: l.x, xe: l.xe };
    }
  }
  if (para) out.push(para.text);
  return out.join('\n\n').trim();
}

function regions(part, idx, list, pageH) {
  const next = list[idx + 1];
  const byPage = {};
  for (const s of part.segments) (byPage[s.page] ||= []).push(s.y);
  if (!part.segments.length) byPage[part.page] = [part.y];
  return Object.keys(byPage).map(Number).sort((a, b) => a - b).map((p) => {
    const ys = byPage[p];
    let y0 = Math.min(...ys);
    if (p === part.page) y0 = part.y;
    let y1 = Math.max(...ys) + 8;
    if (next && next.page === p) y1 = Math.min(y1 + 30, next.y - 16);
    return { page: p, y0, y1: Math.min(y1, pageH - 62) };
  });
}

function answerType(text) {
  if (/tick \(✓\)|put a ring|circle (one|two)|draw a ring/i.test(text)) return 'multiple-choice';
  if (/\bdraw|sketch|plot|complete (the|fig)|on fig|dot-and-cross|displayed formula|label/i.test(text)) return 'diagram';
  if (/calculate|determine the (mass|volume|number|concentration|percentage)|show your working/i.test(text)) return 'calculation';
  if (/(symbol|ionic|half-?) ?equation|write .*equation/i.test(text)) return 'equation';
  if (/complete table|\btable\b/i.test(text)) return 'table';
  return 'text';
}

function buildStructured(qpFile, ms, bank, meta) {
  const qp = parseQP(qpFile);
  const order = qp.parts;
  // When the mark scheme only marks the whole lettered part, fold its (i)/(ii) back into it.
  for (const lp of order.filter((o) => o.kind === 'part' && !o.roman)) {
    const kids = order.filter((o) => o.q === lp.q && o.letter === lp.letter && o.roman);
    if (!kids.length) continue;
    if (!kids.some((k) => ms.entries[normLabel(k.label)]) && ms.entries[normLabel(lp.label)]) {
      for (const k of kids) {
        lp.lines.push(...k.lines); lp.segments.push(...k.segments); lp.marks += k.marks;
        order.splice(order.indexOf(k), 1);
      }
    }
  }
  // A label seen twice (e.g. a part restarted after a page of instructions) is one part: merge the second into the first.
  for (let i = order.length - 1; i > 0; i--) {
    const first = order.find((o) => o.label === order[i].label);
    if (first !== order[i]) {
      first.lines.push(...order[i].lines); first.segments.push(...order[i].segments); first.marks += order[i].marks;
      order.splice(i, 1);
    }
  }
  const stems = Object.fromEntries(order.filter((p) => p.kind === 'stem').map((p) => [p.q, p]));
  const leaves = order.filter((p) => (p.kind === 'stem'
    ? !order.some((o) => o.q === p.q && o.kind === 'part')
    : !(!p.roman && order.some((o) => o.q === p.q && o.letter === p.letter && o.roman))));
  // Topic of each whole question, used when a part on its own gives little to go on.
  const qTopic = {};
  for (const [qn] of Object.entries(stems)) {
    const all = order.filter((o) => o.q === Number(qn)).flatMap((o) => o.lines.map((l) => l.text)).join(' ');
    qTopic[qn] = classify(all, '', { practical: meta.practical, chapters: meta.chapters }).chapter;
  }

  for (const part of leaves) {
    meta.stats.parts += 1;
    const label = part.kind === 'stem' ? `${part.q}` : part.label;
    const stemPart = part.kind === 'stem' ? null : stems[part.q];
    const letterPart = part.roman ? order.find((o) => o.q === part.q && o.letter === part.letter && !o.roman && o.kind === 'part') : null;
    const id = `${SYL.ID_PREFIX}${meta.examKey}-${label.replace(/[()]/g, '')}`;
    const slug = `${meta.examKey}-${label.replace(/[()]/g, '')}`;

    const figures = [];
    const hasFig = (p) => p && p.lines.filter(isFigureLine).length >= 2;
    const ctxLines = [...(stemPart?.lines || []), ...(letterPart?.lines || [])];
    if (stemPart && hasFig(stemPart)) {
      regions(stemPart, order.indexOf(stemPart), order, qp.pageH).forEach((r, k) => {
        const f = crop(qp.stem, r.page, r.y0, r.y1, `${meta.examKey}-${part.q}-stem-${k}`, qp.pageH, qp.pageW);
        if (f && !figures.includes(f)) figures.push(f);
      });
    }
    if (letterPart && hasFig(letterPart)) {
      regions(letterPart, order.indexOf(letterPart), order, qp.pageH).forEach((r, k) => {
        const f = crop(qp.stem, r.page, r.y0, r.y1, `${meta.examKey}-${part.q}${letterPart.letter}-ctx-${k}`, qp.pageH, qp.pageW);
        if (f) figures.push(f);
      });
    }
    const textOnly = (lines) => lines.filter((l) => !isFigureLine(l));
    let prompt = toText(textOnly(part.lines));
    const context = toText(textOnly(ctxLines));
    if (hasFig(part) || FIGURE_WORDS.test(prompt)) {
      regions(part, order.indexOf(part), order, qp.pageH).forEach((r, k) => {
        const f = crop(qp.stem, r.page, r.y0, r.y1, `${slug}-${k}`, qp.pageH, qp.pageW);
        if (f) figures.push(f);
      });
    }
    if (!prompt) prompt = toText(part.lines) || '(See the figure.)';

    const entry = ms.entries[normLabel(label)];
    if (!entry) {
      bank.skipped.push({ code: meta.code, q: label, marks: part.marks, why: 'No matching mark scheme entry was found.' });
      continue;
    }
    meta.stats.matched += 1;
    const parsed = SYL.CODE === '9700' ? bioCriteria(entry, ms.base) : msToCriteria(entry, ms.base);
    const answerFigures = [];
    if (parsed.figure || !parsed.criteria.length) {
      const byPage = {};
      for (const s of entry.segments) (byPage[s.page] ||= []).push(s.y);
      Object.keys(byPage).map(Number).sort((a, b) => a - b).forEach((p, k) => {
        const ys = byPage[p];
        const pg = ms.doc.pages[p];
        const f = crop(ms.stem, p, Math.min(...ys), Math.max(...ys) + 2, `${slug}-ms-${k}`, pg.h, pg.w);
        if (f) answerFigures.push(f);
      });
    }
    let criteria = parsed.criteria;
    const partMarks = part.marks || entry.marks || 1;
    if (parsed.figure && answerFigures.length && criteria.length < partMarks) {
      criteria = Array.from({ length: partMarks }, (_, k) => ({ point: `Marking point ${k + 1} in the mark scheme answer shown below`, key_terms: [] }));
    }
    if (!criteria.length && parsed.headline.length) criteria = parsed.headline.map((point) => ({ point, key_terms: [] }));
    if (!criteria.length && answerFigures.length) criteria = [{ point: 'Answer matches the mark scheme answer shown in the model answer image.', key_terms: [] }];
    if (!criteria.length) {
      bank.skipped.push({ code: meta.code, q: label, marks: part.marks, why: 'The mark scheme entry could not be read.' });
      continue;
    }
    const marks = part.marks || entry.marks || criteria.length;
    const msText = [...parsed.headline, ...criteria.map((c) => c.point)].join(' ');
    const { chapter, subtopic } = classify(`${context}\n${prompt}`, msText, { fallback: qTopic[part.q], practical: meta.practical, focus: prompt, chapters: meta.chapters });
    bank.items.push({
      id,
      session: meta.sess,
      variant: meta.variant,
      paper_code: meta.code,
      q: label,
      marks,
      chapter,
      subtopic,
      prompt,
      context_note: context,
      answer_type: answerType(`${context}\n${prompt}`),
      criteria,
      max_note: parsed.notes.join(' '),
      rejects: guidanceNotes([...entry.guidance, ...(parsed.guidance || [])]),
      final_answer: parsed.headline.length ? parsed.headline.join('\n') : criteria.slice(0, Math.max(marks, 1)).map((c) => c.point).join('; '),
      confidence: figures.length || answerFigures.length ? 'medium' : 'high',
      figures,
      answer_figures: answerFigures,
    });
  }
}

// ---------- multiple choice papers ----------
function buildMCQ(qpFile, ms, bank, meta) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, qpFile)));
  const stem = qpFile.replace('.json', '');
  const qs = [];
  let n = 0;
  doc.pages.forEach((page, pageIdx) => {
    if (pageIdx === 0) return;
    const lines = pageLines(page);
    if (skipPage(lines)) return;
    for (const l of lines) {
      const m = l.x < 60 && l.text.match(/^(\d{1,2})\s+(.*)$/);
      if (m && Number(m[1]) === n + 1) { n += 1; qs.push({ n, page: pageIdx, y: l.y, lines: [], h: page.h, w: page.w }); }
      if (qs.length && qs[qs.length - 1].page === pageIdx) qs[qs.length - 1].lines.push(l);
    }
  });
  qs.forEach((q, i) => {
    meta.stats.parts += 1;
    const next = qs[i + 1];
    const lastY = Math.max(...q.lines.map((l) => l.y));
    // Option diagrams can sit below the last text line, so run to the next question or the foot of the page.
    const y1 = next && next.page === q.page ? next.y - 16 : Math.max(lastY + 6, q.h - 64);
    const fig = crop(stem, q.page, q.y, y1, `${meta.examKey}-${q.n}-0`, q.h, q.w);
    const entry = ms.entries[String(q.n)];
    const key = entry?.lines.map((l) => l.cells.map((c) => c.text).join(' ')).join(' ').trim().match(/^[A-D]\b/)?.[0];
    if (!key || !fig) {
      bank.skipped.push({ code: meta.code, q: String(q.n), marks: 1, why: key ? 'The question could not be cropped.' : 'No answer in the mark scheme key.' });
      return;
    }
    meta.stats.matched += 1;
    const text = q.lines.map((l) => l.text).join('\n').replace(/^\d{1,2}\s+/, '');
    const { chapter, subtopic } = classify(text, '', { prior: mcqPrior(q.n), chapters: meta.chapters });
    bank.items.push({
      id: `${SYL.ID_PREFIX}${meta.examKey}-${q.n}`,
      session: meta.sess,
      variant: meta.variant,
      paper_code: meta.code,
      q: String(q.n),
      marks: 1,
      chapter,
      subtopic,
      prompt: `${text}\n\nWrite A, B, C or D.`,
      context_note: '',
      answer_type: 'multiple-choice',
      criteria: [{ point: key, key_terms: [] }],
      max_note: '',
      rejects: [],
      final_answer: key,
      confidence: 'high',
      figures: [fig],
      answer_figures: [],
    });
  });
}

// ---------- build ----------
const banks = Object.fromEntries(Object.keys(SYL.PAPERS).map((p) => [p, { items: [], papers: {}, skipped: [] }]));
const stats = { parts: 0, matched: 0 };
const fileRe = new RegExp(`^${SYL.CODE}_[msw]\\d\\d_qp_[${Object.keys(SYL.PAPERS).join('')}]\\d\\.json$`);
const files = fs.readdirSync(jsonDir).filter((f) => fileRe.test(f)
  && (!process.env.ONLY || process.env.ONLY.split(',').some((o) => f.includes(o)))).sort();

for (const qpFile of files) {
  const [, sess, , variant] = qpFile.replace('.json', '').split('_');
  const paper = Number(variant[0]);
  const code = `${SYL.CODE}/${variant} ${SESSIONS[sess[0]]} 20${sess.slice(1)}`;
  const examKey = `${sess}-${variant}`;
  const msFile = qpFile.replace('_qp_', '_ms_');
  const bank = banks[paper];
  bank.papers[examKey] = { code, qp: PDF_URL(`${SYL.CODE}_${sess}_qp_${variant}`), ms: PDF_URL(`${SYL.CODE}_${sess}_ms_${variant}`) };
  if (!fs.existsSync(path.join(jsonDir, msFile))) {
    bank.skipped.push({ code, q: '*', marks: 0, why: 'Mark scheme missing.' });
    continue;
  }
  const ms = parseMS(msFile);
  const meta = { sess, variant, paper, code, examKey, stats, chapters: SYL.chaptersFor(paper), practical: SYL.PRACTICAL.has(paper) };
  if (SYL.MCQ.has(paper)) buildMCQ(qpFile, ms, bank, meta);
  else buildStructured(qpFile, ms, bank, meta);
}

const summary = { syllabus: SYL.CODE, ...stats, figures: figCount };
for (const [p, bank] of Object.entries(banks)) {
  // Only the topics this paper can test (and that have questions) become its chapters.
  const used = new Set(bank.items.map((q) => q.chapter));
  bank.chapters = Object.fromEntries(SYL.chaptersFor(Number(p)).filter((k) => used.has(k)).map((k) => [k, TOPICS[k][0]]));
  bank.title = SYL.PAPERS[p];
  fs.mkdirSync(path.join(repo, 'data'), { recursive: true });
  fs.writeFileSync(path.join(repo, SYL.OUT(p)), JSON.stringify(bank));
  summary[`p${p}`] = bank.items.length;
  summary[`skipped${p}`] = bank.skipped.length;
}
console.log(JSON.stringify(summary));
