import { _cleanText } from "./cards.jsx";
import { isCardDue } from "./fsrs.js";
import { stripHtml, uid } from "./ui.jsx";

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function calcStreak(activityDates) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (activityDates.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function calcLongestStreak(activityDates) {
  if (!activityDates.size) return 0;
  const sorted = [...activityDates].sort();
  let best = 1,
    cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]),
      curr = new Date(sorted[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) {
      cur++;
      best = Math.max(best, cur);
    } else cur = 1;
  }
  return best;
}

export function inferDifficulty(q) {
  if (q?.difficulty >= 1 && q?.difficulty <= 5) return q.difficulty;
  var m = Number(q?.marks || 1);
  var t = (q?.text || "").toLowerCase();
  var d = m >= 8 ? 5 : m >= 6 ? 4 : m >= 4 ? 3 : m >= 2 ? 2 : 1;
  if (/evaluate|assess|justify/.test(t)) d = Math.min(5, d + 1);
  if (/describe|explain|analyse|compare/.test(t)) d = Math.min(5, d + 0.5);
  return Math.max(1, Math.min(5, Math.round(d)));
}

export function selectAdaptiveQuestions(list, user, subjectId) {
  var arr = (list || []).map(function (q) {
    return { ...q, difficulty: inferDifficulty(q) };
  });
  if (!user || !subjectId) return arr;
  try {
    var key =
      "gcse:difficultyLevel:" + user.replace(/\W/g, "-") + ":" + subjectId;
    var lv = Number(localStorage.getItem(key) || 3);
    if (!lv) lv = 3;
    var easy = arr.filter((q) => q.difficulty < lv),
      mid = arr.filter((q) => q.difficulty === lv),
      hard = arr.filter((q) => q.difficulty > lv);
    var pick = [],
      max = Math.min(20, arr.length);
    while (pick.length < max && (easy.length || mid.length || hard.length)) {
      var r = Math.random();
      var pool = r < 0.2 ? easy : r < 0.9 ? mid : hard;
      if (!pool.length) pool = mid.length ? mid : hard.length ? hard : easy;
      if (!pool.length) break;
      pick.push(pool.shift());
    }
    return pick.length ? pick : arr;
  } catch (_) {
    return arr;
  }
}

export function updateAdaptiveLevel(user, subjectId, isCorrect) {
  if (!user || !subjectId) return;
  try {
    var kH =
      "gcse:difficultyHist:" + user.replace(/\W/g, "-") + ":" + subjectId;
    var hist = JSON.parse(localStorage.getItem(kH) || "[]");
    hist = [...hist.slice(-19), isCorrect ? 1 : 0];
    localStorage.setItem(kH, JSON.stringify(hist));
    var acc = hist.reduce((a, b) => a + b, 0) / Math.max(hist.length, 1);
    var key =
      "gcse:difficultyLevel:" + user.replace(/\W/g, "-") + ":" + subjectId;
    var lv = Number(localStorage.getItem(key) || 3) || 3;
    if (acc >= 0.7) lv = Math.min(5, lv + 1);
    else if (acc < 0.45) lv = Math.max(1, lv - 1);
    localStorage.setItem(key, String(lv));
  } catch (_) {}
}

export function getLadderLevel(user, topicId) {
  if (!user || !topicId) return 1;
  try {
    return Math.max(
      1,
      Math.min(
        5,
        Number(
          localStorage.getItem(
            "gcse:ladder:" + user.replace(/\W/g, "-") + ":" + topicId,
          ) || 1,
        ) || 1,
      ),
    );
  } catch (_) {
    return 1;
  }
}

export function updateLadderLevel(user, topicId, correct) {
  if (!user || !topicId) return 1;
  var cur = getLadderLevel(user, topicId);
  var next = Math.max(1, Math.min(5, cur + (correct ? 1 : -1)));

  try {
    localStorage.setItem(
      "gcse:ladder:" + user.replace(/\W/g, "-") + ":" + topicId,
      String(next),
    );
  } catch (_) {}
  return next;
}

