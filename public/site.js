// Shared behaviour for the static pages' header: dark mode, mobile menu and the login link.
// Loaded in <head> so the saved theme is applied before the page paints.
(function () {
  "use strict";
  // Address of the React app (student login). Change this when the app is hosted somewhere else.
  var APP_URL = "http://localhost:5173/login";
  var KEY = "nl-static-theme";

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved);

  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  var SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>';
  var MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';

  document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector(".nl-header");
    if (!header) return;

    var toggle = header.querySelector("[data-nl-theme]");
    function paint() {
      toggle.innerHTML = isDark() ? SUN : MOON;
      toggle.setAttribute("aria-label", isDark() ? "Switch to light mode" : "Switch to dark mode");
      toggle.title = toggle.getAttribute("aria-label");
    }
    if (toggle) {
      paint();
      toggle.addEventListener("click", function () {
        var next = isDark() ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem(KEY, next); } catch (e) { /* storage blocked */ }
        paint();
      });
    }

    document.querySelectorAll("[data-nl-app]").forEach(function (a) { a.href = APP_URL; });

    var burger = header.querySelector("[data-nl-burger]");
    if (burger) {
      burger.addEventListener("click", function () {
        var open = header.classList.toggle("nl-nav-open");
        burger.setAttribute("aria-expanded", String(open));
      });
    }
    // Dropdowns open on hover and keyboard focus (CSS); this adds tap support on touch screens.
    header.querySelectorAll(".nl-drop > button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var drop = btn.parentElement;
        var open = !drop.classList.contains("nl-open");
        header.querySelectorAll(".nl-drop").forEach(function (d) { d.classList.remove("nl-open"); });
        if (open) drop.classList.add("nl-open");
        btn.setAttribute("aria-expanded", String(open));
      });
    });
    document.addEventListener("click", function (e) {
      if (!header.contains(e.target)) header.querySelectorAll(".nl-drop").forEach(function (d) { d.classList.remove("nl-open"); });
    });

    buildSidebar(header);
  });

  // Left sidebar on wide screens, built from the header's links so the two never disagree.
  // Each header dropdown (IGCSE, A Level) becomes a section, split by subject using the page the link points to.
  var SUBJECTS = {
    "igcse.html": "Computer Science 0478",
    "chemistry.html": "Chemistry 0620",
    "paper1.html": "Computer Science 9618", "paper2.html": "Computer Science 9618",
    "paper3.html": "Computer Science 9618", "paper4.html": "Computer Science 9618",
    "chemistry-alevel.html": "Chemistry 9701",
    "biology-alevel.html": "Biology 9700"
  };
  var HOME = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/></svg>';
  var BOOK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14ZM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>';
  var LINK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

  function fileOf(href) { return (href.split("#")[0].split("/").pop() || "index.html"); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function buildSidebar(header) {
    var nav = header.querySelector(".nl-nav");
    if (!nav || document.querySelector(".nl-side")) return;
    var html = '<a class="nl-side-brand" href="index.html">' + header.querySelector(".nl-brand").innerHTML + "</a><nav class=\"nl-side-nav\" aria-label=\"Sections\">";

    Array.prototype.forEach.call(nav.children, function (el) {
      if (el.matches("a")) {
        var ext = el.target === "_blank";
        html += '<a class="nl-side-link" href="' + esc(el.getAttribute("href")) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" +
          (ext ? LINK : HOME) + "<span>" + esc(el.textContent.trim()) + "</span></a>";
      } else if (el.classList.contains("nl-drop")) {
        html += '<span class="nl-side-title">' + esc(el.querySelector("button").textContent.trim()) + "</span>";
        var groups = [];
        el.querySelectorAll(".nl-menu a").forEach(function (a) {
          var name = SUBJECTS[fileOf(a.getAttribute("href"))] || "Papers";
          var g = groups.filter(function (x) { return x.name === name; })[0];
          if (!g) groups.push(g = { name: name, links: [] });
          g.links.push(a);
        });
        groups.forEach(function (g) {
          var line = /Chem/.test(g.name) ? "chem" : /Bio/.test(g.name) ? "bio" : "cs";
          html += '<details class="nl-side-group line-' + line + '"><summary>' + BOOK + "<span>" + esc(g.name) + "</span></summary><div>";
          g.links.forEach(function (a) {
            // "Chemistry Paper 4" → "Paper 4": the subject is already the group's name.
            var label = a.querySelector("b").textContent.replace(/^.*?(Paper \d+)$/, "$1");
            html += '<a class="nl-side-link nl-side-paper" href="' + esc(a.getAttribute("href")) + '"><b>' + esc(label) + "</b><small>" + esc(a.querySelector("span").textContent) + "</small></a>";
          });
          html += "</div></details>";
        });
      }
    });
    html += "</nav>";
    // The header bar is hidden next to the sidebar, so its two actions live at the bottom of the sidebar.
    var login = header.querySelector("[data-nl-app]");
    html += '<div class="nl-side-foot">' +
      '<button type="button" class="nl-side-link" data-nl-side-theme></button>' +
      (login ? '<a class="nl-login" href="' + esc(login.href) + '">' + login.innerHTML + "</a>" : "") +
      "</div>";

    var side = document.createElement("aside");
    side.className = "nl-side";
    side.setAttribute("aria-label", "Site navigation");
    side.innerHTML = html;
    document.body.insertBefore(side, document.body.firstChild);
    document.body.classList.add("nl-has-side");

    // Highlight the page (and paper, for pages with #p1 … #p6) being viewed, and open its subject.
    function mark() {
      var file = fileOf(location.pathname), hash = location.hash;
      var same = Array.prototype.filter.call(side.querySelectorAll("a[href]"), function (a) {
        a.removeAttribute("aria-current");
        return a.target !== "_blank" && fileOf(a.getAttribute("href")) === file;
      });
      // Exact match on page and #paper, otherwise the first link to this page.
      var best = same.filter(function (a) { var h = a.getAttribute("href"); return h.indexOf("#") >= 0 && h.slice(h.indexOf("#")) === hash; })[0] || same[0];
      if (best) {
        best.setAttribute("aria-current", "page");
        var group = best.closest("details");
        if (group) group.open = true;
      }
    }
    mark();
    window.addEventListener("hashchange", mark);

    var themeBtn = side.querySelector("[data-nl-side-theme]");
    var headerToggle = header.querySelector("[data-nl-theme]");
    function paintSide() { themeBtn.innerHTML = (isDark() ? SUN : MOON) + "<span>" + (isDark() ? "Light mode" : "Dark mode") + "</span>"; }
    if (themeBtn && headerToggle) {
      paintSide();
      themeBtn.addEventListener("click", function () { headerToggle.click(); paintSide(); });
    }
  }
})();
