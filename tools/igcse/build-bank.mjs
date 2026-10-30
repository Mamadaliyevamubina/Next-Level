// Builds IGCSE 0478 question banks from the extracted question papers (qp) and mark schemes (ms).
// Usage: node build-igcse.mjs <json dir> <page png dir> <repo root>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [jsonDir, pageDir, repo] = process.argv.slice(2);
const figDir = path.join(repo, 'public/figures/igcse');
fs.mkdirSync(figDir, { recursive: true });

const SESSIONS = { m: 'Feb/March', s: 'May/June', w: 'Oct/Nov' };
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];
const KEYWORDS = new Set(['OUTPUT', 'INPUT', 'DECLARE', 'CONSTANT', 'IF', 'THEN', 'ELSE', 'ENDIF', 'CASE', 'OF', 'OTHERWISE',
  'ENDCASE', 'FOR', 'TO', 'STEP', 'NEXT', 'WHILE', 'DO', 'ENDWHILE', 'REPEAT', 'UNTIL', 'PROCEDURE', 'ENDPROCEDURE',
  'FUNCTION', 'ENDFUNCTION', 'RETURN', 'RETURNS', 'CALL', 'OPENFILE', 'READFILE', 'WRITEFILE', 'CLOSEFILE', 'AND', 'OR',
  'NOT', 'MOD', 'DIV', 'SELECT', 'FROM', 'WHERE', 'ORDER', 'BY', 'SUM', 'COUNT', 'INTEGER', 'REAL', 'STRING', 'CHAR',
  'BOOLEAN', 'ARRAY', 'TRUE', 'FALSE', 'Line', 'be', 'should']);

// ---------- text helpers ----------
const clean = (s) => s
  .replace(/(<>|<=|>=|=|<|>|\(|,) - (\d)/g, '$1 -$2')
  .replace(/[]/g, '•')
  .replace(/\s?\uf0ac\s?/g, ' ← ')
  .replace(/\uf02d/g, '−').replace(/\uf0b4/g, '×').replace(/\uf03e/g, '>').replace(/\uf020/g, ' ')
  .replace(/Tick \((?:ü|3|)\)/g, 'Tick (✓)')
  .replace(/\s+\|\s+/g, ' | ')
  .replace(/[ \t]+$/g, '');

// Keep a recovered "←" only where it is a real assignment (single variable on the left);
// add missing ones in code-like lines where a double space follows the assigned variable.
function fixArrows(text, codeLike) {
  let t = text.replace(/([^\n←]*?)\s←\s+/g, (m, left) => {
    const lhs = left.replace(/^\s*(?:\d\d\s+)?\s*/, '').replace(/^(?:FOR|IF)\s+/, '');
    return /^[A-Za-z]\w*(?:\[[^\]]*\])?$/.test(lhs.trim()) ? `${left} ← ` : `${left}  `;
  });
  if (codeLike) {
    t = t.replace(/(^\s*(?:\d\d\s+)?\s*|\/\s|should be:?\s|be:\s)((?:FOR|IF)\s+)?([A-Za-z]\w*(?:\[[^\]]*\])?)\s{2,}(?=[^\s|←])/g, (m, pre, kw, v) => (
      KEYWORDS.has(v.toUpperCase()) || KEYWORDS.has(v) ? m : `${pre}${kw || ''}${v} ← `));
  }
  return t;
}