export function verifyExplanation(content, studentExplanation) {
  if (
    typeof window !== "undefined" &&
    typeof window.verifyExplanation === "function"
  ) {
    try {
      return window.verifyExplanation(content, studentExplanation);
    } catch (_) {}
  }
  var c = _cleanText(stripHtml(content || ""));
  var s = _cleanText(studentExplanation || "");
  var kws = [...new Set(c.split(" ").filter((w) => w.length > 4))].slice(0, 10);
  var hit = kws.filter((k) => s.includes(k));
  return {
    correct: s.length > 30 ? "You explained key ideas clearly." : "Good start.",
    missing:
      hit.length < Math.max(2, Math.floor(kws.length / 3))
        ? "Add detail on:" + kws.slice(0, 3).join(", ")
        : "Add one concrete example.",
  };
}

export function generateTransferQuestion(originalQuestion) {
  if (
    typeof window !== "undefined" &&
    typeof window.generateTransferQuestion === "function"
  ) {
    try {
      return window.generateTransferQuestion(originalQuestion);
    } catch (_) {}
  }
  var q = { ...(originalQuestion || {}) };
  var t = (q.text || "").replace(/\b(\d+)\b/g, function (m) {
    return String(Number(m) + 1);
  });
  return {
    ...q,
    id: "tr-" + uid(),
    text: "Apply It: " + (t || "Use this idea in a new context."),
    _transfer: true,
  };
}

export function getWeekKey(d) {
  var dt = new Date(d || Date.now());
  var onejan = new Date(dt.getFullYear(), 0, 1);
  var day = Math.floor((dt - onejan) / 86400000);
  return dt.getFullYear() + "-W" + Math.ceil((day + onejan.getDay() + 1) / 7);
}

