// coreHelpers.js
// Shared constants and helper functions for ReviseIQ.
// Reconstructed module-level utilities used across the app (identity/auth,
// storage-key builders, calibration + study-strategy helpers).

// ---- Exam board ----
export const DEFAULT_BOARD = "AQA";

// ---- Identity / auth ----
export const ADMIN_USER = "admin";
export const ADMIN_SCHOOL = "ReviseIQ";

// Deterministic, dependency-free string hash (djb2). Returns a short token.
export function hashPw(pw) {
  const s = String(pw == null ? "" : pw);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return "h" + (h >>> 0).toString(36);
}

// Default admin password is "admin" (hash compared on login).
export const ADMIN_PASS_HASH = hashPw("admin");

export function isAdmin(u) {
  if (!u) return false;
  return String(u).toLowerCase() === ADMIN_USER.toLowerCase();
}

// Build a friendly display name from a username or email.
export function getDisplayName(u) {
  if (!u) return "Student";
  let s = String(u).trim();
  const at = s.indexOf("@");
  if (at > 0) s = s.slice(0, at);
  s = s.replace(/[._-]+/g, " ").trim();
  if (!s) return "Student";
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- Storage keys ----
const KP = "gcse:";
function sane(x) {
  return String(x == null ? "" : x).replace(/\s+/g, "_");
}

export const SK = {
  ACCOUNTS: KP + "accounts",
  PREFS: (user) => KP + "prefs:" + sane(user),
  PROG: (user) => KP + "prog:" + sane(user),
  CUSTOM: (sId, b) => KP + "custom:" + sId + ":" + sane(b),
  EXTRAS: (sId, b) => KP + "extras:" + sId + ":" + sane(b),
  PAPERS: (sId, b) => KP + "papers:" + sId + ":" + sane(b),
  TIMETABLE: (user) => KP + "timetable:" + sane(user),
};

export function SK_PERSONAL(user) { return KP + "personal:" + sane(user); }
export function SK_SESSION(user) { return KP + "session:" + sane(user); }
export function SK_SVG_ASSETS(user) { return KP + "svgassets:" + sane(user); }
export function SK_CALIBRATION(user, sId) { return KP + "calib:" + sane(user) + ":" + sId; }
export function SK_JOURNAL(user, sId) { return KP + "journal:" + sane(user) + ":" + sId; }
export function SK_GRAPH(user, sId) { return KP + "graph:" + sane(user) + ":" + sId; }
export function SK_ERROR_PATTERNS(user, sId) { return KP + "errpat:" + sane(user) + ":" + sId; }

// ---- Calibration / confidence ----
// Map a 1-3 confidence rating (CONF3) to a predicted probability of being correct.
export function confToProb(conf) {
  const map = { 1: 0.25, 2: 0.55, 3: 0.85 };
  if (map[conf] != null) return map[conf];
  let n = Number(conf);
  if (isNaN(n)) return 0.5;
  if (n > 1) n = n / 100; // tolerate a 0-100 scale
  return Math.max(0.01, Math.min(0.99, n));
}

// Brier score over [{pred, outcome}] entries (lower = better calibrated).
export function calcBrierScore(calibData) {
  if (!Array.isArray(calibData) || !calibData.length) return null;
  let sum = 0, n = 0;
  for (const d of calibData) {
    if (!d) continue;
    const p = Number(d.pred), o = Number(d.outcome);
    if (isNaN(p) || isNaN(o)) continue;
    sum += (p - o) * (p - o);
    n++;
  }
  return n ? sum / n : null;
}

// Persist a per-subject error-type tally for the user.
export function incrementErrorPattern(user, subjId, errType) {
  if (!errType || !user) return;
  try {
    const ws = typeof window !== "undefined" && window.storage ? window.storage : null;
    if (!ws) return;
    const key = SK_ERROR_PATTERNS(user, subjId);
    Promise.resolve(ws.get(key, true))
      .then((r) => {
        let obj = {};
        try { obj = r && r.value ? JSON.parse(r.value) : {}; } catch (e) { obj = {}; }
        obj[errType] = (obj[errType] || 0) + 1;
        return ws.set(key, JSON.stringify(obj), true);
      })
      .catch(() => {});
  } catch (e) { /* non-fatal */ }
}

// Optional advanced error classifier hook. Left as null so callers fall back
// to detectErrorType (App checks `typeof classifyError === "function"`).
export const classifyError = null;

// ---- Study strategy recommendation ----
export function getStrategyRecommendation(subj, allSections, fcHist, calibData, timetableExams, stats) {
  fcHist = fcHist || {};
  allSections = Array.isArray(allSections) ? allSections : [];
  stats = stats || {};

  let daysToExam = null;
  if (Array.isArray(timetableExams)) {
    const now = Date.now();
    timetableExams.forEach((ex) => {
      if (!ex || !ex.date) return;
      const d = Math.ceil((new Date(ex.date).getTime() - now) / 86400000);
      if (d >= 0 && (daysToExam === null || d < daysToExam)) daysToExam = d;
    });
  }

  const total = allSections.length || 0;
  const reviewed = allSections.filter((s) =>
    (s.flashcards || []).some((c) => fcHist[c.id]),
  ).length;
  const coverage = total > 0 ? reviewed / total : 0;

  const weakQ = stats.weakQ || {};
  const hasWeak = Object.keys(weakQ).some((k) => {
    const w = weakQ[k];
    return w && w.total > 0 && w.wrong / w.total >= 0.4;
  });

  const brier = calibData && calibData.length >= 3 ? calcBrierScore(calibData) : null;
  const overconfident = brier != null && brier > 0.2;

  if (daysToExam !== null && daysToExam <= 3) {
    return { strategy: "questions", icon: "\u26A1", title: "Exam in " + daysToExam + (daysToExam === 1 ? " day" : " days"), reason: "Practise full exam-style questions under timed conditions to consolidate." };
  }
  if (hasWeak) {
    return { strategy: "weak", icon: "\uD83C\uDFAF", title: "Target your weak topics", reason: "You're getting several questions wrong here \u2014 focused practice closes the gap fastest." };
  }
  if (coverage < 0.4) {
    return { strategy: "flashcards", icon: "\uD83D\uDCDA", title: "Build your foundations", reason: "You haven't reviewed much yet \u2014 flashcards will lock in the core facts." };
  }
  if (overconfident) {
    return { strategy: "blurting", icon: "\u270D\uFE0F", title: "Test what you really know", reason: "Your confidence is ahead of your accuracy \u2014 blurting reveals the gaps." };
  }
  return { strategy: "mixed", icon: "\uD83D\uDD01", title: "Keep your momentum", reason: "Mix flashcards and questions to maintain and deepen recall." };
}