const looksCode = (t) => /^\s*(\d\d\s+)?\s*(DECLARE|OUTPUT|INPUT|IF|FOR|WHILE|REPEAT|UNTIL|NEXT|ENDIF|ENDWHILE|CASE|OTHERWISE|ENDCASE|PROCEDURE|FUNCTION|RETURN|CALL|OPENFILE|READFILE|WRITEFILE|CLOSEFILE|CONSTANT|ELSE|THEN|SELECT|FROM|WHERE|ORDER BY)\b/.test(t)
  || /^\s*(\d\d\s+)?\s*[A-Za-z]\w*(\[[^\]]*\])?\s*(←|\s{2,}\S)/.test(t) && /[←=+\-*/(]/.test(t);

const NOISE = [/^© UCLES/, /^\[Turn over/, /^DC \(/, /^\*\s?\d/, /^BLANK PAGE/, /^Permission to reproduce/,
  /^Cambridge Assessment International Education is part/, /^To avoid the issue of disclosure/, /^Working space$/i,
  /^© Cambridge University Press/, /PUBLISHED$/, /^Question \| Answer \| Marks/, /Cambridge IGCSE – Mark Scheme/,
  /^Cambridge IGCSE$/, /^Page \d+ of \d+/, /DO NOT WRITE IN THIS MARGIN/, /^[\u0100-\u024f\s]+$/];
const isNoise = (l) => NOISE.some((r) => r.test(l.text.trim())) || (/^\d{1,2}$/.test(l.text.trim()) && l.x > 280 && l.x < 310 && l.y < 60);

// ---------- figures ----------
let figCount = 0;
function crop(stem, page, y0, y1, name, pageH, pageW = 595.3) {
  const png = path.join(pageDir, `${stem}-${page + 1}.png`);
  const scale = 2;
  const top = Math.max(0, Math.floor((y0 - 14) * scale));
  const bottom = Math.min(Math.floor(pageH * scale), Math.ceil((y1 + 6) * scale));
  const h = bottom - top;
  if (h < 40) return null;
  const out = path.join(figDir, `${name}.jpg`);
  if (!fs.existsSync(out)) {
    const tmp = out.replace('.jpg', '.png');
    const width = Math.round(pageW * scale);
    // Crop: keep page margins out by cropping 40px each side.
    execFileSync('sips', ['-c', String(h), String(width - 80), '--cropOffset', String(top), '40', png, '--out', tmp], { stdio: 'ignore' });
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '60', '-Z', pageW > 700 ? '1200' : '900', tmp, '--out', out], { stdio: 'ignore' });
    fs.rmSync(tmp);
  }
  figCount += 1;
  return `figures/igcse/${name}.jpg`;
}

// ---------- question papers ----------
function parseQP(file) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, file)));
  const stem = file.replace('.json', '');
  const parts = [];
  const questions = {};
  let q = null; let letter = null; let roman = null; let cur = null;
  const start = (label, kind, line, pageIdx) => {
    cur = { q, letter, roman, label, kind, lines: [], marks: 0, page: pageIdx, y: line.y, segments: [] };
    parts.push(cur);
  };
  doc.pages.forEach((page, pageIdx) => {
    if (pageIdx === 0) return;
    const texts = page.lines.map((l) => l.text).join(' ');
    if (/BLANK PAGE/.test(texts) && page.lines.length < 6) return;
    if (/Permission to reproduce items/.test(texts) && page.lines.length < 12) return;
    for (const l of page.lines) {
      if (isNoise(l)) continue;
      let text = clean(l.text);
      const qm = l.x < 60 && text.match(/^(\d{1,2})\s+(.*)$/);
      const lm = l.x > 64 && l.x < 82 && text.match(/^\(([a-h])\)\s*(.*)$/);
      const rm = l.x > 82 && l.x < 102 && text.match(/^\((i{1,3}|iv|v|vi{0,3})\)\s*(.*)$/);
      if (qm) {
        q = Number(qm[1]); letter = null; roman = null;
        questions[q] = { stemLines: [] };
        start(`${q}`, 'stem', l, pageIdx);
        text = qm[2];
        // "7 (a) Outline ..." — question number and part on one line.
        const inner = text.match(/^\(([a-h])\)\s*(.*)$/);
        if (inner) { letter = inner[1]; start(`${q}(${letter})`, 'part', l, pageIdx); text = inner[2]; }
      } else if (lm && q) {
        letter = lm[1]; roman = null; start(`${q}(${letter})`, 'part', l, pageIdx); text = lm[2];
        const inner = text.match(/^\((i{1,3}|iv|v)\)\s*(.*)$/);
        if (inner) { roman = inner[1]; start(`${q}(${letter})(${roman})`, 'part', l, pageIdx); text = inner[2]; }
      } else if (rm && q) {
        roman = rm[1]; start(`${q}${letter ? `(${letter})` : ''}(${roman})`, 'part', l, pageIdx); text = rm[2];
      }
      if (!cur) continue;
      // Marks in square brackets at the end of a line.
      const mk = text.match(/\[(\d{1,2})\]\s*$/);
      if (mk) { cur.marks += Number(mk[1]); text = text.replace(/\[(\d{1,2})\]\s*$/, ''); }
      // Answer lines made of dots.
      const undotted = text.replace(/\.{6,}|…{3,}/g, '').trim();
      if (text.length && undotted.length < text.trim().length) {
        if (!undotted || /^\d+$/.test(undotted) || undotted.length < 40) {
          cur.segments.push({ page: pageIdx, y: l.y });
          continue;
        }
        text = undotted;
      }
      if (!text.trim() || /^[ü\uf0fc]$/.test(text.trim())) { cur.segments.push({ page: pageIdx, y: l.y }); continue; }
      cur.lines.push({ ...l, text, page: pageIdx });
      cur.segments.push({ page: pageIdx, y: l.y });
    }
  });
  // Code-font text scattered over many positions is a flowchart or table drawn in the code font, not a program.
  for (const part of parts) {
    const byPage = {};
    for (const l of part.lines.filter((x) => x.mono)) (byPage[l.page] ||= []).push(l);
    for (const lines of Object.values(byPage)) {
      const xs = new Set(lines.map((l) => Math.round(l.x / 4)));
      const numbered = lines.filter((l) => /^\d\d\s/.test(l.text)).length > lines.length / 2;
      if (xs.size >= 6 && !numbered) lines.forEach((l) => { l.fig = true; });
      // Database tables printed in the code font: columns split by "|" or several field names on one line.
      lines.filter((l) => / \| /.test(l.text) || (l.text.trim().split(/\s{2,}|\s←\s/).length >= 4 && !/^\s*(\d\d\s+)?(OUTPUT|INPUT|IF|FOR|DECLARE)\b/.test(l.text))).forEach((l) => { l.fig = true; });
      // Trace-table headings such as "Limit Count [1] [2] ... OUTPUT".
      lines.filter((l) => /(\[\d\]\s+){2,}|\bOUTPUT\s*$/.test(l.text) && !/^\s*(\d\d\s+)?OUTPUT\b/.test(l.text)).forEach((l) => { l.fig = true; });
    }
  }
  return { stem, doc, parts, pageH: doc.pages[0].h };
}

