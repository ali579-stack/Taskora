"use strict";

const EYE_ICON = `
<svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round"
     stroke-linejoin="round">
  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

const EYE_OFF_ICON = `
<svg viewBox="0 0 24 24" aria-hidden="true" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round"
     stroke-linejoin="round">
  <path d="m3 3 18 18"/>
  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
  <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c7 0 10 8 10 8a17.3 17.3 0 0 1-3.2 4.4"/>
  <path d="M6.2 6.2C3.4 8.2 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 3-.5"/>
</svg>`;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    const input = document.getElementById(
      button.dataset.passwordToggle
    );

    if (!input) return;

    button.innerHTML = EYE_ICON;

    button.addEventListener("click", () => {
      const visible = input.type === "text";

      input.type = visible ? "password" : "text";

      button.innerHTML = visible
        ? EYE_ICON
        : EYE_OFF_ICON;

      button.setAttribute(
        "aria-label",
        visible ? "Show password" : "Hide password"
      );

      button.setAttribute(
        "aria-pressed",
        String(!visible)
      );
    });
  });
});
