

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
.fc-card{width:100%;min-height:170px;position:relative;transform-style:preserve-3d;transition:transform .4s cubic-bezier(.4,0,.2,1)}
.fc-card.flipped{transform:rotateY(180deg)}
.fc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:14px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:32px 24px;text-align:center;cursor:pointer}
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
.rich-display{line-height:1.7;font-size:14.5px;color:inherit}
.rich-display>*:first-child{margin-top:0}
.rich-display>*:last-child{margin-bottom:0}
.rich-display p{margin:0 0 10px}
.rich-display b,.rich-display strong{font-weight:700;color:inherit}
.rich-display i,.rich-display em{font-style:italic}
.rich-display u{text-decoration:underline}
.rich-display h3{font-size:15px;font-weight:800;margin:14px 0 6px;letter-spacing:-.01em}
.rich-display ul,.rich-display ol{padding-left:22px;margin:8px 0}
.rich-display li{margin-bottom:6px;padding-left:3px}
.rich-display ul li::marker{color:#7c3aed}
.rich-display ol li::marker{color:#7c3aed;font-weight:700}
.rich-display table{margin:12px 0;border-radius:10px;overflow:hidden;box-shadow:0 0 0 1px rgba(124,58,237,.12)}
.rich-display th{font-weight:700;font-size:12.5px;letter-spacing:.02em}
.rich-display td,.rich-display th{line-height:1.5}
.rich-display figure{margin:14px 0}
/* ── Learning-optimised note callouts ── */
.rd-callout{position:relative;margin:12px 0;padding:11px 14px 12px 16px;border-radius:12px;border-left:4px solid var(--rd-accent,#7c3aed);background:var(--rd-bg,rgba(124,58,237,.07))}
.rd-callout .rd-clabel{display:block;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--rd-accent,#7c3aed);margin-bottom:5px}
.rd-callout .rd-cbody{font-size:14px;line-height:1.6}
.rd-callout .rd-cbody>*:first-child{margin-top:0}
.rd-callout .rd-cbody>*:last-child{margin-bottom:0}
.rd-callout .rd-cbody ul,.rd-callout .rd-cbody ol{margin:4px 0}
.rd-def{--rd-accent:#7c3aed;--rd-bg:rgba(124,58,237,.08)}
.rd-alt{--rd-accent:#d6336c;--rd-bg:rgba(214,51,108,.08)}
.rd-key{--rd-accent:#0d9488;--rd-bg:rgba(13,148,136,.10)}
.rd-tip{--rd-accent:#d97706;--rd-bg:rgba(217,119,6,.11)}
.rd-eg{--rd-accent:#2563eb;--rd-bg:rgba(37,99,235,.08)}
/* ── Evidence-based learning UI enhancements ── */
@keyframes
sectionReveal{from{opacity:0;max-height:0;padding-top:0;padding-bottom:0}to{opacity:1;max-height:3000px}}
@keyframes
confidencePop{0%{transform:scale(.88)}65%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes
hintSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.note-reveal{animation:sectionReveal .28s ease forwards;overflow:hidden}
.conf-pop{animation:confidencePop .2s ease forwards}

.hint-slide{animation:hintSlide .18s ease forwards}
/* keyterm chips in notes */
.keyterm{display:inline-flex;align-items:center;background:rgba(99,102,241,.13);color:#6d28d9;border-radius:5px;padding:1px 6px;font-weight:600;font-size:.92em}
.keyterm-d{background:rgba(165,180,252,.15);color:#c4b5fd}
/* AO badges */
.ao-badge{display:inline-flex;align-items:center;border-radius:20px;padding:2px
9px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
/* image lightbox overlay */
.img-lb{position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px}
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