// Lines of normal running text sit at the standard indents; anything else (tables, diagrams, labels) is a figure.
const NORMAL_X = [50, 72, 95, 118, 93, 96, 90, 141];
function isFigureLine(l) {
  if (l.fig) return true;
  if (l.mono) return false;
  if (/ \| /.test(l.text)) return true;
  return !NORMAL_X.some((x) => Math.abs(l.x - x) < 4);
}

function toMarkdown(lines) {
  const out = [];
  let code = null;
  let para = null;
  const flush = () => { if (para) { out.push(para); para = null; } };
  for (const l of lines) {
    const t = l.text;
    if (!l.fig && (l.mono || (looksCode(t) && /←|DECLARE|OUTPUT|INPUT|ENDIF|NEXT /.test(t)))) {
      flush();
      if (!code) { code = []; out.push(code); }
      code.push(fixArrows(t, true));
      continue;
    }
    code = null;
    const bullet = /^[•○−-]\s/.test(t);
    if (para && !bullet && para.xe > 470 && Math.abs(para.x - l.x) < 30) {
      para.text += ` ${t.trim()}`;
      para.xe = l.xe;
    } else {
      flush();
      para = { text: t.trim(), x: l.x, xe: l.xe };
    }
  }
  flush();
  return out.map((b) => (Array.isArray(b) ? `\`\`\`\n${b.join('\n')}\n\`\`\`` : b.text.replace(/^[•○]\s*/, '- '))).join('\n\n');
}

// ---------- mark schemes ----------
function normLabel(s) { return s.replace(/\s+/g, ''); }

function parseMS(file) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, file)));
  const entries = {};
  let cur = null;
  let started = false;
  doc.pages.forEach((page, pageIdx) => {
    for (const l of page.lines) {
      const raw = l.text.trim();
      if (/^Question \| Answer \| Marks/.test(raw)) { started = true; continue; }
      if (!started || isNoise(l)) continue;
      let text = clean(l.text);
      const m = l.x < 100 && text.match(/^(\d{1,2}(?:\s?\([a-h]\))?(?:\s?\((?:i{1,3}|iv|v|vi{0,3})\))?)(?:\s+\|\s+|\s+|$)(.*)$/);
      if (m) {
        const label = normLabel(m[1]);
        let rest = m[2];
        let marks = null;
        const mk = rest.match(/\s\|\s(\d{1,2})$/) || rest.match(/^(\d{1,2})$/) || rest.match(/\s(\d{1,2})$/);
        if (mk) { marks = Number(mk[1]); rest = rest.slice(0, mk.index).trim(); }
        cur = entries[label] || (entries[label] = { label, marks, lines: [], page: pageIdx, y: l.y, segments: [] });
        if (marks !== null && cur.marks === null) cur.marks = marks;
        if (rest) cur.lines.push({ ...l, text: rest, x: 128, xe: 0, page: pageIdx });
        cur.segments.push({ page: pageIdx, y: l.y });
        continue;
      }
      if (!cur) continue;
      const mk = text.match(/\s\|\s(\d{1,2})$/);
      if (mk && l.x > 100) { if (cur.marks === null) cur.marks = Number(mk[1]); text = text.slice(0, mk.index); }
      if (/^\d{1,2}$/.test(text.trim()) && l.x > 700) { if (cur.marks === null) cur.marks = Number(text.trim()); continue; }
      cur.lines.push({ ...l, text, page: pageIdx });
      cur.segments.push({ page: pageIdx, y: l.y });
    }
  });
  return { doc, entries, stem: file.replace('.json', ''), pageH: doc.pages[0].h };
}

const INSTRUCTION = /^(Any|One mark|1 mark|Max|Maximum|Award|Accept|Do not|Mark|Marks|Note|NOTE|Example|For example|Correct algorithm|Or$|OR$|Examiner|Answers? (?:should|must|may)|Credit|Read|If |Allow|Ignore|Look for|Mark points?)/i;

