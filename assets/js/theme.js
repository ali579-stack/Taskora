"use strict";

const MOON_ICON = `
<svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round"
     stroke-linejoin="round">
  <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3
           6.7 6.7 0 0 0 21 12.8Z"/>
</svg>`;

const SUN_ICON = `
<svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round"
     stroke-linejoin="round">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2"/>
  <path d="M12 20v2"/>
  <path d="m4.93 4.93 1.41 1.41"/>
  <path d="m17.66 17.66 1.41 1.41"/>
  <path d="M2 12h2"/>
  <path d="M20 12h2"/>
  <path d="m6.34 17.66-1.41 1.41"/>
  <path d="m19.07 4.93-1.41 1.41"/>
</svg>`;

(function () {
  const saved = localStorage.getItem("taskora_theme");

  const theme =
    saved === "dark" || saved === "light"
      ? saved
      : (
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
        );

  document.documentElement.setAttribute("data-theme", theme);

  function updateIcons() {
    const dark =
      document.documentElement.getAttribute("data-theme") === "dark";

    document.querySelectorAll("#themeToggle, .theme-toggle").forEach((button) => {
      button.innerHTML = dark ? SUN_ICON : MOON_ICON;

      button.setAttribute(
        "aria-label",
        dark ? "Switch to light mode" : "Switch to dark mode"
      );

      button.setAttribute(
        "aria-pressed",
        String(dark)
      );
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("taskora_theme", theme);
    updateIcons();
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateIcons();

    document.querySelectorAll("#themeToggle, .theme-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const dark =
          document.documentElement.getAttribute("data-theme") === "dark";

        setTheme(dark ? "light" : "dark");
      });
    });
  });

  window.TaskoraTheme = {
    setTheme,
    getTheme: () =>
      document.documentElement.getAttribute("data-theme")
  };
})();

/* =========================================================
   GLOBAL LUCIDE ICON INITIALIZATION
========================================================= */
(function initTaskoraIcons() {
  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderIcons);
  } else {
    renderIcons();
  }

  window.addEventListener("load", renderIcons);
})();
