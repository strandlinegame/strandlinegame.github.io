"use strict";
// The landing's language is its address (/ Italian, /en/ English). The visitor's own choice, made with the language links
// and kept in this browser, wins; without one, the browser's first language (it: Italian, anything else: English); Italian
// when it says nothing. A page in the other language is replaced at once (search and #hash kept, never read or sent anywhere).
// Loaded in the head, so the wrong language is never painted. Nothing else is stored.
(() => {
  const KEY = "strandline-lang";
  let chosen = "";
  try { chosen = localStorage.getItem(KEY) || ""; } catch (e) { /* storage blocked: the browser's language decides */ }
  if (chosen !== "it" && chosen !== "en") {
    const first = [...(navigator.languages || []), navigator.language].find(Boolean) || "";
    chosen = first ? (first.toLowerCase().startsWith("it") ? "it" : "en") : "it";
  }
  // Search engines index both addresses as they are (hreflang links them): never move a crawler.
  const bot = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|preview/i.test(navigator.userAgent || "");
  if (!bot && document.documentElement.lang !== chosen) {
    location.replace((chosen === "en" ? "/en/" : "/") + location.search + location.hash);
    return;
  }
  // The language links remember the choice (before they follow it).
  addEventListener("DOMContentLoaded", () => {
    for (const a of document.querySelectorAll(".lang a[data-set]")) {
      a.addEventListener("click", () => { try { localStorage.setItem(KEY, a.dataset.set); } catch (e) { /* not kept */ } });
    }
  });
})();