function msToCriteria(entry) {
  const criteria = [];
  const notes = [];
  const rejects = [];
  const example = [];
  let inExample = false;
  let figure = false;
  for (const l of entry.lines) {
    let t = l.text.trim();
    if (!t) continue;
    const monoBullet = l.mono && /^[•−–]\s/.test(t);
    if (l.mono && !monoBullet) {
      // Code continuation of a bulleted marking point ("should be:" on the next line).
      if (!inExample && criteria.length && l.x > 140) {
        criteria[criteria.length - 1].point += ` ${fixArrows(t, true)}`;
        continue;
      }
      inExample = true; example.push(fixArrows(l.text.replace(/^\s{0,2}/, ''), true)); continue;
    }
    if (/ \| /.test(t) || (l.x > 165 && !/^[•…]/.test(t))) {
      // Columns or labels from a drawn answer (diagram/table): shown as an image instead.
      figure = true;
      if (l.x > 165 && !/ \| /.test(t) && criteria.length && l.x < 175) { criteria[criteria.length - 1].point += ` ${t}`; }
      continue;
    }
    t = fixArrows(t, looksCode(t) || /^(•\s*)?Line \d+|should be/.test(t));
    if (/^(Example|For example|Correct algorithm|Example answer|Example program|Example algorithm)/i.test(t)) { inExample = true; if (t.replace(/^[^:]*:?/, '').trim()) example.push(t); continue; }
    if (/^(?:One|1) marks? (?:for|if)\s/i.test(t)) inExample = false;
    if (/^MP\s?\d+\b/.test(t)) { criteria.push({ point: t.replace(/^MP\s?\d+\s*[:.\-–]?\s*/, ''), wrap: l.xe > 640 }); inExample = false; continue; }
    if (inExample && /\[\d\]\s*(…)?$/.test(t)) { example.push(t); criteria.push({ point: t.replace(/\s*\[\d\]\s*(…)?$/, ''), wrap: false }); continue; }
    if (inExample && !/^[•−–]/.test(t)) { example.push(t); continue; }
    if (/^[•−–]/.test(t)) inExample = false;
    if (/^(Do not accept|Reject|Not\b|DO NOT)/i.test(t)) { rejects.push(t); continue; }
    const bullet = /^[•−–]\s*/.test(t);
    const point = t.replace(/^[•−–]\s*/, '');
    const isCont = !/^(…|\.\.\.)/.test(point) && ((l.x > 140 && criteria.length) || (!bullet && criteria.length && criteria[criteria.length - 1].wrap));
    const markFor = point.match(/^(?:One|1) marks? (?:for|if)\s+(.*)$/i);
    if (!bullet && markFor && !/^(each|every|any|a correct line|per)\b|mark point/i.test(markFor[1]) && markFor[1].length > 6) {
      criteria.push({ point: markFor[1].replace(/^(the |a )?correct /i, (m) => m).replace(/^./, (c) => c.toUpperCase()), wrap: l.xe > 640 });
      continue;
    }
    if (!bullet && INSTRUCTION.test(point) && !isCont) { notes.push(point); continue; }
    if (isCont && criteria.length) {
      const last = criteria[criteria.length - 1];
      last.point += /^(…|\.\.\.)/.test(point) ? ` ${point}` : ` ${point}`;
      last.wrap = l.xe > 640;
      continue;
    }
    criteria.push({ point, wrap: l.xe > 640 });
  }
  return {
    criteria: criteria.map((c) => ({ point: c.point.replace(/\s+/g, ' ').trim(), key_terms: [] })).filter((c) => c.point.length > 0),
    notes, rejects, example, figure,
  };
}

