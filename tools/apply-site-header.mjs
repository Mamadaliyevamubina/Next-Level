// Puts the shared Dombit-style header and footer into every static page (index, igcse, paper1-4).
// Safe to run again: it replaces whatever sits between the <!-- nl:... --> markers.
// Run from the project root: node tools/apply-site-header.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MARK = '<svg width="22" height="25" viewBox="0 0 1181 1320" aria-hidden="true"><path fill="#623697" d="M444.654 1319.03C307.499 1319 136.818 1316.25 0 1316.25V0C137.501 0 409.134 0.103362 546.635 0.103362C982.062 0.103362 1180.89 293.362 1180.89 658.125C1180.89 900.866 1048.58 1113.22 831.735 1228.12V454.146L444.654 298.523V1319.03Z"/><path fill="#260844" d="M444.654 298.523L444.657 1319.03L0 1316.23L444.654 298.523Z"/></svg>';
const CHEVRON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const MENU = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
const USER = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>';

const IGCSE = [
  ['igcse.html#p1', 'IGCSE Paper 1', 'Computer Systems'],
  ['igcse.html#p2', 'IGCSE Paper 2', 'Algorithms, Programming and Logic'],
];
const ALEVEL = [
  ['paper1.html', 'Paper 1', 'Theory Fundamentals'],
  ['paper2.html', 'Paper 2', 'Problem-solving and Programming'],
  ['paper3.html', 'Paper 3', 'Advanced Theory'],
  ['paper4.html', 'Paper 4', 'Practical (Python)'],
];

function header(page) {
  const here = (href) => (href.split('#')[0] === page ? ' aria-current="page"' : '');
  const drop = (label, items) => {
    const active = items.some(([href]) => href.split('#')[0] === page);
    return `<div class="nl-drop${active ? ' nl-here' : ''}"><button type="button" aria-haspopup="true" aria-expanded="false">${label} ${CHEVRON}</button>`
      + `<div class="nl-menu">${items.map(([href, t, s]) => `<a href="${href}"${here(href)}><b>${t}</b><span>${s}</span></a>`).join('')}</div></div>`;
  };
  return `<header class="nl-header">
  <div class="nl-bar">
    <a class="nl-brand" href="index.html"><span class="nl-mark">${MARK}</span><span><b>Next Level</b><small>Dombit International School</small></span></a>
    <nav class="nl-nav" aria-label="Main">
      <a href="index.html"${page === 'index.html' ? ' aria-current="page"' : ''}>Home</a>
      ${drop('IGCSE', IGCSE)}
      ${drop('A Level', ALEVEL)}
      <a href="https://school.dombit.uz" target="_blank" rel="noopener">School website</a>
    </nav>
    <div class="nl-actions">
      <button type="button" class="nl-icon" data-nl-theme aria-label="Switch theme"></button>
      <a class="nl-login" data-nl-app href="http://localhost:5173/">${USER}<span>Log in</span></a>
      <button type="button" class="nl-icon nl-burger" data-nl-burger aria-label="Menu" aria-expanded="false">${MENU}</button>
    </div>
  </div>
</header>`;
}

const FOOTER = `<footer class="nl-footer">
  <div class="nl-footer-in">
    <div>
      <a class="nl-brand" href="index.html"><span class="nl-mark">${MARK}</span><span><b>Next Level</b><small>Dombit International School</small></span></a>
      <p>Cambridge IGCSE (0478) and AS &amp; A Level (9618) Computer Science past-paper practice, checked against the mark scheme point by point.</p>
    </div>
    <div>
      <h4>Practice</h4>
      <ul>
        ${IGCSE.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}
        ${ALEVEL.map(([h, t]) => `<li><a href="${h}">A Level ${t}</a></li>`).join('')}
      </ul>
    </div>
    <div>
      <h4>Dombit International School</h4>
      <ul>
        <li>81, To‘raqo‘rg‘on street, Namangan, Uzbekistan</li>
        <li><a href="tel:+998953305509">+998 95 330 55 09</a></li>
        <li><a href="https://school.dombit.uz" target="_blank" rel="noopener">school.dombit.uz</a></li>
        <li><a href="https://t.me/dombit_xalqaro_maktabi" target="_blank" rel="noopener">Telegram</a> · <a href="https://www.instagram.com/dombit_international_school/" target="_blank" rel="noopener">Instagram</a> · <a href="https://www.youtube.com/@dombit_nextlevel" target="_blank" rel="noopener">YouTube</a></li>
      </ul>
    </div>
  </div>
  <div class="nl-copy">Past-paper questions and mark schemes © Cambridge University Press &amp; Assessment, used for practice.</div>
</footer>`;

const HEAD = '<link rel="icon" type="image/svg+xml" href="public/favicon.svg">\n<link rel="stylesheet" href="public/site.css">\n<script src="public/site.js"></script>';

function between(html, name, content, insertAt) {
  const open = `<!-- nl:${name} -->`;
  const close = `<!-- /nl:${name} -->`;
  const block = `${open}\n${content}\n${close}`;
  const a = html.indexOf(open);
  if (a >= 0) return html.slice(0, a) + block + html.slice(html.indexOf(close, a) + close.length);
  return insertAt(html, block);
}

const pages = ['index.html', 'igcse.html', 'paper1.html', 'paper2.html', 'paper3.html', 'paper4.html'];
for (const page of pages) {
  const file = path.join(root, page);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  // The header replaces the old "Home / Paper 1 ..." pill switcher on the 9618 pages.
  html = html.replace(/<nav class="psw" aria-label="Choose a paper">[\s\S]*?<\/nav>\s*/, '');
  html = html.replace(/<link rel="icon"[^>]*>\n?/g, '');
  html = between(html, 'head', HEAD, (h, b) => h.replace('</head>', `${b}\n</head>`));
  html = between(html, 'header', header(page), (h, b) => h.replace(/<body([^>]*)>/, `<body$1>\n${b}`));
  html = between(html, 'footer', FOOTER, (h, b) => h.replace(/<\/body>(?![\s\S]*<\/body>)/, `${b}\n</body>`));
  fs.writeFileSync(file, html);
  console.log(`updated ${page}`);
}