export function generateWeeklyPlan(
  user,
  subjects,
  allSections,
  fcHist,
  stats,
  timetableExams,
) {
  var week = getWeekKey();
  var key = "gcse:weeklyPlan:" + (user || "").replace(/\W/g, "-") + ":" + week;
  try {
    var ex = JSON.parse(localStorage.getItem(key) || "null");
    if (ex && Array.isArray(ex)) return;
  } catch (_) {}
  var due = allSections.flatMap((s) =>
    (s.flashcards || [])
      .filter((c) => isCardDue(fcHist, c.id))
      .map(() => s.title),
  ).slice(0, 3);
  var weak = Object.entries(stats?.weakQ || {})
    .sort((a, b) => (b[1]?.wrong || 0) - (a[1]?.wrong || 0))
    .slice(0, 3).map((x) => x[0]);
  var examSoon = (timetableExams || [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  var base = [
    "Review due flashcards" + (due[0] ? " (" + due[0] + ")" : ""),
    "Do 10 mixedquestions" + (weak[0] ? " on " + weak[0] : ""),
    examSoon
      ? "Exam prep for" + (examSoon.label || "upcoming exam")
      : "Revise weakest topic",
  ];
  var days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  var plan = days.map(function (d, i) {
    return { day: d, tasks: [base[i % base.length]] };
  });
  try {
    localStorage.setItem(key, JSON.stringify(plan));
  } catch (_) {}
  return plan;
}

export function generateSessionOptions(user, subjectId, allSections, stats, fcHist) {
  var secs = allSections.filter((s) => s.subjectId === subjectId);
  var due = secs.find((s) =>
    (s.flashcards || []).some((c) => isCardDue(fcHist, c.id)),
  );
  var weakId = Object.entries(stats?.weakQ || {}).sort(
    (a, b) => (b[1]?.wrong || 0) - (a[1]?.wrong || 0),
  )[0]?.[0];
  var weak = secs.find((s) => s.id === weakId) || secs[0];
  return [
    {
      title: "Due Card Sprint",
      description: "Clear due flashcards in " + (due?.title || "thistopic"),
      action: { type: "flashcards", sectionId: due?.id },
    },
    {
      title: "Weak Spot Drill",
      description: "Target weaker questions in " + (weak?.title || "yourtopic"),
      action: { type: "questions", sectionId: weak?.id },
    },
    {
      title: "Mixed Focus",
      description: "Blend flashcards + exam questions",
      action: { type: "target" },
    },
    {
      title: "Interleaved Session",
      description: "Round-robin mixed topics for strongertransfer",
      action: { type: "interleaved", subjectId: subjectId },
    },
  ];
}

export function getVariantStorageKey(user, cardId) {
  return (
    "gcse:variants:" +
    String(user || "anon").replace(/\W/g, "-") +
    ":" +
    String(cardId || "")
  );
}

export function simpleParaphrase(text) {
  var s = String(text || "");
  var map = {
    explain: "describe",
    describe: "outline",
    define: "stateclearly",
    because: "since",
    therefore: "so",
    important: "significant",
    process: "sequence",
    increase: "rise",
    decrease: "fall",
    difference: "distinction",
    causes: "leadsto",
    effect: "impact",
  };
  Object.keys(map).forEach(function (k) {
    var re = new RegExp("\\b" + k + "\\b", "gi");
    s = s.replace(re, function (m) {
      return m === m.toUpperCase() ? map[k].toUpperCase() : map[k];
    });
  });
  return s;
}

export async function generateParaphrasedCard(card) {
  var base = String(card?.q || card?.text || "");

  if (!base.trim()) return "";
  if (
    typeof window !== "undefined" &&
    typeof window.generateParaphrase === "function"
  ) {
    try {
      var ai = await window.generateParaphrase(base, card);
      if (ai && String(ai).trim()) return String(ai).trim();
    } catch (_) {}
  }
  return simpleParaphrase(base);
}

export function readCardVariants(user, cardId) {
  try {
    var arr = JSON.parse(
      localStorage.getItem(getVariantStorageKey(user, cardId)) || "[]",
    );
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

export async function ensureCardVariantCached(user, card, reviewCount, stability) {
  if (!card || reviewCount < 3 || Number(stability || 0) <= 7) return null;
  var existing = readCardVariants(user, card.id);
  if (existing.length) return existing[0];
  var text = await generateParaphrasedCard(card);
  if (!text || text.trim() === String(card.q || card.text || "").trim())
    return null;
  var variant = { text: text, createdAt: new Date().toISOString() };
  try {
    localStorage.setItem(
      getVariantStorageKey(user, card.id),
      JSON.stringify([variant]),
    );
  } catch (_) {}
  return variant;
}

export function maybeUseVariantText(user, card, reviewCount, stability) {
  if (!card || reviewCount < 3 || Number(stability || 0) <= 7) return null;
  var variants = readCardVariants(user, card.id);
  if (!variants.length) return null;
  var p = Math.random();
  if (p < 0.3 || p > 0.5) return null;
  return variants[0]?.text || null;
}

export function generateInterleavedSession(subjectId, allSections) {
  var secs = (allSections || []).filter(function (s) {
    return s.subjectId === subjectId;
  });
  var byTopic = {};
  secs.forEach(function (sec) {
    var t = sec.topicId || sec.id;
    if (!byTopic[t]) byTopic[t] = [];
    (sec.flashcards || []).forEach(function (c) {
      byTopic[t].push({
        kind: "flashcard",
        sectionId: sec.id,
        topicId: t,
        item: c,
      });
    });

    (sec.questions || []).forEach(function (q) {
      byTopic[t].push({
        kind: "question",
        sectionId: sec.id,
        topicId: t,
        item: q,
      });
    });
  });
  var topicIds = Object.keys(byTopic)
    .filter(function (t) {
      return byTopic[t].length > 0;
    })
    .slice(0, 8);
  if (topicIds.length < 3) return [];
  var idx = 0;
  var out = [];
  var lastTopic = null;
  var guard = 0;
  while (guard < 2000) {
    guard++;
    var nonEmpty = topicIds.filter(function (t) {
      return byTopic[t] && byTopic[t].length;
    });
    if (!nonEmpty.length) break;
    var pick = nonEmpty[idx % nonEmpty.length];
    idx++;
    if (pick === lastTopic && nonEmpty.length > 1) {
      pick =
        nonEmpty.find(function (t) {
          return t !== lastTopic;
        }) || pick;
    }
    var next = (byTopic[pick] || []).shift();
    if (!next) continue;
    out.push(next);
    lastTopic = pick;
  }
  return out;
}