// ---------- topics ----------
const TOPICS = {
  1: {
    name: 'Data representation',
    subs: [
      ['logical shifts', /logical (left|right) shift|\bshift/i],
      ["two's complement", /two.s complement/i],
      ['binary addition and overflow', /\b(overflow|binary addition|add(ed)? the (two )?binary)/i],
      ['data compression', /\b(compress|lossy|lossless|run length|RLE)/i],
      ['text representation', /\b(ASCII|Unicode|character set)/i],
      ['sound representation', /\b(sound|sampl(e|ing)|audio)/i],
      ['image representation', /\b(image|pixel|colour depth)/i],
      ['data storage and file size', /\b(kibibyte|mebibyte|gibibyte|KiB|MiB|GiB|file size|nibble|bytes?)\b/i],
      ['number conversion', /\b(denary|hexadecimal|hex\b|convert|binary)/i],
    ],
  },
  2: {
    name: 'Data transmission',
    subs: [
      ['encryption', /\b(encrypt|cipher|symmetric|asymmetric|public key|private key|plain ?text)/i],
      ['error detection', /\b(parity|checksum|echo check|check digit|ARQ|automatic repeat|error detection|errors?)\b/i],
      ['USB', /\bUSB\b|universal serial bus/i],
      ['transmission methods', /\b(serial|parallel|simplex|half.duplex|full.duplex|duplex)/i],
      ['packets and packet switching', /\b(packet|payload|header|trailer)/i],
    ],
  },
  3: {
    name: 'Hardware',
    subs: [
      ['secondary storage', /\b(secondary storage|magnetic|optical|solid.state|SSD|HDD|hard disk|flash memory|virtual memory)/i],
      ['CPU and the fetch–decode–execute cycle', /\b(CPU|processor|fetch|register|MAR|MDR|ALU|control unit|accumulator|program counter|Von Neumann|(address|data|control) bus)\b/i],
      ['CPU performance', /\b(cores?|cache|clock speed)\b/i],
      ['instruction sets and embedded systems', /\b(instruction set|embedded system)/i],
      ['input devices', /\b(input device|scanner|barcode|QR code|keyboard|microphone|touch screen|mouse|camera)/i],
      ['output devices', /\b(output device|printer|projector|actuator|speaker|LCD|LED|monitor|screen)/i],
      ['sensors', /\bsensor/i],
      ['primary storage', /\b(RAM|ROM|primary storage)\b/i],
      ['cloud storage', /\bcloud/i],
      ['network hardware', /\b(NIC|network interface card|MAC address|IP address|IPv4|IPv6|router|static|dynamic)\b/i],
    ],
  },
  4: {
    name: 'Software',
    subs: [
      ['system and application software', /\b(system software|application software|utility|utilities)/i],
      ['operating systems', /\b(operating system|OS\b|memory management|multitasking|user interface)/i],
      ['interrupts', /\binterrupt/i],
      ['programming languages and translators', /\b(high.level|low.level|assembly|assembler|compiler|interpreter|machine code|translator)/i],
      ['IDE', /\b(IDE|integrated development environment)/i],
    ],
  },
  5: {
    name: 'The internet and its uses',
    subs: [
      ['internet and the world wide web', /\b(world wide web|WWW|internet)\b/i],
      ['URLs, HTTP and web browsers', /\b(URL|uniform resource locator|HTTPS?|web browser|browser|DNS|domain name|web server|HTML)\b/i],
      ['cookies', /\bcookie/i],
      ['digital currency and blockchain', /\b(digital currency|blockchain|cryptocurrency)/i],
      ['cyber security threats', /\b(brute.force|DDoS|denial of service|hacking|hacker|malware|virus|worm|trojan|spyware|adware|ransomware|phishing|pharming|social engineering|data interception)/i],
      ['cyber security solutions', /\b(firewall|proxy server|SSL|TLS|two.step|two.factor|2FA|biometric|access level|anti.malware|anti.virus|privacy settings|automating software updates)/i],
    ],
  },
  6: {
    name: 'Automated and emerging technologies',
    subs: [
      ['automated systems', /\b(automated system|automated|automation)/i],
      ['robotics', /\brobot/i],
      ['artificial intelligence', /\b(artificial intelligence|AI\b|machine learning|expert system|knowledge base|inference engine|rule base)/i],
    ],
  },
  7: {
    name: 'Algorithm design and problem-solving',
    subs: [
      ['program development life cycle', /\b(development life cycle|analysis|design stage|coding|testing stage|decomposition|abstraction|sub-?systems?|structure diagram)/i],
      ['flowcharts', /\bflowchart/i],
      ['trace tables', /\btrace table/i],
      ['validation and verification', /\b(validation|verification|range check|length check|type check|presence check|format check|check digit|double entry|visual check)/i],
      ['test data', /\b(test data|normal data|abnormal|extreme|boundary)/i],
      ['standard methods', /\b(linear search|bubble sort|totalling|counting|maximum|minimum|average)/i],
      ['finding errors in algorithms', /\b(errors? in|identify the (line numbers|errors)|corrections?)/i],
      ['algorithm purpose', /\b(purpose of|describe what|outline the processes|algorithm)\b/i],
    ],
  },
  8: {
    name: 'Programming',
    subs: [
      ['writing a full program', /\b(write (and test )?(a |the )?program|Write an algorithm|program code)\b/i],
      ['file handling', /\b(OPENFILE|READFILE|WRITEFILE|text file|store data in a file|\.txt)\b/i],
      ['arrays', /\barray/i],
      ['string handling', /\b(LENGTH|SUBSTRING|UCASE|LCASE|string handling|upper case|lower case)\b/],
      ['procedures, functions and parameters', /\b(procedure|function|parameter|local|global|library routine|MOD|DIV|ROUND|RANDOM)\b/i],
      ['selection and iteration', /\b(IF|CASE|selection|iteration|loop|FOR|WHILE|REPEAT|count-controlled|condition-controlled)\b/],
      ['maintainable programs', /\b(maintain|meaningful identifier|comments?)\b/i],
      ['variables, constants and data types', /\b(variable|constant|data types?|integer|real|char|string|boolean)\b/i],

    ],
  },
  9: { name: 'Databases', subs: [['database tables and SQL', /./]] },
  10: { name: 'Boolean logic', subs: [['logic gates, circuits and truth tables', /./]] },
};

