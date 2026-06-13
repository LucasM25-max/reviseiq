

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
@keyframes
fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes
slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes
streakPop{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}

@keyframes toastIn{from{opacity:0;transform:translateY(12px)
scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes
toastOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(8px)}}
.fade-in{animation:fadeIn .22s ease forwards}
.slide-up{animation:slideUp .25s ease forwards}
.streak-pop{animation:streakPop .35s ease}
.toast-in{animation:toastIn .2s ease forwards}
.toast-out{animation:toastOut .2s ease forwards}
/* Flashcard 3-D flip */
.fc-scene{perspective:900px}
.fc-card{width:100%;min-height:170px;position:relative;transform-style:preserve-3d;transition:tra
nsform .4s cubic-bezier(.4,0,.2,1)}
.fc-card.flipped{transform:rotateY(180deg)}
.fc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;bor
der-radius:14px;display:flex;flex-direction:column;justify-content:center;align-items:center;paddi
ng:32px 24px;text-align:center;cursor:pointer}
.fc-back{transform:rotateY(180deg)}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}
.ann-handle{cursor:move;user-select:none}
.rich-body{outline:none;min-height:80px;line-height:1.75;font-size:13px}
.rich-body b,.rich-body strong{font-weight:700}
.rich-body i,.rich-body em{font-style:italic}
.rich-body u{text-decoration:underline}
.rich-body ul,.rich-body ol{padding-left:20px;margin:3px 0}
.rich-body li{margin-bottom:2px}
.rich-body h3{font-size:14px;font-weight:700;margin:6px 0 3px}
.rich-display{line-height:1.75;font-size:13px}
.rich-display b,.rich-display strong{font-weight:700}
.rich-display i,.rich-display em{font-style:italic}
.rich-display u{text-decoration:underline}
.rich-display ul,.rich-display ol{padding-left:20px;margin:4px 0}
.rich-display li{margin-bottom:2px}
.rich-display h3{font-size:14px;font-weight:700;margin:6px 0 3px}
/* ── Evidence-based learning UI enhancements ── */
@keyframes
sectionReveal{from{opacity:0;max-height:0;padding-top:0;padding-bottom:0}to{opacity:1;max-h
eight:3000px}}
@keyframes
confidencePop{0%{transform:scale(.88)}65%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes
hintSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.note-reveal{animation:sectionReveal .28s ease forwards;overflow:hidden}
.conf-pop{animation:confidencePop .2s ease forwards}

.hint-slide{animation:hintSlide .18s ease forwards}
/* keyterm chips in notes */
.keyterm{display:inline-flex;align-items:center;background:rgba(99,102,241,.13);color:#4f46e5;b
order-radius:5px;padding:1px 6px;font-weight:600;font-size:.92em}
.keyterm-d{background:rgba(165,180,252,.15);color:#a5b4fc}
/* AO badges */
.ao-badge{display:inline-flex;align-items:center;border-radius:20px;padding:2px
9px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
/* image lightbox overlay */
.img-lb{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:cen
ter;justify-content:center;cursor:zoom-out;padding:20px}
@keyframes
diagramPulse{0%{transform:scale(1)}50%{transform:scale(1.18)}100%{transform:scale(1)}}
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
