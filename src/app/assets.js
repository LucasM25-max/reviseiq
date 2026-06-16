

export const ASSET_INIT_FLAG = "__reviseiqAssetsInit";

export function initializeKatexAndFonts() {
  if (typeof document === "undefined") return;
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
  document.head.appendChild(fontLink);
  const katexCss = document.createElement("link");
  katexCss.rel = "stylesheet";
  katexCss.href =
    "https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css";
  document.head.appendChild(katexCss);
  let katexReady = typeof window.katex !== "undefined";
  const katexCallbacks = [];
  window.__onKatexReady = (cb) => {
    if (katexReady) cb();
    else katexCallbacks.push(cb);
  };
  const katexScript = document.createElement("script");
  katexScript.async = false;
  katexScript.src =
    "https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js";
  katexScript.onload = () => {
    katexReady = true;
    katexCallbacks.forEach((cb) => cb());
    katexCallbacks.length = 0;
  };
  document.head.appendChild(katexScript);
}

export function injectGlobalStyles() {
  const globalStyle = document.createElement("style");
  globalStyle.textContent = `
*{font-family:'IBM Plex Sans',sans-serif;box-sizing:border-box;margin:0;padding:0}
textarea,input,select{font-family:'IBM Plex Sans',sans-serif!important}
/* Motion */
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes streakPop{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}
@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes toastOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(8px)}}
.fade-in{animation:fadeIn .22s ease forwards}
.slide-up{animation:slideUp .25s ease forwards}
.streak-pop{animation:streakPop .35s ease}
.toast-in{animation:toastIn .2s ease forwards}
.toast-out{animation:toastOut .2s ease forwards}
/* Flashcard 3-D flip - premium surface */
.fc-scene{perspective:1400px}
.fc-card{width:100%;min-height:170px;position:relative;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.22,1,.36,1);will-change:transform}
.fc-card.flipped{transform:rotateY(180deg)}
.fc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:18px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:30px 26px;text-align:center;cursor:pointer;overflow:auto;box-shadow:0 14px 34px -16px rgba(31,28,72,.34),0 2px 6px -2px rgba(31,28,72,.12)}
.fc-face::before{content:"";position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#5b54f0,#8b5cf6,#d946ef)}
.fc-face::-webkit-scrollbar{width:5px}
.fc-back{transform:rotateY(180deg)}
.fc-back::before{background:linear-gradient(90deg,#0d9488,#10b981,#34d399)}
.fc-card:not(.flipped):hover .fc-face:not(.fc-back){box-shadow:0 20px 44px -16px rgba(91,84,240,.42),0 3px 8px -2px rgba(31,28,72,.16)}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:#c7c9e0;border-radius:6px}::-webkit-scrollbar-track{background:transparent}
.ann-handle{cursor:move;user-select:none}
/* Editable rich body */
.rich-body{outline:none;min-height:80px;line-height:1.75;font-size:13px}
.rich-body b,.rich-body strong{font-weight:700}
.rich-body i,.rich-body em{font-style:italic}
.rich-body u{text-decoration:underline}
.rich-body ul,.rich-body ol{padding-left:20px;margin:3px 0}
.rich-body li{margin-bottom:2px}
.rich-body h3{font-size:14px;font-weight:700;margin:6px 0 3px}
/* Revision-note reading surface - learning optimised */
.rich-display{line-height:1.78;font-size:15px;color:inherit;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.rich-display>*:first-child{margin-top:0}
.rich-display>*:last-child{margin-bottom:0}
.rich-display p{margin:0 0 11px}
.rich-display b,.rich-display strong{font-weight:700;color:inherit}
.rich-display i,.rich-display em{font-style:italic}
.rich-display u{text-decoration:underline;text-decoration-color:rgba(124,58,237,.5);text-underline-offset:2px}
.rich-display mark{background:linear-gradient(180deg,transparent 55%,rgba(245,158,11,.45) 55%);color:inherit;padding:0 1px;border-radius:2px}
.rich-display h2{font-size:18px;font-weight:800;margin:18px 0 8px;letter-spacing:-.01em;line-height:1.3}
.rich-display h3{font-size:15.5px;font-weight:800;margin:16px 0 7px;letter-spacing:-.01em;padding-left:11px;border-left:3px solid #8b5cf6}
.rich-display h4{font-size:13px;font-weight:700;margin:12px 0 5px;text-transform:uppercase;letter-spacing:.05em;color:#8b5cf6}
.rich-display ul,.rich-display ol{padding-left:24px;margin:9px 0}
.rich-display li{margin-bottom:7px;padding-left:4px}
.rich-display ul li::marker{color:#8b5cf6}
.rich-display ol li::marker{color:#8b5cf6;font-weight:700}
.rich-display a{color:#7c3aed;text-decoration:underline;text-underline-offset:2px}
.rich-display code{font-family:'IBM Plex Mono',monospace;font-size:.88em;background:rgba(124,58,237,.1);padding:1px 5px;border-radius:5px}
.rich-display hr{border:none;border-top:1px solid rgba(124,58,237,.18);margin:16px 0}
.rich-display blockquote{margin:12px 0;padding:8px 16px;border-left:3px solid rgba(124,58,237,.4);font-style:italic;opacity:.92}
.rich-display table{width:100%;border-collapse:separate;border-spacing:0;margin:14px 0;border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px rgba(124,58,237,.16);font-size:13.5px}
.rich-display thead th{background:linear-gradient(135deg,rgba(91,84,240,.16),rgba(139,92,246,.16));font-weight:800;font-size:11.5px;letter-spacing:.03em;text-transform:uppercase}
.rich-display th,.rich-display td{padding:8px 12px;line-height:1.5;text-align:left;border-bottom:1px solid rgba(124,58,237,.1)}
.rich-display tbody tr:nth-child(even){background:rgba(124,58,237,.045)}
.rich-display tbody tr:last-child td{border-bottom:none}
.rich-display figure{margin:14px 0;text-align:center}
.rich-display figure figcaption{font-size:12px;opacity:.7;margin-top:5px;font-style:italic}
.rich-display img{border-radius:10px;max-width:100%}
/* Learning callouts - dual-coded, colour-coded retrieval cues */
.rd-callout{position:relative;margin:14px 0;padding:12px 16px 13px 18px;border-radius:14px;border-left:4px solid var(--rd-accent,#8b5cf6);background:var(--rd-bg,rgba(139,92,246,.08));box-shadow:0 1px 3px rgba(31,28,72,.05)}
.rd-callout .rd-clabel{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--rd-accent,#8b5cf6);margin-bottom:6px}
.rd-callout .rd-clabel::before{content:var(--rd-icon,"◆");font-size:13px}
.rd-callout .rd-cbody{font-size:14.5px;line-height:1.65}
.rd-callout .rd-cbody>*:first-child{margin-top:0}
.rd-callout .rd-cbody>*:last-child{margin-bottom:0}
.rd-callout .rd-cbody ul,.rd-callout .rd-cbody ol{margin:5px 0}
.rd-def{--rd-accent:#8b5cf6;--rd-bg:rgba(139,92,246,.09);--rd-icon:"📘"}
.rd-alt{--rd-accent:#ec4899;--rd-bg:rgba(236,72,153,.09);--rd-icon:"⚖️"}
.rd-key{--rd-accent:#14b8a6;--rd-bg:rgba(20,184,166,.11);--rd-icon:"🔑"}
.rd-tip{--rd-accent:#f59e0b;--rd-bg:rgba(245,158,11,.12);--rd-icon:"💡"}
.rd-eg{--rd-accent:#3b82f6;--rd-bg:rgba(59,130,246,.09);--rd-icon:"🧪"}
.rd-warn{--rd-accent:#ef4444;--rd-bg:rgba(239,68,68,.1);--rd-icon:"⚠️"}
.rd-recall{--rd-accent:#6366f1;--rd-bg:rgba(99,102,241,.1);--rd-icon:"🧠"}
/* Evidence-based learning UI enhancements */
@keyframes sectionReveal{from{opacity:0;max-height:0;padding-top:0;padding-bottom:0}to{opacity:1;max-height:3000px}}
@keyframes confidencePop{0%{transform:scale(.88)}65%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes hintSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.note-reveal{animation:sectionReveal .28s ease forwards;overflow:hidden}
.conf-pop{animation:confidencePop .2s ease forwards}
.hint-slide{animation:hintSlide .18s ease forwards}
/* keyterm chips in notes - active-recall salience */
.keyterm{display:inline;background:linear-gradient(180deg,transparent 58%,rgba(139,92,246,.28) 58%);color:inherit;font-weight:600;padding:0 1px;border-radius:2px}
.keyterm-d{background:linear-gradient(180deg,transparent 58%,rgba(165,180,252,.32) 58%);color:inherit}
/* AO badges */
.ao-badge{display:inline-flex;align-items:center;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
/* image lightbox overlay */
.img-lb{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px}
@keyframes diagramPulse{0%{transform:scale(1)}50%{transform:scale(1.18)}100%{transform:scale(1)}}
.diagram-pulse{animation:diagramPulse .3s ease}
`;
  document.head.appendChild(globalStyle);
}

export function initializeAppAssets() {
  if (typeof window === "undefined") return;
  if (window[ASSET_INIT_FLAG]) return;
  initializeKatexAndFonts();
  injectGlobalStyles();
  window[ASSET_INIT_FLAG] = true;
}

initializeAppAssets();