const CHAPTER_HINTS = {
  1: /\b(denary|hexadecimal|binary|two.s complement|ASCII|Unicode|sound|sampl|image|pixel|colour depth|resolution|kibibyte|KiB|MiB|compress|lossy|lossless|overflow|shift|nibble|file size|run length)/gi,
  2: /\b(packet|serial|parallel|simplex|duplex|USB|parity|checksum|echo check|check digit|ARQ|encrypt|cipher|symmetric|asymmetric|transmi)/gi,
  3: /\b(CPU|processor|fetch|register|MAR|MDR|ALU|control unit|accumulator|program counter|Von Neumann|cores?|cache|clock speed|clock|instruction set|embedded|input device|output device|sensor|scanner|printer|RAM|ROM|secondary storage|magnetic|optical|solid.state|SSD|virtual memory|cloud|NIC|MAC address|IP address|router|actuator|touch screen|barcode|QR code|projector|keyboard|microphone)/gi,
  4: /\b(operating system|system software|application software|utility|interrupt|high.level|low.level|assembl|compiler|interpreter|machine code|translator|IDE|integrated development|firmware|bootloader)/gi,
  5: /\b(internet|world wide web|URL|HTTPS?|browser|DNS|domain name|web server|cookie|digital currency|blockchain|brute.force|DDoS|denial of service|hack|malware|virus|phishing|pharming|social engineering|firewall|proxy|SSL|biometric|two.step|cyber|spyware|ransomware)/gi,
  6: /\b(automated|automation|robot|artificial intelligence|\bAI\b|machine learning|expert system|knowledge base|inference engine|rule base)/gi,
  7: /\b(flowchart|trace table|validation|verification|test data|range check|length check|type check|presence check|format check|linear search|bubble sort|development life cycle|decomposition|structure diagram|abstraction|normal data|extreme data|abnormal|boundary data|errors? in the|algorithm)/gi,
  8: /\b(pseudocode|program|procedure|function|parameter|variable|constant|data type|integer|real|string|boolean|array|loop|iteration|selection|CASE|file|LENGTH|SUBSTRING|UCASE|LCASE|MOD|DIV|ROUND|RANDOM|local|global|library)/gi,
  9: /\b(database|SQL|field|record|primary key|SELECT|WHERE|ORDER BY|table)/gi,
  10: /\b(logic gate|logic circuit|truth table|logic expression|NAND|NOR|XOR|AND gate|OR gate|NOT gate|Boolean)/gi,
};

function classify(paperNo, text, msText, promptText = text) {
  const allowed = paperNo === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10];
  const all = `${text}\n${msText}`;
  let best = allowed[0];
  let bestScore = -1;
  for (const ch of allowed) {
    const n = (text.match(CHAPTER_HINTS[ch]) || []).length * 2 + (msText.match(CHAPTER_HINTS[ch]) || []).length;
    // Strong signals that override counting.
    const strong = (ch === 10 && /logic (gate|circuit|expression)|truth table/i.test(text)) ? 50
      : (ch === 9 && /\b(database|SQL)\b/i.test(text)) ? 50
        : (ch === 7 && /(identify|find) .{0,40}errors|suggest corrections|trace table|flowchart|validation|test data/i.test(promptText)) ? 30 : 0;
    const score = n + strong;
    if (score > bestScore) { bestScore = score; best = ch; }
  }
  if (paperNo === 2 && bestScore < 2) best = 8;
  const sub = TOPICS[best].subs.find(([, re]) => re.test(promptText)) || TOPICS[best].subs.find(([, re]) => re.test(text))
    || TOPICS[best].subs.find(([, re]) => re.test(all));
  return { chapter: best, subtopic: sub ? sub[0] : TOPICS[best].subs[0][0] };
}

function answerType(paperNo, text) {
  if (/tick \(✓\)|circle (one|two|three)|tick (one|two)/i.test(text)) return 'multiple-choice';
  if (/trace table/i.test(text)) return 'trace';
  if (/truth table/i.test(text)) return 'table';
  if (/draw|complete the (logic circuit|diagram|flowchart)|logic circuit/i.test(text)) return 'diagram';
  if (/\bSQL\b|\bquery\b/i.test(text) && paperNo === 2) return 'sql';
  if (/write (the |an |a )?(pseudocode|program|algorithm|statement|code)|pseudocode/i.test(text) && paperNo === 2) return 'pseudocode';
  if (/calculate|convert|give the (8-bit|denary|binary|hexadecimal)|show (all )?your working/i.test(text)) return 'calculation';
  if (/complete the table|\btable\b/i.test(text)) return 'table';
  return 'text';
}

