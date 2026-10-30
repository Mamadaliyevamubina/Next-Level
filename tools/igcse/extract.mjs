// PDF → JSON lines with position, right edge, and a monospace flag.
// In the monospace (pseudocode) font, the assignment arrow is drawn as a vector shape and leaves a
// gap of ~3.76 character widths; gaps like that are turned back into "←".
import fs from 'node:fs';
import path from 'node:path';
import { getDocument, Util } from 'pdfjs-dist/legacy/build/pdf.mjs';

const [src, out] = process.argv.slice(2);
const monoRatio = (it) => it.width / (it.str.length * it.height);

for (const f of fs.readdirSync(src).filter((n) => n.endsWith('.pdf')).sort()) {
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(path.join(src, f))), verbosity: 0 }).promise;
  // Find which fonts are monospace: every item in that font has width/(chars*height) ≈ 0.6.
  const fontRatios = {};
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    pages.push({ page, tc, vp: page.getViewport({ scale: 1 }) });
    for (const it of tc.items) {
      if (it.str.trim().length < 2 || !it.height) continue;
      (fontRatios[it.fontName] ||= []).push(monoRatio(it));
    }
  }
  const monoFonts = new Set(Object.entries(fontRatios).filter(([, r]) => {
    const inRange = r.filter((v) => Math.abs(v - 0.6) < 0.025).length;
    return r.length >= 3 && inRange / r.length > 0.9;
  }).map(([k]) => k));

  const result = { file: f, pages: [] };
  for (const { tc, vp } of pages) {
    const rows = [];
    for (const it of tc.items) {
      if (!it.str.trim()) continue;
      const m = Util.transform(vp.transform, it.transform);
      const scale = Math.hypot(m[0], m[1]) / (Math.hypot(it.transform[0], it.transform[1]) || 1);
      const x = Math.min(m[4], m[4] + 0), y = m[5];
      const w = it.width * scale;
      let row = rows.find((r) => Math.abs(r.y - y) < 2.5);
      if (!row) rows.push((row = { y, items: [] }));
      row.items.push({ x, w, s: it.str, mono: monoFonts.has(it.fontName), h: it.height * scale, bold: /Bold/i.test(it.fontName) });
    }
    rows.sort((a, b) => a.y - b.y);
    const lines = rows.map((r) => {
      r.items.sort((a, b) => a.x - b.x);
      let text = '';
      let end = null;
      let prev = null;
      for (const it of r.items) {
        if (end !== null) {
          const gap = it.x - end;
          if (it.mono && prev.mono) {
            const cw = it.w / it.s.length || 6.6;
            const n = gap / cw;
            const frac = n - Math.floor(n);
            if (n >= 2 && frac > 0.5 && frac < 0.97) {
              text += ' ← ' + ' '.repeat(Math.max(0, Math.round(n - 3.76)));
            } else {
              text += ' '.repeat(Math.max(1, Math.round(n)));
            }
          } else {
            text += gap > 25 ? ' | ' : gap > 1.5 ? ' ' : '';
          }
        }
        text += it.s;
        end = it.x + it.w;
        prev = it;
      }
      const monoChars = r.items.filter((i) => i.mono).reduce((t, i) => t + i.s.length, 0);
      const allChars = r.items.reduce((t, i) => t + i.s.length, 0);
      return {
        x: Math.round(r.items[0].x * 10) / 10,
        y: Math.round(r.y * 10) / 10,
        xe: Math.round(end * 10) / 10,
        h: Math.round(r.items[0].h * 10) / 10,
        mono: monoChars / allChars > 0.6,
        text,
      };
    });
    result.pages.push({ w: vp.width, h: vp.height, lines });
  }
  fs.writeFileSync(path.join(out, f.replace('.pdf', '.json')), JSON.stringify(result));
}
console.log('done');
