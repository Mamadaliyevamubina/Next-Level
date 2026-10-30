// Builds igcse.html, the static IGCSE 0478 practice page, from data/igcse-paper1.json and data/igcse-paper2.json.
// Run from the project root: node tools/build-igcse-page.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const banks = [1, 2].map((n) => JSON.parse(fs.readFileSync(path.join(root, `data/igcse-paper${n}.json`), 'utf8')));
// "</" inside JSON would end the <script> tag early.
const json = JSON.stringify({ p1: banks[0], p2: banks[1] }).replace(/<\//g, '<\\/');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>IGCSE Computer Science 0478 Practice · Next Level</title>
<link rel="icon" type="image/svg+xml" href="public/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--accent:#8e00d5;--ink:#1e002b;--ink2:#6f667c;--bg:#f6f0fd;--surface:#fff;--surface2:#f7f2fc;--line:#e6dcf2;
  --soft:#f1e3fb;--ok:#15803d;--ok-soft:#dcf5e5;--warn:#b45309;--warn-soft:#fdf0dc;--bad:#be123c;--bad-soft:#fde4ea;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--accent:#c77dff;--ink:#f3ecfa;--ink2:#b4a8c4;--bg:#12051c;--surface:#26103a;--surface2:#2e1645;
  --line:#3d2656;--soft:#3a1a55;--ok:#4ade80;--ok-soft:#163323;--warn:#fbbf24;--warn-soft:#3a2b10;--bad:#fb7185;--bad-soft:#3d1520;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;font:16px/1.6 Inter,system-ui,sans-serif;color:var(--ink);
  background:radial-gradient(900px 500px at 8% -10%,color-mix(in srgb,var(--accent) 13%,transparent),transparent 70%),var(--bg);background-attachment:fixed}
a{color:var(--accent)}button,textarea,select,input{font:inherit;color:inherit}
code,pre,textarea.code{font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;font-size:.88em;font-variant-ligatures:none}
.app{max-width:1200px;margin:0 auto;padding:14px 18px 50px}
.top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:22px;
  background:var(--surface);border:1px solid var(--line);box-shadow:0 12px 34px rgba(98,54,151,.09);position:sticky;top:12px;z-index:5}
