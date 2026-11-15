// IGCSE Chemistry 0620 PDF → JSON lines, like extract.mjs but for chemistry:
// - subscripts and superscripts (NO₂, H⁺, 10⁻³) are joined into their line instead of becoming separate rows,
// - every line keeps its table cells with x positions, so the mark scheme's Answer / Marks / Guidance
//   columns can be told apart.
// Usage: node extract-chem.mjs <pdf dir> <json out dir>
import fs from 'node:fs';
import path from 'node:path';
import { getDocument, Util } from 'pdfjs-dist/legacy/build/pdf.mjs';

const [src, out] = process.argv.slice(2);
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', '-': '₋', '−': '₋', '–': '₋', '(': '₍', ')': '₎', n: 'ₙ', x: 'ₓ' };
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻', '–': '⁻', '': '⁻', '': '⁺', n: 'ⁿ' };
const script = (s, map) => ([...s].every((c) => map[c] || c === ' ') ? [...s].map((c) => map[c] || '').join('') : null);

for (const f of fs.readdirSync(src).filter((n) => n.endsWith('.pdf')).sort()) {
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(path.join(src, f))), verbosity: 0 }).promise;
  const result = { file: f, pages: [] };
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = [];
    for (const it of tc.items) {
      if (!it.str.trim()) continue;
      const m = Util.transform(vp.transform, it.transform);
      const scale = Math.hypot(m[0], m[1]) / (Math.hypot(it.transform[0], it.transform[1]) || 1);
      items.push({ x: m[4], y: m[5], w: it.width * scale, h: it.height * scale, s: it.str });
    }
    // Body text height on this page (most common height).
    const hs = {};
    for (const it of items) hs[Math.round(it.h)] = (hs[Math.round(it.h)] || 0) + it.s.length;
    const body = Number(Object.entries(hs).sort((a, b) => b[1] - a[1])[0]?.[0] || 11);
    const isSmall = (it) => it.h < body * 0.82 && it.s.trim().length <= 4 && (script(it.s.trim(), SUB) || script(it.s.trim(), SUP));

    const rows = [];
    for (const it of items.filter((x) => !isSmall(x))) {
      let row = rows.find((r) => Math.abs(r.y - it.y) < 2.5);
      if (!row) rows.push((row = { y: it.y, items: [] }));
      row.items.push(it);
    }
    // Attach each small item to the row it sits just below (subscript) or above (superscript).
    for (const it of items.filter(isSmall)) {
      let best = null;
      for (const r of rows) {
        const dy = it.y - r.y;
        if (Math.abs(dy) > body * 0.6) continue;
        const near = r.items.some((o) => it.x >= o.x - 2 && it.x <= o.x + o.w + 3);
        if (!near) continue;
        if (!best || Math.abs(dy) < Math.abs(best.dy)) best = { r, dy };
      }
      if (best && Math.abs(best.dy) > 0.8) {
        const t = it.s.trim();
        best.r.items.push({ ...it, s: script(t, best.dy > 0 ? SUB : SUP) || t, glued: true });
      } else {
        let row = rows.find((r) => Math.abs(r.y - it.y) < 2.5);
        if (!row) rows.push((row = { y: it.y, items: [] }));
        row.items.push(it);
      }
    }
    rows.sort((a, b) => a.y - b.y);
    const lines = rows.map((r) => {
      r.items.sort((a, b) => a.x - b.x);
      const cells = [];
      let cell = null;
      let end = null;
      for (const it of r.items) {
        const gap = end === null ? 0 : it.x - end;
        if (!cell || (gap > 25 && !it.glued)) {
          cell = { x: Math.round(it.x * 10) / 10, xe: 0, text: '' };
          cells.push(cell);
        } else if (!it.glued && gap > 1.5) {
          cell.text += ' ';
        }
        cell.text += it.s;
        end = Math.max(end ?? 0, it.x + it.w);
        cell.xe = Math.round(end * 10) / 10;
      }
      cells.forEach((c) => { c.text = c.text.replace(/\s+/g, ' ').trim(); });
      return {
        x: cells[0].x,
        y: Math.round(r.y * 10) / 10,
        xe: Math.round(end * 10) / 10,
        h: Math.round(Math.max(...r.items.map((it) => it.h)) * 10) / 10,
        mono: false,
        text: cells.map((c) => c.text).join(' | '),
        cells,
      };
    });
    result.pages.push({ w: vp.width, h: vp.height, lines });
  }
  fs.writeFileSync(path.join(out, f.replace('.pdf', '.json')), JSON.stringify(result));
}
console.log('done');
