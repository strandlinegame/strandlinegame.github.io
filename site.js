"use strict";
// The one place the Play link goes once there is one (Play Console, Testing, the opt-in link). Empty: "Presto su Google Play".
// The page's language is its address (/ Italian, /en/ English), so nothing here picks it. Nothing is stored or sent.
const PLAY_URL = "";

if (PLAY_URL) {
  for (const a of document.querySelectorAll("[data-play]")) { a.href = PLAY_URL; a.hidden = false; }
  for (const p of document.querySelectorAll("[data-soon]")) p.hidden = true;
}
const still = matchMedia("(prefers-reduced-motion: reduce)");
// `?book` starts the page at the journal, the harbour left out (captures: a headless screenshot cannot scroll).
if (new URLSearchParams(location.search).has("book")) {
  document.querySelector(".now").hidden = true;
  for (const img of document.querySelectorAll("img[loading=lazy]")) img.loading = "eager";
}

// The journal: one spread (wide screens) or one leaf (phones) in view. Swipe or scroll, the arrow keys, the page's two folded
// corners, or a bead for each view; the count says where you are. `?p=N` opens at view N (captures).
(() => {
  const leaves = document.querySelector("[data-leaves]");
  const bar = document.querySelector("[data-leafing]");
  if (!leaves || !bar) return;
  const book = leaves.parentElement;
  const [back, on] = book.querySelectorAll("[data-turn]");
  const row = bar.querySelector("[data-beads]");
  const count = bar.querySelector("[data-count]");
  const it = document.documentElement.lang === "it";
  bar.hidden = back.hidden = on.hidden = false;
  const views = () => Math.max(1, Math.round(leaves.scrollWidth / leaves.clientWidth));
  const at = () => Math.round(leaves.scrollLeft / leaves.clientWidth);
  const go = (i) => leaves.scrollTo({ left: Math.max(0, Math.min(views() - 1, i)) * leaves.clientWidth, behavior: still.matches ? "auto" : "smooth" });
  let beads = [];
  const show = () => {
    const i = at(), n = views();
    if (beads.length !== n) {
      for (const b of beads) b.remove();
      beads = Array.from({ length: n }, (_, k) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", it ? `Vai alla pagina ${k + 1}` : `Go to page ${k + 1}`);
        b.addEventListener("click", () => go(k));
        row.append(b);
        return b;
      });
    }
    beads.forEach((b, k) => (k === i ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
    back.disabled = i <= 0; on.disabled = i >= n - 1;
    count.textContent = it ? `${i + 1} di ${n}` : `${i + 1} of ${n}`;
  };
  back.addEventListener("click", () => go(at() - 1));
  on.addEventListener("click", () => go(at() + 1));
  // Left and right arrows turn the page wherever focus is inside the book (Page Up and Down on the book itself).
  book.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const d = e.key === "ArrowRight" || e.key === "PageDown" ? 1 : e.key === "ArrowLeft" || e.key === "PageUp" ? -1 : 0;
    if (!d || (e.key.startsWith("Page") && e.target !== leaves)) return;
    e.preventDefault(); go(at() + d);
  });
  let frame = 0;
  leaves.addEventListener("scroll", () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(show); }, { passive: true });
  addEventListener("resize", show);
  const p = +new URLSearchParams(location.search).get("p");
  if (p) leaves.scrollTo({ left: p * leaves.clientWidth, behavior: "instant" });
  show();
})();

