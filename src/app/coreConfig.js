import { getSubjectStrategy } from "../learningEngine.js";

export const ADMIN_USER = "lucasm_25@outlook.com";
export const isAdmin = (u) => u === ADMIN_USER;

export function getDisplayName(key) {
  if (!key) return "";
  if (key.indexOf("@") !== -1) {
    var local = key.split("@")[0] || key;
    var m = local.match(/^([A-Za-z]+)/);
    if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    return local.slice(0, 20);
  }
  return key;
}

export const EXAM_BOARDS = ["AQA", "Edexcel", "Eduqas", "OCR", "WJEC"];
export const DEFAULT_BOARD = "AQA";

export const SK_PERSONAL = (u) => "gcse:ps:" + u.replace(/\W/g, "-");
export const SK_UC = (u, sId) => "gcse:uc:" + u.replace(/\W/g, "-") + ":" + sId;

export const SK = {
  ACCOUNTS: "gcse:accounts",
  PROG: (u) => `gcse:prog:${u.replace(/\W/g, "-")}`,
  PREFS: (u) => `gcse:prefs:${u.replace(/\W/g, "-")}`,
  CUSTOM: (sId, b) => `gcse:c:${sId}:${b}`,
  EXTRAS: (sId, b) => `gcse:e:${sId}:${b}`,
  PAPERS: (sId, b) => `gcse:p:${sId}:${b}`,
  TIMETABLE: (u) => `gcse:tt:${u.replace(/\W/g, "-")}`,
  FRIENDS: (u) => `gcse:fr:${u.replace(/\W/g, "-")}`,
  FREQS: (u) => `gcse:frq:${u.replace(/\W/g, "-")}`,
};

export const SK_SESSION = (u) => `gcse:session:${u.replace(/\W/g, "-")}`;
export const SK_JOURNAL = (u, sId) => `gcse:journal:${u.replace(/\W/g, "-")}:${sId}`;
export const SK_CALIBRATION = (u, sId) => `gcse:cal:${u.replace(/\W/g, "-")}:${sId}`;
export const SK_ERROR_PATTERNS = (u, sId) => `gcse:errorPatterns:${(u || "").replace(/\W/g, "-")}:${sId || ""}`;
export const SK_GRAPH = (u, sId) => `gcse:graph:${(u || "").replace(/\W/g, "-")}:${sId}`;
export const SK_SVG_ASSETS = (u) => `gcse:svgAssets:${(u || "").replace(/\W/g, "-")}`;

export function calcBrierScore(predictions) {
  if (!predictions || !predictions.length) return null;
  const sum = predictions.reduce((acc, p) => acc + Math.pow(p.pred - p.outcome, 2), 0);
  return sum / predictions.length;
}

export function confToProb(conf) {
  if (conf === 1) return 0.2;
  if (conf === 2) return 0.5;
  if (conf === 3) return 0.85;
  return 0.5;
}

export function detectErrorType(questionText, studentAnswer, markScheme, missedPoints) {
  var q = (questionText || "").toLowerCase();
  var a = (studentAnswer || "").toLowerCase();
  var ms = ((markScheme || "") + " " + (missedPoints || []).join(" ")).toLowerCase();
  var cmdWords = ["describe", "explain", "compare", "evaluate", "analyse", "calculate", "justify", "assess"];
  var hasCmd = cmdWords.some(function (w) { return q.includes(w); });
  var keyTerms = (ms.match(/\b[a-z]{5,}\b/g) || []).slice(0, 10);
  var termHits = keyTerms.filter(function (t) { return a.includes(t); }).length;
  if (keyTerms.length > 3 && termHits <= 1) return "Knowledge Gap";
  if (hasCmd && /(state|list|define)\b/.test(a) && /(explain|evaluate|compare|assess|justify)/.test(q)) return "Command Word Error";
  if (a.length > 40 && /(because|therefore|so|leads to|results? in)/.test(a) && termHits >= 2 && (missedPoints || []).length > 0) return "Application Error";
  if (a.length < 25 || !/[.!?]/.test(studentAnswer || "")) return "Communication Error";
  return "Knowledge Gap";
}

export function incrementErrorPattern(user, subjectId, type) {
  if (!user || !subjectId || !type || typeof window === "undefined") return null;
  try {
    var key = SK_ERROR_PATTERNS(user, subjectId);
    var cur = JSON.parse(localStorage.getItem(key) || "{}");
    var base = { "Knowledge Gap": 0, "Application Error": 0, "Command Word Error": 0, "Communication Error": 0 };
    var next = { ...base, ...cur, [type]: (cur[type] || 0) + 1 };
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  } catch (_) {
    return null;
  }
}

export function getDominantErrorPattern(user, subjectId) {
  if (!user || !subjectId || typeof window === "undefined") return null;
  try {
    var obj = JSON.parse(localStorage.getItem(SK_ERROR_PATTERNS(user, subjectId)) || "{}");
    var vals = Object.entries({
      "Knowledge Gap": obj["Knowledge Gap"] || 0,
      "Application Error": obj["Application Error"] || 0,
      "Command Word Error": obj["Command Word Error"] || 0,
      "Communication Error": obj["Communication Error"] || 0,
    });
    var total = vals.reduce((a, v) => a + v[1], 0);
    if (total < 10) return null;
    vals.sort((a, b) => b[1] - a[1]);
    return { type: vals[0][0], pct: Math.round((vals[0][1] / total) * 100), total };
  } catch (_) {
    return null;
  }
}

export function getStrategyRecommendation(subj, allSections, fcHist, calibData, timetableExams, stats) {
  return getSubjectStrategy(subj, allSections, fcHist, calibData, timetableExams, stats);
}

const hashPw = (s) => btoa(encodeURIComponent(s)).slice(0, 32);
export const ADMIN_PASS_HASH = hashPw("ReviseIQAdmin");
export const ADMIN_SCHOOL = "Gordon's School";