const FIGURE_WORDS = /\b(diagram|flowchart|logic circuit|trace table|truth table|complete the table|table shows|shown in the table|the table below|draw|shade|circle|grid|graph|structure diagram|label|following (image|picture)|in the boxes|complete the|tick \(✓\))\b/i;

// ---------- build ----------
const files = fs.readdirSync(jsonDir).filter((f) => f.includes('_qp_') && (!process.env.ONLY || process.env.ONLY.split(',').some((o) => f.includes(o)))).sort();
const banks = { 1: { items: [], papers: {}, skipped: [] }, 2: { items: [], papers: {}, skipped: [] } };
const stats = { parts: 0, matched: 0, figures: 0 };

for (const qpFile of files) {
  const [, sess, , variant] = qpFile.replace('.json', '').split('_');
  const paperNo = Number(variant[0]);
  const year = `20${sess.slice(1)}`;
  const code = `0478/${variant} ${SESSIONS[sess[0]]} ${year}`;
  const examKey = `${sess}-${variant}`;
  const msFile = qpFile.replace('_qp_', '_ms_');
  const qp = parseQP(qpFile);
  const ms = fs.existsSync(path.join(jsonDir, msFile)) ? parseMS(msFile) : { entries: {} };
  banks[paperNo].papers[examKey] = {
    code,
    qp: `https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0478_${sess}_qp_${variant}.pdf`,
    ms: `https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0478_${sess}_ms_${variant}.pdf`,
  };

  // Segment y-ranges: a part runs from its first line to the next part's first line.
  const order = qp.parts;
  const regions = (part, idx, partsList, pageH) => {
    const next = partsList[idx + 1];
    const byPage = {};
    for (const s of part.segments) (byPage[s.page] ||= []).push(s.y);
    if (!part.segments.length) byPage[part.page] = [part.y];
    const pages = Object.keys(byPage).map(Number).sort((a, b) => a - b);
    return pages.map((p) => {
      const ys = byPage[p];
      let y0 = Math.min(...ys);
      if (p === part.page) y0 = part.y;
      let y1 = Math.max(...ys) + 8;
      if (next && next.page === p) y1 = Math.min(y1 + 30, next.y - 4);
      return { page: p, y0, y1: Math.min(y1, pageH - 60) };
    });
  };

  // When the mark scheme only marks the whole lettered part, (i)/(ii) in the paper were labels inside it:
  // fold them back into the lettered part.
  for (const lp of order.filter((o) => o.kind === 'part' && !o.roman)) {
    const kids = order.filter((o) => o.q === lp.q && o.letter === lp.letter && o.roman);
    if (!kids.length) continue;
    const parentLabel = normLabel(lp.label);
    const kidsMarked = kids.some((k) => ms.entries[normLabel(k.label)]);
    if (!kidsMarked && ms.entries[parentLabel]) {
      for (const k of kids) {
        lp.lines.push(...k.lines);
        lp.segments.push(...k.segments);
        lp.marks += k.marks;
        order.splice(order.indexOf(k), 1);
      }
    }
  }

  const stems = {};
  order.forEach((p, i) => {
    if (p.kind === 'stem') stems[p.q] = { part: p, idx: i };
  });

  const leafParts = order.filter((p, i) => {
    if (p.kind === 'stem') {
      // A question with no (a)/(b) parts is a part itself.
      const hasChildren = order.some((o) => o.q === p.q && o.kind === 'part');
      return !hasChildren;
    }
    // A lettered part with roman sub-parts only provides context.
    const hasRoman = !p.roman && order.some((o) => o.q === p.q && o.letter === p.letter && o.roman);
    return !hasRoman;
  });

  for (const part of leafParts) {
    stats.parts += 1;
    const idx = order.indexOf(part);
    const label = part.kind === 'stem' ? `${part.q}` : part.label;
    const stemPart = part.kind === 'stem' ? null : stems[part.q]?.part;
    const letterPart = part.roman ? order.find((o) => o.q === part.q && o.letter === part.letter && !o.roman && o.kind === 'part') : null;

    const contextLines = [...(stemPart?.lines || []), ...(letterPart?.lines || [])];
    // Text that belongs to a table or diagram is shown as an image instead, so leave it out of the prompt.
    const keepText = (lines, imaged = false) => {
      const hasFig = imaged || lines.some((l) => l.fig);
      let kept = lines.filter((l) => !l.fig);
      if (imaged || lines.filter(isFigureLine).length >= 2) kept = kept.filter((l) => !isFigureLine(l));
      // Lone code-font labels (column titles like "Numbers") belong to the drawn table.
      if (hasFig) kept = kept.filter((l) => !(l.mono && /^\s*[A-Za-z]+\s*$/.test(l.text) && !KEYWORDS.has(l.text.trim())));
      return kept;
    };
    let prompt = toMarkdown(keepText(part.lines)).trim();
    let context = toMarkdown(keepText(contextLines)).trim();

    const figures = [];
    const needFig = (lines, text) => lines.filter(isFigureLine).length >= 2 || FIGURE_WORDS.test(text);
    const id = `ig-${examKey}-${label.replace(/[()]/g, '')}`;
    if (stemPart && needFig(stemPart.lines, context) && stemPart.lines.filter(isFigureLine).length >= 2) {
      regions(stemPart, order.indexOf(stemPart), order, qp.pageH).forEach((r, k) => {
        const f = crop(qp.stem, r.page, r.y0, r.y1, `${examKey}-${part.q}-stem-${k}`, qp.pageH);
        if (f && !figures.includes(f)) figures.push(f);
      });
    }
    if (letterPart && letterPart.lines.filter(isFigureLine).length >= 2) {
      regions(letterPart, order.indexOf(letterPart), order, qp.pageH).forEach((r, k) => {
        const f = crop(qp.stem, r.page, r.y0, r.y1, `${examKey}-${part.q}${letterPart.letter}-ctx-${k}`, qp.pageH);
        if (f) figures.push(f);
      });
    }
    if (needFig(part.lines, prompt)) {
      regions(part, idx, order, qp.pageH).forEach((r, k) => {
        const f = crop(qp.stem, r.page, r.y0, r.y1, `${examKey}-${label.replace(/[()]/g, '')}-${k}`, qp.pageH);
        if (f) figures.push(f);
      });
    }

    // With an image attached, any table or diagram text left in the wording would only duplicate it.
    if (figures.length) {
      prompt = toMarkdown(keepText(part.lines, true)).trim();
      context = toMarkdown(keepText(contextLines, true)).trim();
    }

    const entry = ms.entries[normLabel(label)];
    if (!entry) {
      banks[paperNo].skipped.push({ code, q: label, subtopic: '', marks: part.marks, why: 'No matching mark scheme entry was found.' });
      continue;
    }
    stats.matched += 1;
    const parsed = msToCriteria(entry);
    const answerFigures = [];
    if (parsed.figure || (!parsed.criteria.length && !parsed.example.length)) {
      const byPage = {};
      for (const s of entry.segments) (byPage[s.page] ||= []).push(s.y);
      Object.keys(byPage).map(Number).sort((a, b) => a - b).forEach((p, k) => {
        const ys = byPage[p];
        const f = crop(ms.stem, p, Math.min(...ys), Math.max(...ys) + 10, `${examKey}-${label.replace(/[()]/g, '')}-ms-${k}`, ms.pageH, ms.doc.pages[p].w);
        if (f) answerFigures.push(f);
      });
    }
    let criteria = parsed.criteria;
    if (!criteria.length && parsed.example.length) criteria = [{ point: 'Answer matches the example answer in the mark scheme (see model answer).', key_terms: [] }];
    if (!criteria.length && answerFigures.length) criteria = [{ point: 'Answer matches the mark scheme answer shown in the model answer image.', key_terms: [] }];
    if (!criteria.length) {
      banks[paperNo].skipped.push({ code, q: label, subtopic: '', marks: part.marks, why: 'The mark scheme entry could not be read.' });
      continue;
    }
    const marks = part.marks || entry.marks || criteria.length;
    const fullText = `${context}\n${prompt}`;
    const { chapter, subtopic } = classify(paperNo, fullText, criteria.map((c) => c.point).join(' '), prompt);
    const finalAnswer = parsed.example.length
      ? (parsed.example.some((e) => looksCode(e)) ? `\`\`\`\n${parsed.example.join('\n')}\n\`\`\`` : parsed.example.join('\n'))
      : criteria.slice(0, Math.max(marks, 1)).map((c) => c.point).join('; ');
    const item = {
      id,
      session: sess,
      variant,
      paper_code: code,
      q: label,
      marks,
      chapter,
      subtopic,
      prompt: prompt || '(See the figure.)',
      context_note: context,
      answer_type: answerType(paperNo, fullText),
      criteria,
      max_note: parsed.notes.join(' '),
      rejects: parsed.rejects,
      final_answer: finalAnswer,
      confidence: figures.length || answerFigures.length ? 'medium' : 'high',
      figures,
      answer_figures: answerFigures,
    };
    banks[paperNo].items.push(item);
  }
}

for (const [no, bank] of Object.entries(banks)) {
  bank.chapters = Object.fromEntries(Object.entries(TOPICS).filter(([k]) => (no === '1' ? Number(k) <= 6 : Number(k) >= 7)).map(([k, v]) => [k, v.name]));
  fs.mkdirSync(path.join(repo, 'data'), { recursive: true });
  fs.writeFileSync(path.join(repo, `data/igcse-paper${no}.json`), JSON.stringify(bank));
}
stats.figures = figCount;
console.log(JSON.stringify({ ...stats, p1: banks[1].items.length, p2: banks[2].items.length, skipped1: banks[1].skipped.length, skipped2: banks[2].skipped.length }));