// Tav. I, the first morning in small: a heap of dry sand over a green glass on its dried water ring. The brush (a finger or
// the mouse) clears the sand; once the find's middle shows, the rest slides off; a tap wets it and its name and fact come
// up. The button does each step for keyboards and anyone who would rather not drag.
(() => {
  const dig = document.querySelector("[data-dig]");
  const canvas = dig && dig.querySelector("canvas");
  const ctx = canvas && canvas.getContext && canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const bed = dig.querySelector(".bed");
  const find = dig.querySelector(".find.dry");
  const button = dig.querySelector("[data-do]");
  const say = dig.querySelector("[data-say]");
  const sand = new Image();
  sand.src = "/img/sand.webp";
  let state = "bury", w = 0, h = 0, k = 1, last = null, checkAt = 0;
  const strokes = []; // brush stamps in bed units (0..1), replayed when the bed changes size

  const set = (next) => { state = next; dig.dataset.state = next; };
  const box = () => {
    const a = find.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    return { x: a.left - c.left, y: a.top - c.top, w: a.width, h: a.height };
  };
  // A seeded heap: always the same irregular mound, wider than tall, its edge broken by a few lobes.
  function heap() {
    const r = canvas.getBoundingClientRect();
    k = Math.min(devicePixelRatio || 1, 2); w = r.width; h = r.height;
    canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const blob = (x, y, rx, ry, a) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.72, `rgba(0,0,0,${a})`); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, 7); ctx.fill(); ctx.restore();
    };
    blob(w * 0.5, h * 0.5, w * 0.44, h * 0.36, 1);
    for (let i = 0; i < 9; i++) {
      const a = rnd() * 6.28, d = 0.26 + rnd() * 0.12;
      blob(w * (0.5 + Math.cos(a) * d), h * (0.5 + Math.sin(a) * d * 0.8), w * (0.1 + rnd() * 0.08), h * (0.08 + rnd() * 0.07), 1);
    }
    // The sand itself, at the tile scale of the page's sand, inside that shape; a little light on the side facing it.
    const tile = parseFloat(getComputedStyle(bed).getPropertyValue("--tile")) || 380;
    const pattern = ctx.createPattern(sand, "repeat");
    pattern.setTransform(new DOMMatrix().scale(tile / sand.naturalWidth));
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = pattern; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-atop";
    const light = ctx.createLinearGradient(0, 0, w, h);
    light.addColorStop(0, "rgba(255,248,230,.25)"); light.addColorStop(0.55, "rgba(255,248,230,0)"); light.addColorStop(1, "rgba(150,110,60,.12)");
    ctx.fillStyle = light; ctx.fillRect(0, 0, w, h);
    for (const s of strokes) cut(s.x * w, s.y * h, s.r * w);
  }
  // One brush stamp: the sand goes, soft at the edge.
  function cut(x, y, rad) {
    ctx.globalCompositeOperation = "destination-out";
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, "#000"); g.addColorStop(0.6, "rgba(0,0,0,.9)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
  }
  function stamp(x, y, rad) { strokes.push({ x: x / w, y: y / h, r: rad / w }); cut(x, y, rad); }
  function stroke(x, y) {
    const rad = Math.max(20, w * 0.075);
    const from = last || { x, y };
    const n = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / 6));
    for (let i = 1; i <= n; i++) stamp(from.x + (x - from.x) * i / n, from.y + (y - from.y) * i / n, rad);
    last = { x, y };
    const now = performance.now();
    if (now > checkAt) { checkAt = now + 120; if (opened() > 0.55) uncover(); }
  }
  // How much of the find's middle is clear of sand.
  function opened() {
    const f = box();
    const x = Math.max(0, Math.round((f.x + f.w * 0.2) * k)), y = Math.max(0, Math.round((f.y + f.h * 0.2) * k));
    const fw = Math.min(canvas.width - x, Math.round(f.w * 0.6 * k)), fh = Math.min(canvas.height - y, Math.round(f.h * 0.6 * k));
    if (fw < 1 || fh < 1) return 0;
    const data = ctx.getImageData(x, y, fw, fh).data;
    let open = 0, all = 0;
    for (let i = 3; i < data.length; i += 4 * 7) { all++; if (data[i] < 90) open++; }
    return open / all;
  }
  function uncover() {
    if (state !== "bury") return;
    set("dry");
    if (say) say.textContent = dig.querySelector(".says").innerText;
  }
  function wet() {
    if (state !== "dry") return;
    set("wet");
    // Read the plate aloud: only its visible language's text.
    if (say) say.textContent = [...dig.querySelectorAll(".plate-name > *")].map((el) => el.innerText).join(" ");
  }
  const point = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener("pointerdown", (e) => {
    if (state !== "bury") return;
    canvas.setPointerCapture(e.pointerId);
    last = null;
    const p = point(e); stroke(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (state !== "bury" || !canvas.hasPointerCapture(e.pointerId)) return;
    const p = point(e); stroke(p.x, p.y);
  });
  const lift = () => { last = null; };
  canvas.addEventListener("pointerup", lift);
  canvas.addEventListener("pointercancel", lift);
  bed.addEventListener("click", (e) => { if (state === "dry" && e.target.closest(".find")) wet(); });
  button.addEventListener("click", () => (state === "bury" ? uncover() : wet()));

  let started = false;
  function start() {
    if (started || !(sand.complete && sand.naturalWidth)) return;
    started = true;
    dig.classList.add("live"); set("bury"); heap();
    // As in the game, a find is never wholly hidden at first: a corner of it shows through the sand.
    const f = box();
    stamp(f.x + f.w * 0.74, f.y + f.h * 0.2, Math.max(14, f.w * 0.15));
    // ?dig=dry|wet shows that step at once (captures).
    const want = new URLSearchParams(location.search).get("dig");
    if (want === "dry" || want === "wet") { uncover(); if (want === "wet") wet(); }
  }
  sand.addEventListener("load", start); start();
  let pending = 0;
  addEventListener("resize", () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(() => { if (started && state === "bury") heap(); }); });
})();
