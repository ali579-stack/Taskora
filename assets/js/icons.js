"use strict";

(function () {
  function renderIcons() {
    if (
      window.lucide &&
      typeof window.lucide.createIcons === "function"
    ) {
      window.lucide.createIcons();
    }
  }

  window.addEventListener("load", renderIcons);

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(renderIcons, 0);
  });
})();
