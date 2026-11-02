"use strict";
// The visitor's own hour picks the harbour's light, as the game's hour bands do: dawn 5-9, day 9-17, golden 17-21, night.
// Loaded in the head so the right picture is the only one fetched; without it the page shows the day. `?h=18.5` forces an
// hour (captures). Nothing is stored or sent.
(() => {
  const root = document.documentElement;
  const forced = new URLSearchParams(location.search).get("h");
  const at = () => {
    if (forced !== null && !isNaN(+forced)) { const d = new Date(); d.setHours(Math.floor(+forced), Math.round((+forced % 1) * 60), 0, 0); return d; }
    return new Date();
  };
  const band = (h) => (h >= 5 && h < 9 ? "dawn" : h >= 9 && h < 17 ? "day" : h >= 17 && h < 21 ? "golden" : "night");
  const tick = () => {
    const d = at();
    root.dataset.band = band(d.getHours());
    const text = d.toLocaleTimeString(root.lang === "en" ? "en-GB" : "it-IT", { hour: "2-digit", minute: "2-digit" });
    for (const clock of document.querySelectorAll("[data-clock]")) clock.textContent = text;
  };
  tick();
  addEventListener("DOMContentLoaded", () => {
    tick();
    for (const el of document.querySelectorAll("[data-clock-line]")) el.hidden = false;
    // Only this hour's picture is shown; it is fetched now, the others never are.
    const shown = document.querySelector(`.bg .h-${root.dataset.band} img`);
    if (shown) shown.loading = "eager";
    if (forced === null) setInterval(tick, 30000);
  });
})();
