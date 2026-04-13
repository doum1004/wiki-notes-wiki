const fs = require("fs");
const path = require("path");

const graph = JSON.parse(fs.readFileSync(path.join("dist", "graph.json"), "utf-8"));
const repoTitle = process.env.GITHUB_REPOSITORY || "Wiki";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${repoTitle} — wiki mind map</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --ink: #0e1117;
      --paper: #f4ede4;
      --paper2: #e8dcc8;
      --wood: #5c3d2e;
      --glow: #7c5cff;
      --synapse: rgba(180, 200, 255, 0.35);
      --panel-w: 300px;
      --library-w: 300px;
      --reader-px: 380px;
      --gutter-hit: 10px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .viz-root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: "Source Serif 4", Georgia, serif;
      color: #e8e4dc;
      background: radial-gradient(120% 80% at 70% 20%, #2a1f4a 0%, #12101c 45%, #0a090f 100%);
      overflow: hidden;
    }
    @keyframes drift {
      0%, 100% { filter: hue-rotate(0deg); }
      50% { filter: hue-rotate(12deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .viz-root { animation: none; }
    }
    @media (prefers-reduced-motion: no-preference) {
      .viz-root { animation: drift 48s ease-in-out infinite; }
    }
    .viz-header {
      flex-shrink: 0;
      padding: calc(0.65rem + env(safe-area-inset-top, 0px)) calc(1.25rem + env(safe-area-inset-right, 0px)) 0.65rem calc(1.25rem + env(safe-area-inset-left, 0px));
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: linear-gradient(180deg, rgba(20,16,32,0.95), rgba(12,10,20,0.6));
      display: flex;
      align-items: baseline;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .viz-header h1 {
      font-family: Fraunces, Georgia, serif;
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #faf6f0;
    }
    .viz-header .tagline {
      font-size: 0.88rem;
      opacity: 0.88;
      max-width: 42rem;
      line-height: 1.45;
    }
    .viz-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      align-items: stretch;
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    @media (min-width: 961px) {
      .viz-main {
        display: grid;
        grid-template-columns: var(--library-w) var(--gutter-hit) minmax(200px, 1fr) var(--gutter-hit) minmax(260px, min(var(--reader-px), 50vw));
        grid-template-rows: 1fr;
        overflow: hidden;
      }
      .library-panel { grid-column: 1; }
      .viz-gutter--left { grid-column: 2; }
      .viz-canvas-wrap { grid-column: 3; }
      .viz-gutter--right { grid-column: 4; }
      .viz-doc { grid-column: 5; }
    }
    @media (max-width: 960px) {
      .viz-main {
        flex-direction: column;
        overflow-y: auto;
      }
      .viz-gutter { display: none !important; }
    }
    .viz-gutter {
      display: none;
      background: rgba(255,255,255,0.06);
      cursor: col-resize;
      touch-action: none;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }
    @media (min-width: 961px) {
      .viz-gutter { display: block; }
    }
    .viz-gutter:hover,
    .viz-gutter:focus-visible {
      background: rgba(124, 92, 255, 0.35);
    }
    .viz-gutter:focus { outline: 2px solid rgba(124, 92, 255, 0.7); outline-offset: -2px; }
    .viz-panel {
      width: 100%;
      max-width: 100%;
      flex-shrink: 0;
      padding: 1rem 1.1rem 1.25rem;
      background: linear-gradient(165deg, var(--paper) 0%, var(--paper2) 100%);
      color: var(--ink);
      border-right: 3px solid var(--wood);
      box-shadow: inset 0 0 40px rgba(92,61,46,0.08);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    @media (max-width: 960px) {
      .viz-panel {
        width: 100%;
        border-right: none;
        border-bottom: 2px solid var(--wood);
        max-height: none;
      }
    }
    @media (min-width: 961px) {
      .viz-panel {
        width: 100%;
        min-width: 0;
      }
    }
    .viz-panel h2 {
      font-family: Fraunces, Georgia, serif;
      font-size: 1rem;
      color: var(--wood);
      margin: 0.75rem 0 0.35rem;
      font-weight: 700;
    }
    .viz-panel h2:first-of-type { margin-top: 0; }
    .viz-panel .blurb {
      font-size: 0.82rem;
      line-height: 1.5;
      margin-bottom: 0.75rem;
      opacity: 0.92;
    }
    .viz-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem 0.6rem;
      font-size: 0.8rem;
      margin-bottom: 0.6rem;
    }
    .viz-stats span { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--wood); }
    .viz-controls { display: flex; flex-direction: column; gap: 0.45rem; margin: 0.5rem 0 0.75rem; }
    .viz-controls input[type="search"] {
      width: 100%;
      padding: 0.4rem 0.5rem;
      border: 1px solid rgba(92,61,46,0.35);
      border-radius: 4px;
      font: inherit;
      background: #fffefb;
    }
    .viz-controls button {
      font-family: inherit;
      font-size: 0.8rem;
      padding: 0.55rem 0.75rem;
      min-height: 44px;
      border-radius: 4px;
      border: 1px solid var(--wood);
      background: #fffefb;
      color: var(--wood);
      cursor: pointer;
    }
    .viz-controls button:hover { background: var(--paper2); }
    @media (min-width: 961px) {
      .viz-controls button { min-height: 0; padding: 0.45rem 0.6rem; }
    }
    .viz-legend-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.78rem;
      margin: 0.25rem 0;
      line-height: 1.35;
    }
    .viz-legend-row .swatch {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.15);
    }
    .viz-hint {
      font-size: 0.72rem;
      opacity: 0.85;
      margin-top: 0.75rem;
      line-height: 1.45;
      border-top: 1px dashed rgba(92,61,46,0.25);
      padding-top: 0.6rem;
    }
    .viz-canvas-wrap {
      flex: 1 1 28%;
      position: relative;
      min-width: 0;
      min-height: 0;
      background: radial-gradient(ellipse at 50% 40%, rgba(124,92,255,0.12) 0%, transparent 55%);
    }
    @media (max-width: 960px) {
      .viz-canvas-wrap {
        flex: 1 1 auto;
        min-height: 40vh;
        height: 42vh;
      }
    }
    .viz-doc {
      flex: 0 1 46%;
      min-width: min(42rem, 48vw);
      max-width: 52rem;
      display: flex;
      flex-direction: column;
      min-height: 0;
      background: linear-gradient(180deg, #fffefb 0%, var(--paper) 100%);
      color: var(--ink);
      border-left: 3px solid var(--wood);
      box-shadow: -6px 0 24px rgba(0,0,0,0.12);
    }
    @media (min-width: 961px) {
      .viz-doc {
        min-width: 0;
        max-width: none;
        width: 100%;
      }
    }
    @media (max-width: 960px) {
      .viz-doc {
        flex: 1 1 auto;
        min-width: 0;
        max-width: none;
        width: 100%;
        min-height: 0;
        border-left: none;
        border-top: 3px solid var(--wood);
        box-shadow: none;
      }
    }
    .viz-doc--idle .viz-doc-body,
    .viz-doc--body-collapsed .viz-doc-body {
      flex: 0 0 auto;
      max-height: 0;
      min-height: 0;
      opacity: 0;
      padding-top: 0;
      padding-bottom: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .viz-doc-head {
      flex-shrink: 0;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.65rem 1rem 0.55rem;
      border-bottom: 1px solid rgba(92,61,46,0.15);
      background: rgba(248,244,236,0.98);
    }
    .viz-doc-head-titles {
      flex: 1;
      min-width: 0;
    }
    .viz-doc-toggle,
    .viz-doc-close {
      font-family: inherit;
      flex-shrink: 0;
      min-width: 44px;
      min-height: 44px;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(92,61,46,0.35);
      background: #fffefb;
      color: var(--wood);
      cursor: pointer;
      font-size: 0.85rem;
      line-height: 1.2;
    }
    @media (min-width: 961px) {
      .viz-doc-toggle,
      .viz-doc-close { min-width: 2rem; min-height: 2rem; padding: 0.2rem 0.45rem; }
    }
    .viz-doc-toggle[hidden],
    .viz-doc-close[hidden] { display: none !important; }
    .viz-doc-toggle:hover,
    .viz-doc-close:hover { background: var(--paper2); }
    #readerStub {
      font-family: Fraunces, Georgia, serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--wood);
      line-height: 1.35;
      display: block;
    }
    #readerTitle {
      font-family: Fraunces, Georgia, serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--wood);
      line-height: 1.3;
      display: block;
    }
    #readerTitle[hidden],
    #readerPath[hidden] { display: none !important; }
    #readerPath {
      display: block;
      margin-top: 0.35rem;
      font-size: 0.75rem;
      opacity: 0.78;
      word-break: break-all;
      font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
    }
    .viz-doc-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 1rem 1.15rem 1.5rem;
      font-size: 0.95rem;
      line-height: 1.62;
      transition: max-height 0.2s ease, opacity 0.2s ease, padding 0.2s ease;
    }
    .viz-reader-empty {
      margin: 0;
      opacity: 0.78;
      font-style: italic;
      font-size: 0.95rem;
    }
    .md-viewer > *:first-child { margin-top: 0; }
    .md-viewer > *:last-child { margin-bottom: 0; }
    .md-viewer h1, .md-viewer h2, .md-viewer h3, .md-viewer h4 {
      font-family: Fraunces, Georgia, serif;
      color: var(--wood);
      margin: 1.1em 0 0.45em;
      line-height: 1.25;
      font-weight: 700;
    }
    .md-viewer h1 { font-size: 1.55rem; }
    .md-viewer h2 { font-size: 1.28rem; }
    .md-viewer h3 { font-size: 1.1rem; }
    .md-viewer h4 { font-size: 1rem; }
    .md-viewer p { margin: 0.65em 0; }
    .md-viewer ul, .md-viewer ol { margin: 0.65em 0; padding-left: 1.35rem; }
    .md-viewer li { margin: 0.25em 0; }
    .md-viewer blockquote {
      margin: 0.75em 0;
      padding: 0.4rem 0.75rem;
      border-left: 4px solid rgba(92,61,46,0.35);
      background: rgba(92,61,46,0.06);
      color: #2a2420;
    }
    .md-viewer a {
      color: #4a3a9e;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .md-viewer a:hover { color: var(--glow); }
    .md-viewer hr {
      border: none;
      border-top: 1px solid rgba(92,61,46,0.2);
      margin: 1.25em 0;
    }
    .md-viewer code {
      font-size: 0.88em;
      font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
      background: rgba(92,61,46,0.08);
      padding: 0.12em 0.35em;
      border-radius: 4px;
    }
    .md-viewer pre {
      margin: 0.85em 0;
      padding: 0.75rem 0.85rem;
      overflow-x: auto;
      background: #1e1b26;
      color: #e8e4f0;
      border-radius: 6px;
      font-size: 0.82rem;
      line-height: 1.45;
    }
    .md-viewer pre code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }
    .md-viewer table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.85em 0;
      font-size: 0.88rem;
    }
    .md-viewer th, .md-viewer td {
      border: 1px solid rgba(92,61,46,0.22);
      padding: 0.35rem 0.5rem;
      text-align: left;
    }
    .md-viewer th {
      background: rgba(92,61,46,0.1);
      font-weight: 600;
    }
    #viz-svg {
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
      touch-action: none;
    }
    #viz-svg:active { cursor: grabbing; }
    .tooltip {
      position: fixed;
      display: none;
      z-index: 50;
      max-width: 280px;
      padding: 0.55rem 0.7rem;
      background: rgba(14, 17, 23, 0.94);
      color: #eef0f5;
      border: 1px solid rgba(124, 92, 255, 0.45);
      border-radius: 6px;
      font-size: 0.78rem;
      line-height: 1.4;
      pointer-events: none;
      box-shadow: 0 8px 28px rgba(0,0,0,0.35);
    }
    .tooltip .tt-title { font-weight: 700; color: #fff; margin-bottom: 0.2rem; }
    .tooltip .tt-path { font-size: 0.72rem; opacity: 0.75; word-break: break-all; }
    .tooltip .tt-meta { font-size: 0.7rem; opacity: 0.8; margin-top: 0.35rem; }
  </style>
</head>
<body class="viz-root">
  <header class="viz-header">
    <h1>${repoTitle}</h1>
    <p class="tagline">A living map of your wiki — synapses are links, stacks are topics. Pan and zoom the mind; use the shelf to search and refocus.</p>
  </header>
  <main class="viz-main">
    <aside class="viz-panel library-panel" aria-label="Library sidebar">
      <h2>Stacks</h2>
      <p class="blurb">Each color is a shelf in your library. Larger nodes are ideas more connected to others.</p>
      <div class="viz-stats" role="status">
        <div>Pages <span id="stat-nodes">0</span></div>
        <div>Links <span id="stat-edges">0</span></div>
        <div style="grid-column: span 2;">In focus <span id="stat-focus">—</span></div>
      </div>
      <div class="viz-controls">
        <label for="searchFilter" class="sr-only">Search pages</label>
        <input type="search" id="searchFilter" placeholder="Search titles & paths…" autocomplete="off" />
        <button type="button" id="btnReset">Reset view & focus</button>
      </div>
      <h2>Shelf key</h2>
      <div class="viz-legend-row"><span class="swatch" style="background:#4a9eff"></span><span><strong>Entities</strong> — who &amp; what you track</span></div>
      <div class="viz-legend-row"><span class="swatch" style="background:#4caf50"></span><span><strong>Concepts</strong> — ideas &amp; frameworks</span></div>
      <div class="viz-legend-row"><span class="swatch" style="background:#ff9800"></span><span><strong>Sources</strong> — readings &amp; inputs</span></div>
      <div class="viz-legend-row"><span class="swatch" style="background:#ab47bc"></span><span><strong>Synthesis</strong> — cross-cutting views</span></div>
      <div class="viz-legend-row"><span class="swatch" style="background:#888"></span><span><strong>Other</strong> — index, log, templates…</span></div>
      <p class="viz-hint">Tip: click a node to read it and spotlight links; click the same node again, press Escape, or Close in the reader to clear. Drag the narrow bars between shelf, graph, and reader (wide screens) to resize. On phones the reader stays compact until you pick a page — pinch and drag on the graph to zoom and pan. Rebuild graph + site after edits.</p>
    </aside>
    <div class="viz-gutter viz-gutter--left" role="separator" aria-orientation="vertical" aria-label="Resize library column" tabindex="0"></div>
    <div class="viz-canvas-wrap" aria-label="Graph canvas">
      <svg id="viz-svg" role="img" aria-label="Wiki link graph"></svg>
    </div>
    <div class="viz-gutter viz-gutter--right" role="separator" aria-orientation="vertical" aria-label="Resize reader column" tabindex="0"></div>
    <article class="viz-doc viz-doc--idle" id="vizReader" aria-label="Page reader">
      <div class="viz-doc-head">
        <button type="button" class="viz-doc-toggle" id="readerToggle" hidden aria-expanded="true" aria-controls="readerBody" title="Collapse or expand page">▾</button>
        <div class="viz-doc-head-titles">
          <span id="readerStub" class="viz-doc-stub">Reader — select a page from the graph</span>
          <span id="readerTitle"></span>
          <span id="readerPath"></span>
        </div>
        <button type="button" class="viz-doc-close" id="readerClose" hidden aria-label="Clear selection">Close</button>
      </div>
      <div id="readerBody" class="viz-doc-body md-viewer" aria-live="polite">
        <p class="viz-reader-empty">Click a page in the graph to read it here.</p>
      </div>
    </article>
  </main>
  <div class="tooltip" id="tooltip" role="tooltip"></div>
  <style>.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }</style>
  <script type="module">
    import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
    import { marked } from "https://cdn.jsdelivr.net/npm/marked@12/+esm";
    import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3/+esm";

    const data = ${JSON.stringify(graph)};

    const mdOpts = { gfm: true, breaks: true, headerIds: false, mangle: false };
    const SPLIT_LS_KEY = "llmwikiVizSplit";
    const useHoverTips = !window.matchMedia("(pointer: coarse)").matches;

    let selected = null;
    let searchQ = "";

    function syncHash() {
      const base = location.pathname + location.search;
      if (!selected) {
        if (location.hash) history.replaceState(null, "", base);
        return;
      }
      const frag = "#/" + encodeURIComponent(selected);
      if (location.hash !== frag) history.replaceState(null, "", frag);
    }

    function updateReaderChrome() {
      const doc = document.getElementById("vizReader");
      const stub = document.getElementById("readerStub");
      const titleEl = document.getElementById("readerTitle");
      const pathEl = document.getElementById("readerPath");
      const toggle = document.getElementById("readerToggle");
      const closeBtn = document.getElementById("readerClose");
      if (!doc || !stub || !titleEl || !pathEl || !toggle || !closeBtn) return;
      if (!selected) {
        doc.classList.add("viz-doc--idle");
        doc.classList.remove("viz-doc--body-collapsed");
        stub.hidden = false;
        titleEl.hidden = true;
        pathEl.hidden = true;
        toggle.hidden = true;
        closeBtn.hidden = true;
        return;
      }
      doc.classList.remove("viz-doc--idle");
      stub.hidden = true;
      titleEl.hidden = false;
      pathEl.hidden = false;
      toggle.hidden = false;
      closeBtn.hidden = false;
      const collapsed = doc.classList.contains("viz-doc--body-collapsed");
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.textContent = collapsed ? "▸" : "▾";
    }

    function showReader(d) {
      const titleEl = document.getElementById("readerTitle");
      const pathEl = document.getElementById("readerPath");
      const bodyEl = document.getElementById("readerBody");
      const doc = document.getElementById("vizReader");
      if (!titleEl || !pathEl || !bodyEl || !doc) return;
      doc.classList.remove("viz-doc--idle", "viz-doc--body-collapsed");
      titleEl.textContent = d.title || d.id;
      pathEl.textContent = d.id;
      const raw = typeof d.body === "string" ? d.body : "";
      if (!raw) {
        bodyEl.innerHTML = DOMPurify.sanitize(
          '<p class="viz-reader-empty">No text for this page in graph.json. Run <code>node scripts/build-graph.js</code> then rebuild the site.</p>',
          { USE_PROFILES: { html: true } },
        );
      } else {
        const dirty = marked.parse(raw, mdOpts);
        bodyEl.innerHTML = DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
      }
      updateReaderChrome();
      syncHash();
      if (window.matchMedia("(max-width: 960px)").matches) {
        doc.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    function clearReader() {
      const titleEl = document.getElementById("readerTitle");
      const pathEl = document.getElementById("readerPath");
      const bodyEl = document.getElementById("readerBody");
      const doc = document.getElementById("vizReader");
      if (titleEl) titleEl.textContent = "";
      if (pathEl) pathEl.textContent = "";
      if (bodyEl) {
        bodyEl.innerHTML = DOMPurify.sanitize(
          '<p class="viz-reader-empty">Click a page in the graph to read it here.</p>',
          { USE_PROFILES: { html: true } },
        );
      }
      if (doc) {
        doc.classList.add("viz-doc--idle");
        doc.classList.remove("viz-doc--body-collapsed");
      }
      updateReaderChrome();
      syncHash();
    }

    function clearSelectionAndReader() {
      selected = null;
      clearReader();
      applyFocusOpacity();
    }

    function readCssSplitPx() {
      const root = getComputedStyle(document.documentElement);
      const l = parseFloat(root.getPropertyValue("--library-w")) || 300;
      const r = parseFloat(root.getPropertyValue("--reader-px")) || 380;
      return { l, r };
    }

    function applySplitCss(libPx, readerPx) {
      document.documentElement.style.setProperty("--library-w", libPx + "px");
      document.documentElement.style.setProperty("--reader-px", readerPx + "px");
    }

    function saveSplit(libPx, readerPx) {
      try {
        localStorage.setItem(SPLIT_LS_KEY, JSON.stringify({ l: libPx, r: readerPx }));
      } catch (_) {}
    }

    function loadSplit() {
      try {
        const raw = localStorage.getItem(SPLIT_LS_KEY);
        if (!raw) return;
        const o = JSON.parse(raw);
        if (typeof o.l === "number" && typeof o.r === "number") {
          applySplitCss(
            Math.min(440, Math.max(200, o.l)),
            Math.min(620, Math.max(260, o.r)),
          );
        }
      } catch (_) {}
    }

    function startGutterDrag(which, e) {
      if (window.innerWidth < 961) return;
      e.preventDefault();
      const startX = e.clientX;
      const start = readCssSplitPx();
      const startL = start.l;
      const startR = start.r;
      function onMove(ev) {
        const dx = ev.clientX - startX;
        if (which === "left") {
          const nl = Math.min(440, Math.max(200, startL + dx));
          applySplitCss(nl, startR);
        } else {
          const nr = Math.min(620, Math.max(260, startR + dx));
          applySplitCss(startL, nr);
        }
      }
      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        const px = readCssSplitPx();
        saveSplit(px.l, px.r);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }

    function applyHashFromLocation() {
      const h = location.hash;
      if (!h || h.length < 3 || !h.startsWith("#/")) {
        if (selected) {
          selected = null;
          clearReader();
          applyFocusOpacity();
        }
        return;
      }
      let id;
      try {
        id = decodeURIComponent(h.slice(2));
      } catch {
        return;
      }
      const nodeData = data.nodes.find((n) => n.id === id);
      if (!nodeData) return;
      selected = id;
      showReader(nodeData);
      if (searchQ.trim()) applySearch();
      else applyFocusOpacity();
    }

    const DIR_COLORS = {
      entities: "#4a9eff",
      concepts: "#4caf50",
      sources: "#ff9800",
      synthesis: "#ab47bc",
    };

    function layoutSize() {
      const el = document.querySelector(".viz-canvas-wrap");
      const r = el ? el.getBoundingClientRect() : { width: 400, height: 400 };
      return { w: Math.max(240, r.width), h: Math.max(240, r.height) };
    }

    let { w: width, h: height } = layoutSize();
    const svg = d3.select("#viz-svg").attr("width", width).attr("height", height);
    const zoomG = svg.append("g").attr("class", "zoom-layer");
    const zoom = d3.zoom().scaleExtent([0.12, 10]).on("zoom", (e) => {
      zoomG.attr("transform", e.transform);
    });
    svg.call(zoom);
    svg.on("dblclick.zoom", null);
    svg.on("dblclick", (e) => {
      const t = e.target;
      if (t && t.tagName && t.tagName.toLowerCase() !== "circle" && t.tagName.toLowerCase() !== "text") {
        clearFocus();
      }
    });

    zoomG.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .style("pointer-events", "none");

    const deg = new Map();
    for (const n of data.nodes) deg.set(n.id, 0);
    for (const e of data.edges) {
      const s = typeof e.source === "object" ? e.source.id : e.source;
      const t = typeof e.target === "object" ? e.target.id : e.target;
      deg.set(s, (deg.get(s) || 0) + 1);
      deg.set(t, (deg.get(t) || 0) + 1);
    }

    function nodeRadius(d) {
      const d0 = deg.get(d.id) || 1;
      return Math.max(5, Math.min(22, 4 + Math.sqrt(d0) * 3.2));
    }

    function linkPath(d) {
      const s = d.source;
      const t = d.target;
      if (typeof s !== "object" || typeof t !== "object" || s.x == null || t.x == null) {
        return "M0,0L0,0";
      }
      const mx = (s.x + t.x) * 0.5;
      const my = (s.y + t.y) * 0.5;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L;
      const ny = dx / L;
      const bend = L * 0.14;
      const cx = mx + nx * bend;
      const cy = my + ny * bend;
      return "M" + s.x + "," + s.y + " Q" + cx + "," + cy + " " + t.x + "," + t.y;
    }

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id((d) => d.id).distance(92).strength(0.55))
      .force("charge", d3.forceManyBody().strength(-260))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => nodeRadius(d) + 6));

    const linkG = zoomG.append("g").attr("class", "links");
    const link = linkG
      .selectAll("path")
      .data(data.edges)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "rgba(120,140,200,0.28)")
      .attr("stroke-width", 1.35)
      .attr("stroke-linecap", "round");

    const nodeG = zoomG.append("g").attr("class", "nodes");
    const node = nodeG
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => DIR_COLORS[d.dir] || "#888")
      .attr("stroke", (d) => (DIR_COLORS[d.dir] ? "#fff" : "#ccc"))
      .attr("stroke-width", 1.2)
      .style("filter", "drop-shadow(0 0 6px rgba(124,92,255,0.25))")
      .call(
        d3
          .drag()
          .on("start", (e, d) => {
            if (!e.active) simulation.alphaTarget(0.35).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (e, d) => {
            d.fx = e.x;
            d.fy = e.y;
          })
          .on("end", (e, d) => {
            if (!e.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    const label = zoomG
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text((d) => d.title)
      .attr("font-size", (d) => Math.max(8, Math.min(12, 7 + nodeRadius(d) * 0.22)))
      .attr("fill", "rgba(240,238,255,0.92)")
      .attr("dx", (d) => nodeRadius(d) + 4)
      .attr("dy", "0.35em")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.85)");

    document.getElementById("stat-nodes").textContent = String(data.nodes.length);
    document.getElementById("stat-edges").textContent = String(data.edges.length);
    loadSplit();

    const tooltip = document.getElementById("tooltip");
    function showTip(e, d) {
      const nbr = deg.get(d.id) || 0;
      tooltip.style.display = "block";
      tooltip.innerHTML =
        '<div class="tt-title"></div><div class="tt-path"></div><div class="tt-meta"></div>';
      tooltip.querySelector(".tt-title").textContent = d.title;
      tooltip.querySelector(".tt-path").textContent = d.id;
      tooltip.querySelector(".tt-meta").textContent = nbr + " connection" + (nbr === 1 ? "" : "s");
      positionTip(e);
    }
    function positionTip(e) {
      tooltip.style.left = e.clientX + 14 + "px";
      tooltip.style.top = e.clientY - 6 + "px";
    }
    function hideTip() {
      tooltip.style.display = "none";
    }

    if (useHoverTips) {
      node
        .on("mouseover", (e, d) => showTip(e, d))
        .on("mousemove", positionTip)
        .on("mouseout", hideTip);
    }
    node.on("click", (e, d) => {
      e.stopPropagation();
      if (selected === d.id) {
        clearSelectionAndReader();
        return;
      }
      selected = d.id;
      showReader(d);
      if (searchQ.trim()) applySearch();
      else applyFocusOpacity();
    });

    function applySearch() {
      const q = searchQ.trim().toLowerCase();
      if (!q) {
        applyFocusOpacity();
        return;
      }
      const match = (d) =>
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.id && d.id.toLowerCase().includes(q)) ||
        (typeof d.body === "string" && d.body.toLowerCase().includes(q));
      node.attr("opacity", (d) => (match(d) ? 1 : 0.12));
      label.attr("opacity", (d) => (match(d) ? 1 : 0.1));
      link.attr("opacity", (l) => {
        const s = typeof l.source === "object" ? l.source : data.nodes.find((n) => n.id === l.source);
        const t = typeof l.target === "object" ? l.target : data.nodes.find((n) => n.id === l.target);
        return s && t && (match(s) || match(t)) ? 0.55 : 0.04;
      });
      document.getElementById("stat-focus").textContent = "search";
    }

    function applyFocusOpacity() {
      if (searchQ.trim()) {
        applySearch();
        return;
      }
      if (!selected) {
        node.attr("opacity", 1);
        link.attr("opacity", 0.85);
        label.attr("opacity", 1);
        document.getElementById("stat-focus").textContent = "—";
        return;
      }
      const connected = new Set([selected]);
      data.edges.forEach((e) => {
        const src = typeof e.source === "object" ? e.source.id : e.source;
        const tgt = typeof e.target === "object" ? e.target.id : e.target;
        if (src === selected) connected.add(tgt);
        if (tgt === selected) connected.add(src);
      });
      node.attr("opacity", (n) => (connected.has(n.id) ? 1 : 0.11));
      link.attr("opacity", (l) => {
        const src = typeof l.source === "object" ? l.source.id : l.source;
        const tgt = typeof l.target === "object" ? l.target.id : l.target;
        return src === selected || tgt === selected ? 0.95 : 0.05;
      });
      label.attr("opacity", (n) => (connected.has(n.id) ? 1 : 0.12));
      document.getElementById("stat-focus").textContent = selected;
    }

    function clearFocus() {
      selected = null;
      searchQ = "";
      const inp = document.getElementById("searchFilter");
      if (inp) inp.value = "";
      clearReader();
      applyFocusOpacity();
    }

    document.getElementById("btnReset").addEventListener("click", () => {
      clearFocus();
      svg.transition().duration(380).call(zoom.transform, d3.zoomIdentity);
    });

    document.getElementById("searchFilter").addEventListener("input", (e) => {
      searchQ = e.target.value || "";
      applySearch();
    });

    const leftGutter = document.querySelector(".viz-gutter--left");
    const rightGutter = document.querySelector(".viz-gutter--right");
    if (leftGutter) {
      leftGutter.addEventListener("mousedown", (e) => startGutterDrag("left", e));
      leftGutter.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const px = readCssSplitPx();
        const delta = e.key === "ArrowRight" ? 12 : -12;
        applySplitCss(Math.min(440, Math.max(200, px.l + delta)), px.r);
        saveSplit(readCssSplitPx().l, readCssSplitPx().r);
      });
    }
    if (rightGutter) {
      rightGutter.addEventListener("mousedown", (e) => startGutterDrag("right", e));
      rightGutter.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const px = readCssSplitPx();
        const delta = e.key === "ArrowRight" ? 12 : -12;
        applySplitCss(px.l, Math.min(620, Math.max(260, px.r + delta)));
        saveSplit(readCssSplitPx().l, readCssSplitPx().r);
      });
    }

    const readerCloseBtn = document.getElementById("readerClose");
    if (readerCloseBtn) readerCloseBtn.addEventListener("click", () => clearSelectionAndReader());
    const readerToggleBtn = document.getElementById("readerToggle");
    if (readerToggleBtn) {
      readerToggleBtn.addEventListener("click", () => {
        const doc = document.getElementById("vizReader");
        if (!doc || !selected) return;
        doc.classList.toggle("viz-doc--body-collapsed");
        updateReaderChrome();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      clearSelectionAndReader();
    });

    window.addEventListener("hashchange", () => applyHashFromLocation());

    simulation.on("tick", () => {
      link.attr("d", linkPath);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    function relayout() {
      const z = layoutSize();
      width = z.w;
      height = z.h;
      svg.attr("width", width).attr("height", height);
      zoomG.select("rect").attr("width", width).attr("height", height);
      simulation.force("center", d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.35).restart();
    }
    let resizeT = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(relayout, 120);
    });

    updateReaderChrome();
    applyHashFromLocation();
    applyFocusOpacity();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join("dist", "index.html"), html);
console.log("Site built → dist/index.html");
