// Shared behaviour for the static pages' header: dark mode, mobile menu and the login link.
// Loaded in <head> so the saved theme is applied before the page paints.
(function () {
  "use strict";
  // Address of the React app (student login). Change this when the app is hosted somewhere else.
  var APP_URL = "http://localhost:5173/";
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
  });
})();
