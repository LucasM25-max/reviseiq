// ReviseIQ theme system.
// Swaps the brand "spine" CSS variables on :root so the whole app recolours
// live. Per-subject identity colours (subjects.js) are intentionally untouched.

export var THEMES = [
  {
    id: "lumen",
    name: "Lumen",
    tagline: "Indigo \u00b7 Violet",
    accent: "#7c3aed",
    accentRgb: "124, 58, 237",
    p1: "#5b54f0",
    p1Rgb: "91, 84, 240",
    p2: "#8b5cf6",
    p2Rgb: "139, 92, 246",
    p3: "#d946ef",
    p3Rgb: "217, 70, 239",
    gradient: "linear-gradient(120deg, #5b54f0, #8b5cf6, #d946ef)",
  },
  {
    id: "ocean",
    name: "Ocean",
    tagline: "Blue \u00b7 Cyan",
    accent: "#2563eb",
    accentRgb: "37, 99, 235",
    p1: "#2563eb",
    p1Rgb: "37, 99, 235",
    p2: "#3b82f6",
    p2Rgb: "59, 130, 246",
    p3: "#06b6d4",
    p3Rgb: "6, 182, 212",
    gradient: "linear-gradient(120deg, #2563eb, #3b82f6, #06b6d4)",
  },
  {
    id: "emerald",
    name: "Emerald",
    tagline: "Green \u00b7 Teal",
    accent: "#059669",
    accentRgb: "5, 150, 105",
    p1: "#059669",
    p1Rgb: "5, 150, 105",
    p2: "#10b981",
    p2Rgb: "16, 185, 129",
    p3: "#34d399",
    p3Rgb: "52, 211, 153",
    gradient: "linear-gradient(120deg, #059669, #10b981, #34d399)",
  },
  {
    id: "sunset",
    name: "Sunset",
    tagline: "Rose \u00b7 Amber",
    accent: "#e11d48",
    accentRgb: "225, 29, 72",
    p1: "#e11d48",
    p1Rgb: "225, 29, 72",
    p2: "#fb7185",
    p2Rgb: "251, 113, 133",
    p3: "#f59e0b",
    p3Rgb: "245, 158, 11",
    gradient: "linear-gradient(120deg, #e11d48, #fb7185, #f59e0b)",
  },
  {
    id: "fuchsia",
    name: "Fuchsia",
    tagline: "Magenta \u00b7 Pink",
    accent: "#c026d3",
    accentRgb: "192, 38, 211",
    p1: "#a21caf",
    p1Rgb: "162, 28, 175",
    p2: "#c026d3",
    p2Rgb: "192, 38, 211",
    p3: "#e879f9",
    p3Rgb: "232, 121, 249",
    gradient: "linear-gradient(120deg, #a21caf, #c026d3, #e879f9)",
  },
  {
    id: "graphite",
    name: "Graphite",
    tagline: "Slate \u00b7 Neutral",
    accent: "#475569",
    accentRgb: "71, 85, 105",
    p1: "#334155",
    p1Rgb: "51, 65, 85",
    p2: "#475569",
    p2Rgb: "71, 85, 105",
    p3: "#94a3b8",
    p3Rgb: "148, 163, 184",
    gradient: "linear-gradient(120deg, #334155, #475569, #94a3b8)",
  },
];

var _current = THEMES[0];

export function getThemeById(id) {
  var found = THEMES.filter(function (t) {
    return t.id === id;
  });
  return found[0] || THEMES[0];
}

export function getActiveThemeId() {
  try {
    return localStorage.getItem("riq:theme") || "lumen";
  } catch (e) {
    return "lumen";
  }
}

export function applyTheme(id) {
  var t = getThemeById(id);
  _current = t;
  try {
    var r = document.documentElement;
    r.style.setProperty("--riq-accent", t.accent);
    r.style.setProperty("--riq-accent-rgb", t.accentRgb);
    r.style.setProperty("--riq-primary", t.p1);
    r.style.setProperty("--riq-primary-rgb", t.p1Rgb);
    r.style.setProperty("--riq-primary-2", t.p2);
    r.style.setProperty("--riq-primary-2-rgb", t.p2Rgb);
    r.style.setProperty("--riq-primary-3", t.p3);
    r.style.setProperty("--riq-primary-3-rgb", t.p3Rgb);
  } catch (e) {}
  try {
    localStorage.setItem("riq:theme", id);
  } catch (e) {}
  try {
    window.dispatchEvent(new Event("riq-theme"));
  } catch (e) {}
  return t;
}

export function initTheme() {
  return applyTheme(getActiveThemeId());
}

// Synchronous accent for non-CSS contexts (SVG presentation attributes,
// canvas) where var(--riq-accent) does not resolve.
export function themeAccent() {
  return _current.accent;
}

export function themePrimary() {
  return _current.p1;
}

export function themePrimary2() {
  return _current.p2;
}

export function themePrimary3() {
  return _current.p3;
}

// Resolve a brand var() string to a concrete hex, for SVG presentation
// attributes and canvas where CSS custom properties do not apply.
export function resolveVar(c) {
  if (c === "var(--riq-accent)") return _current.accent;
  if (c === "var(--riq-primary)") return _current.p1;
  if (c === "var(--riq-primary-2)") return _current.p2;
  if (c === "var(--riq-primary-3)") return _current.p3;
  return c;
}