.brand{display:flex;gap:10px;align-items:center;font-weight:800;text-decoration:none;color:var(--ink)}
.brand small{display:block;font-weight:500;color:var(--ink2);font-size:.75rem}
.tabs{display:flex;gap:4px;flex-wrap:wrap}
.tabs a,.tabs button{border:0;background:none;padding:7px 14px;border-radius:999px;font-weight:600;color:var(--ink);text-decoration:none;cursor:pointer}
.tabs .on{background:var(--accent);color:#fff}
.layout{display:grid;grid-template-columns:290px 1fr;gap:18px;margin-top:18px;align-items:start}
@media (max-width:860px){.layout{grid-template-columns:1fr}}
.card{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:18px 20px;box-shadow:0 12px 34px rgba(98,54,151,.07)}
.rail{display:grid;gap:4px;position:sticky;top:96px;max-height:calc(100vh - 110px);overflow:auto}
.ch{display:grid;gap:4px;text-align:left;border:1px solid transparent;background:none;border-radius:14px;padding:9px 10px;cursor:pointer}
.ch:hover{background:var(--soft)}.ch.on{background:var(--soft);border-color:var(--accent)}
.ch b{font-weight:600;font-size:.93rem}.ch span{font-size:.8rem;color:var(--ink2)}
.bar{height:7px;border-radius:9px;background:var(--soft);overflow:hidden}.bar i{display:block;height:100%;background:var(--accent)}
.tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.tools select{border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:8px 10px}
.btn{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:7px 16px;font-weight:600;cursor:pointer}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 8px 20px color-mix(in srgb,var(--accent) 30%,transparent)}
.btn:disabled{opacity:.5;cursor:default}
.meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:10px}
.pill{font-size:.78rem;font-weight:600;padding:2px 10px;border-radius:999px;background:var(--soft);color:var(--accent)}
.pill.marks{background:var(--accent);color:#fff}.muted{color:var(--ink2)}.small{font-size:.86rem}
.ctx{background:var(--surface2);border-radius:14px;padding:10px 14px;margin-bottom:10px}
.md p{margin:.4em 0}.md pre{background:var(--surface2);border:1px solid var(--line);border-radius:12px;padding:10px 12px;overflow-x:auto}
.md ul{margin:.4em 0;padding-left:20px}
.figs{display:grid;gap:10px;margin:12px 0}.figs img{width:100%;max-width:760px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:6px}
textarea{width:100%;min-height:150px;border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:12px 14px;margin-top:12px}
textarea.code{font-family:"JetBrains Mono",monospace;font-size:.9rem;min-height:240px}
.scheme{margin-top:14px;display:grid;gap:8px}
.crit{display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border:1px solid var(--line);border-radius:12px;cursor:pointer;background:var(--surface)}
.crit.on{background:var(--ok-soft);border-color:var(--ok)}.crit input{margin-top:5px;accent-color:var(--ok)}
.note{background:var(--warn-soft);border-radius:12px;padding:8px 12px;font-size:.9rem}
.score{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px}.score b{font-size:1.2rem;min-width:4ch;text-align:center}
.nav{display:flex;justify-content:space-between;gap:8px;margin-top:14px;flex-wrap:wrap}
.dots{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 14px}
.dot{width:30px;height:30px;border-radius:9px;border:1px solid var(--line);background:var(--surface);font-size:.75rem;cursor:pointer}
.dot.cur{outline:2px solid var(--accent)}.dot.full{background:var(--ok-soft);border-color:var(--ok)}.dot.part{background:var(--warn-soft);border-color:var(--warn)}
details summary{cursor:pointer;font-weight:600}
</style>
</head>
<body>
<div class="app">
  <header class="top">
    <a class="brand" href="index.html"><svg width="30" height="34" viewBox="0 0 1181 1320" aria-hidden="true"><path fill="#623697" d="M444.654 1319.03C307.499 1319 136.818 1316.25 0 1316.25V0C137.501 0 409.134 0.103362 546.635 0.103362C982.062 0.103362 1180.89 293.362 1180.89 658.125C1180.89 900.866 1048.58 1113.22 831.735 1228.12V454.146L444.654 298.523V1319.03Z"/><path fill="#260844" d="M444.654 298.523L444.657 1319.03L0 1316.23L444.654 298.523Z"/></svg>
      <span>Next Level<small>IGCSE Computer Science 0478</small></span></a>
    <nav class="tabs" id="tabs"></nav>
  </header>
  <div class="layout">
    <aside class="card rail" id="rail"></aside>
    <main>
      <div class="tools card">
        <select id="sub" aria-label="Subtopic"></select>
        <select id="exam" aria-label="Exam sitting"></select>
        <select id="status" aria-label="Status">
          <option value="">All questions</option><option value="new">Not tried</option>
          <option value="review">Lost marks</option><option value="done">Full marks</option>
        </select>
        <span class="muted small" id="count"></span>
      </div>
      <div class="card" id="q"></div>
    </main>
  </div>
  <p class="muted small" style="text-align:center;margin-top:24px">Questions and mark schemes from Cambridge IGCSE Computer Science (0478) past papers, 2023–2026. Progress is saved in this browser.</p>
</div>
<script id="bank" type="application/json">${json}</script>
<script>
(function () {
  "use strict";
  var DATA = JSON.parse(document.getElementById("bank").textContent);
  var KEY = "igcse0478-v1";
  var store = JSON.parse(localStorage.getItem(KEY) || "{}");
  store.attempts = store.attempts || {};
  store.drafts = store.drafts || {};
  var state = { paper: "p1", chapter: "", sub: "", exam: "", status: "", idx: 0, phase: "answer", ticked: [], awarded: 0 };
  var h = location.hash.replace("#", "");
  if (h === "p2") state.paper = "p2";

  function save() { localStorage.setItem(KEY, JSON.stringify(store)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function inline(s) { return esc(s).replace(/\`([^\`]+)\`/g, "<code>$1</code>").replace(/\\*\\*([^*]+)\\*\\*/g, "<b>$1</b>"); }
  // Small markdown renderer: code fences, bullet lists and paragraphs.
  function md(text) {
    if (!text) return "";
    var out = [], parts = String(text).split(/\`\`\`\\n?/);
    parts.forEach(function (chunk, i) {
      if (i % 2) { out.push("<pre><code>" + esc(chunk.replace(/\\n$/, "")) + "</code></pre>"); return; }
      chunk.split(/\\n{2,}/).forEach(function (block) {
        block = block.trim(); if (!block) return;
        var lines = block.split("\\n");
        if (lines.every(function (l) { return /^- /.test(l); })) {
          out.push("<ul>" + lines.map(function (l) { return "<li>" + inline(l.slice(2)) + "</li>"; }).join("") + "</ul>");
        } else out.push("<p>" + lines.map(inline).join("<br>") + "</p>");
      });
    });
    return out.join("");
  }
  function bank() { return DATA[state.paper]; }
  function last(id) { var a = store.attempts[id]; return a && a.length ? a[a.length - 1] : null; }
  function list() {
    return bank().items.filter(function (it) {
      if (state.chapter && String(it.chapter) !== state.chapter) return false;
      if (state.sub && it.subtopic !== state.sub) return false;
      if (state.exam && (it.session + "-" + it.variant) !== state.exam) return false;
      var l = last(it.id);
      if (state.status === "new" && l) return false;
      if (state.status === "review" && !(l && l.awarded < it.marks)) return false;
      if (state.status === "done" && !(l && l.awarded >= it.marks)) return false;
      return true;
    }).sort(function (a, b) { return a.chapter - b.chapter || a.subtopic.localeCompare(b.subtopic) || a.id.localeCompare(b.id); });
  }
  function progress(items) {
    var e = 0, m = 0, n = 0;
    items.forEach(function (it) { var l = last(it.id); if (l) { e += l.awarded; m += it.marks; n++; } });
    return { e: e, m: m, n: n };
  }
  function renderTabs() {
    document.getElementById("tabs").innerHTML =
      '<a href="index.html">Home</a>' +
      ["p1", "p2"].map(function (p) {
        return '<button type="button" data-p="' + p + '" class="' + (state.paper === p ? "on" : "") + '">IGCSE Paper ' + p.slice(1) + "</button>";
      }).join("");
  }
  function renderRail() {
    var b = bank(), all = progress(b.items);
    var html = "<h3 style='margin:0 0 4px'>" + (state.paper === "p1" ? "Paper 1 · Computer Systems" : "Paper 2 · Algorithms, Programming and Logic") + "</h3>";
    function row(key, label, items) {
      var p = progress(items), pct = p.m ? Math.round(p.e / p.m * 100) : 0;
      return '<button type="button" class="ch ' + (state.chapter === key ? "on" : "") + '" data-ch="' + key + '"><b>' + esc(label) + "</b>" +
        '<div class="bar"><i style="width:' + pct + '%"></i></div><span>' + p.n + " / " + items.length + " answered" + (p.m ? " · " + pct + "%" : "") + "</span></button>";
    }
    html += row("", "All topics", b.items);
    Object.keys(b.chapters).forEach(function (ch) {
      html += row(ch, ch + ". " + b.chapters[ch], b.items.filter(function (it) { return String(it.chapter) === ch; }));
    });
    document.getElementById("rail").innerHTML = html;
  }
  function renderFilters() {
    var b = bank();
    var subs = {}; b.items.forEach(function (it) { if (!state.chapter || String(it.chapter) === state.chapter) subs[it.subtopic] = 1; });
    document.getElementById("sub").innerHTML = '<option value="">All subtopics</option>' +
      Object.keys(subs).sort().map(function (s) { return '<option ' + (s === state.sub ? "selected" : "") + ">" + esc(s) + "</option>"; }).join("");
    document.getElementById("exam").innerHTML = '<option value="">All exam sittings</option>' +
      Object.keys(b.papers).map(function (k) { return '<option value="' + k + '" ' + (k === state.exam ? "selected" : "") + ">" + esc(b.papers[k].code) + "</option>"; }).join("");
    document.getElementById("status").value = state.status;
  }
  function renderQuestion() {
    var items = list(), box = document.getElementById("q");
    document.getElementById("count").textContent = items.length + " questions";
    if (!items.length) { box.innerHTML = "<p class='muted'>No questions match these filters.</p>"; return; }
    if (state.idx >= items.length) state.idx = 0;
    var it = items[state.idx], l = last(it.id), code = /pseudocode|sql|trace/.test(it.answer_type);
    var dots = items.length <= 80 ? '<div class="dots">' + items.map(function (x, i) {
      var lx = last(x.id), cls = lx ? (lx.awarded >= x.marks ? "full" : "part") : "";
      return '<button type="button" class="dot ' + cls + (i === state.idx ? " cur" : "") + '" data-i="' + i + '">' + (i + 1) + "</button>";
    }).join("") + "</div>" : "<p class='muted small'>Question " + (state.idx + 1) + " of " + items.length + "</p>";
    var html = dots + '<div class="meta"><span class="pill marks">' + it.marks + " mark" + (it.marks === 1 ? "" : "s") + "</span>" +
      '<span class="pill">' + esc(bank().chapters[it.chapter]) + '</span><span class="pill">' + esc(it.subtopic) + "</span>" +
      '<span class="muted small">' + esc(it.paper_code) + " · Q" + esc(it.q) + "</span>" +
      (l ? ' <span class="pill" style="background:' + (l.awarded >= it.marks ? "var(--ok-soft);color:var(--ok)" : "var(--warn-soft);color:var(--warn)") + '">last: ' + l.awarded + "/" + it.marks + "</span>" : "") + "</div>";
    if (it.context_note) html += '<div class="ctx md">' + md(it.context_note) + "</div>";
    html += '<div class="md">' + md(it.prompt) + "</div>";
    if (it.figures && it.figures.length) html += '<div class="figs">' + it.figures.map(function (f) { return '<img loading="lazy" alt="Figure" src="public/' + f + '">'; }).join("") + "</div>";
    html += '<textarea id="ans" class="' + (code ? "code" : "") + '" placeholder="Write your answer here" ' + (state.phase !== "answer" ? "readonly" : "") + ">" + esc(store.drafts[it.id] || "") + "</textarea>";
    if (state.phase === "answer") {
      html += '<div class="nav"><button type="button" class="btn primary" id="mark">Mark my answer</button></div>';
    } else {
      html += '<div class="scheme"><h3 style="margin:6px 0 0">Mark scheme</h3>' + (it.max_note ? '<div class="muted small">' + esc(it.max_note) + "</div>" : "");
      html += it.criteria.map(function (c, i) {
        var on = state.ticked.indexOf(i) >= 0;
        return '<label class="crit ' + (on ? "on" : "") + '"><input type="checkbox" data-t="' + i + '" ' + (on ? "checked" : "") + (state.phase === "saved" ? " disabled" : "") + "><span>" + inline(c.point) + "</span></label>";
      }).join("");
      if (it.rejects && it.rejects.length) html += '<div class="note"><b>Examiner notes:</b> ' + it.rejects.map(esc).join(" · ") + "</div>";
      var fig = it.answer_figures && it.answer_figures.length;
      if (it.final_answer || fig) {
        html += "<details " + (fig ? "open" : "") + "><summary>Model answer</summary>";
        if (fig) html += '<div class="figs">' + it.answer_figures.map(function (f) { return '<img loading="lazy" alt="Mark scheme answer" src="public/' + f + '">'; }).join("") + "</div>";
        if (!/^Answer matches the mark scheme answer shown/.test(it.final_answer)) html += '<div class="md">' + md(it.final_answer) + "</div>";
        html += "</details>";
      }
      html += '<div class="score"><span>Your mark</span><button type="button" class="btn" id="minus">−</button><b>' + state.awarded + " / " + it.marks + '</b><button type="button" class="btn" id="plus">+</button>' +
        (state.phase === "marking" ? '<button type="button" class="btn primary" id="save">Save mark</button>' : '<span style="color:var(--ok);font-weight:700">Saved.</span> <button type="button" class="btn" id="again">Try again</button>') + "</div></div>";
    }
    html += '<div class="nav"><button type="button" class="btn" id="prev" ' + (state.idx ? "" : "disabled") + '>← Previous</button>' +
      '<button type="button" class="btn" id="skip">Next not tried</button>' +
      '<button type="button" class="btn" id="next" ' + (state.idx < items.length - 1 ? "" : "disabled") + ">Next →</button></div>";
    box.innerHTML = html;
    var ans = document.getElementById("ans");
    ans.addEventListener("input", function () { store.drafts[it.id] = ans.value; save(); });
    function on(id, fn) { var el = document.getElementById(id); if (el) el.addEventListener("click", fn); }
    on("mark", function () { state.phase = "marking"; state.ticked = []; state.awarded = 0; renderQuestion(); });
    on("minus", function () { if (state.phase === "marking") { state.awarded = Math.max(0, state.awarded - 1); renderQuestion(); } });
    on("plus", function () { if (state.phase === "marking") { state.awarded = Math.min(it.marks, state.awarded + 1); renderQuestion(); } });
    on("save", function () {
      (store.attempts[it.id] = store.attempts[it.id] || []).push({ awarded: state.awarded, ts: Date.now(), answer: ans.value });
      delete store.drafts[it.id]; save(); state.phase = "saved"; renderRail(); renderQuestion();
    });
    on("again", function () { state.phase = "answer"; renderQuestion(); });
    on("prev", function () { go(state.idx - 1); });
    on("next", function () { go(state.idx + 1); });
    on("skip", function () {
      var all = list();
      for (var k = 1; k <= all.length; k++) { var j = (state.idx + k) % all.length; if (!last(all[j].id)) return go(j); }
    });
    box.querySelectorAll("[data-t]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var i = Number(cb.dataset.t);
        state.ticked = cb.checked ? state.ticked.concat(i) : state.ticked.filter(function (x) { return x !== i; });
        state.awarded = Math.min(state.ticked.length, it.marks); renderQuestion();
      });
    });
    box.querySelectorAll("[data-i]").forEach(function (d) { d.addEventListener("click", function () { go(Number(d.dataset.i)); }); });
  }
  function go(i) { state.idx = i; state.phase = "answer"; renderQuestion(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function renderAll() { renderTabs(); renderRail(); renderFilters(); renderQuestion(); }

  document.getElementById("tabs").addEventListener("click", function (e) {
    var p = e.target.dataset && e.target.dataset.p; if (!p) return;
    state = { paper: p, chapter: "", sub: "", exam: "", status: "", idx: 0, phase: "answer", ticked: [], awarded: 0 };
    location.hash = p; renderAll();
  });
  document.getElementById("rail").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ch]"); if (!b) return;
    state.chapter = b.dataset.ch; state.sub = ""; state.idx = 0; state.phase = "answer"; renderAll();
  });
  ["sub", "exam", "status"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", function (e) { state[id] = e.target.value; state.idx = 0; state.phase = "answer"; renderAll(); });
  });
  renderAll();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'igcse.html'), html);
console.log(`igcse.html written: ${banks[0].items.length} + ${banks[1].items.length} question parts`);
