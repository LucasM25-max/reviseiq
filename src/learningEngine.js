// Unified learning-domain primitives and orchestration utilities.
// Phase 1 foundation: centralize cross-feature decision logic so
// screens consume one engine instead of duplicating heuristics.

function safeNum(n, d = 0) {
  return Number.isFinite(Number(n)) ? Number(n) : d;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function getSectionDueCount(section, fcHist = {}, nowTs = Date.now()) {
  const cards = (section && section.flashcards) || [];
  return cards.reduce((acc, c) => {
    const st = fcHist[c.id];
    if (!st || !st.due || nowTs >= st.due) return acc + 1;
    return acc;
  }, 0);
}

export function getQuestionAccuracy(sectionId, stats = {}) {
  const wq = (stats.weakQ && stats.weakQ[sectionId]) || null;
  if (!wq || !safeNum(wq.total)) return null;
  const total = safeNum(wq.total);
  const wrong = safeNum(wq.wrong);
  const score = Math.max(0, total - wrong);
  return total > 0 ? Math.round((score / total) * 100) : null;
}

export function computeSectionCompetency(section, stats = {}, fcHist = {}, nowTs = Date.now()) {
  const cards = (section.flashcards || []).length;
  const due = getSectionDueCount(section, fcHist, nowTs);
  const reviewed = (section.flashcards || []).filter(c => fcHist && fcHist[c.id]).length;
  const memoryPct = cards > 0 ? Math.round(((cards - due) / cards) * 100) : null;
  const coveragePct = cards > 0 ? Math.round((reviewed / cards) * 100) : null;
  const questionPct = getQuestionAccuracy(section.id, stats);

  const parts = [memoryPct, questionPct, coveragePct].filter(v => v != null);
  const competency = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;

  return {
    sectionId: section.id,
    memoryPct,
    questionPct,
    coveragePct,
    competency,
    dueCards: due,
    cardCount: cards,
    questionCount: (section.questions || []).length,
  };
}

export function getUrgentExam(timetableExams = [], nowTs = Date.now()) {
  let urgent = null;
  let minDays = Infinity;
  timetableExams.forEach(exam => {
    const dt = new Date((exam.date || "") + "T00:00:00");
    const diff = Math.round((dt.getTime() - nowTs) / 86400000);
    if (diff >= 0 && diff < minDays) {
      minDays = diff;
      urgent = exam;
    }
  });
  return urgent ? { exam: urgent, days: minDays } : null;
}

export function computeSubjectSnapshot(subject, allSections = [], stats = {}, fcHist = {}, timetableExams = [], nowTs = Date.now()) {
  const sections = allSections.filter(s => s.subjectId === subject.id);
  const competency = sections.map(sec => computeSectionCompetency(sec, stats, fcHist, nowTs));
  const dueCards = competency.reduce((a, c) => a + c.dueCards, 0);
  const avgCompetency = competency.length
    ? Math.round(competency.reduce((a, c) => a + c.competency, 0) / competency.length)
    : 0;
  const weakSection = [...competency]
    .filter(c => c.questionPct != null)
    .sort((a, b) => a.questionPct - b.questionPct)[0] || null;
  const urgent = getUrgentExam((timetableExams || []).filter(e => e.subjectId === subject.id), nowTs);

  return {
    subjectId: subject.id,
    dueCards,
    avgCompetency,
    weakSectionId: weakSection ? weakSection.sectionId : null,
    weakQuestionPct: weakSection ? weakSection.questionPct : null,
    examDays: urgent ? urgent.days : null,
  };
}

export function computeNextBestActions({ subjects = [], allSections = [], stats = {}, fcHist = {}, timetableExams = [], nowTs = Date.now() }) {
  const actions = [];

  // 1) Highest due-card load first.
  const dueBySubject = subjects
    .map(s => {
      const sections = allSections.filter(sec => sec.subjectId === s.id);
      const due = sections.reduce((a, sec) => a + getSectionDueCount(sec, fcHist, nowTs), 0);
      return { subject: s, due, sections };
    })
    .filter(x => x.due > 0)
    .sort((a, b) => b.due - a.due);

  if (dueBySubject[0]) {
    const top = dueBySubject[0];
    const bestSec = [...top.sections]
      .map(sec => ({ sec, due: getSectionDueCount(sec, fcHist, nowTs) }))
      .sort((a, b) => b.due - a.due)[0]?.sec || null;
    actions.push({
      kind: 'flashcards',
      priority: 100,
      subjectId: top.subject.id,
      sectionId: bestSec ? bestSec.id : null,
      label: `Review ${top.due} due ${top.subject.name} flashcards`,
      subtitle: bestSec ? bestSec.title : top.subject.name,
    });
  }

  // 2) Weakest question section.
  const weakSections = allSections
    .map(sec => ({ sec, pct: getQuestionAccuracy(sec.id, stats) }))
    .filter(x => x.pct != null)
    .sort((a, b) => a.pct - b.pct);

  if (weakSections[0]) {
    const wk = weakSections[0];
    actions.push({
      kind: 'questions',
      priority: 90,
      subjectId: wk.sec.subjectId,
      sectionId: wk.sec.id,
      label: `Practice questions: ${wk.sec.title}`,
      subtitle: `Weakest area · ${wk.pct}% accuracy`,
    });
  }

  // 3) Urgent exam prep.
  const urgent = getUrgentExam(timetableExams, nowTs);
  if (urgent) {
    actions.push({
      kind: 'exam',
      priority: urgent.days <= 3 ? 95 : urgent.days <= 7 ? 85 : 70,
      subjectId: urgent.exam.subjectId,
      sectionId: urgent.exam.sectionId || null,
      examId: urgent.exam.id,
      days: urgent.days,
      label: `Exam prep: ${urgent.exam.label || 'Upcoming exam'}`,
      subtitle: urgent.days === 0 ? 'Exam today' : urgent.days === 1 ? 'Exam tomorrow' : `Exam in ${urgent.days} days`,
    });
  }

  if (!actions.length) {
    actions.push({
      kind: 'mock',
      priority: 50,
      label: 'Take a mock exam',
      subtitle: 'Simulate exam conditions',
    });
  }

  return actions.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

export function buildTodaySessionPlan({ subjects = [], allSections = [], stats = {}, fcHist = {}, timetableExams = [], nowTs = Date.now() }) {
  const actions = computeNextBestActions({ subjects, allSections, stats, fcHist, timetableExams, nowTs });
  const blocks = actions.map((a, idx) => {
    if (a.kind === "flashcards") return { id: `b${idx}`, type: "flashcards", title: a.label, detail: a.subtitle, etaMin: 12, ...a };
    if (a.kind === "questions") return { id: `b${idx}`, type: "questions", title: a.label, detail: a.subtitle, etaMin: 15, ...a };
    if (a.kind === "exam") return { id: `b${idx}`, type: "blurting", title: a.label, detail: a.subtitle, etaMin: 12, ...a };
    return { id: `b${idx}`, type: "mock", title: "Take a mock exam", detail: "Exam simulation block", etaMin: 25, ...a };
  });

  const totalEta = blocks.reduce((a, b) => a + b.etaMin, 0);
  const primary = blocks[0] || { type: "mock", title: "Take a mock exam", detail: "No urgent actions detected", etaMin: 25 };

  return {
    generatedAt: nowTs,
    missionTitle: "Today's Guided Session",
    missionSubtitle: `Complete ${blocks.length} focused block${blocks.length !== 1 ? "s" : ""} (${totalEta} min est.)`,
    primaryBlock: primary,
    totalEta,
    blocks,
  };
}

// Phase 3: calibrate flashcard quality ratings with metacognitive signals.
// This discourages "easy" marks when retrieval required heavy hints or long latency.
export function calibrateFlashcardRating({ rating = 3, confidence = null, hintLevel = 0, latencySec = 0 }) {
  let adjusted = clamp(Math.round(safeNum(rating, 3)), 1, 4);
  const flags = [];

  if (safeNum(hintLevel, 0) >= 2 && adjusted > 1) {
    adjusted -= 1;
    flags.push("hint_penalty");
  }
  if (safeNum(latencySec, 0) > 30 && adjusted > 1) {
    adjusted -= 1;
    flags.push("latency_penalty");
  }
  if (confidence === 1 && adjusted >= 4) {
    adjusted = 3;
    flags.push("confidence_cap");
  }

  return {
    rating: clamp(adjusted, 1, 4),
    flags,
  };
}

// Phase 3: lightweight skill vector extraction for question analysis.
export function getQuestionSkillVector(questionText = "", type = "short") {
  const q = String(questionText || "").toLowerCase();
  const has = (arr) => arr.some(w => q.includes(w));
  const commandWord =
    has(["evaluate", "assess", "to what extent"]) ? "evaluation" :
    has(["analyse", "examine"]) ? "analysis" :
    has(["explain", "why"]) ? "explanation" :
    has(["compare", "contrast"]) ? "comparison" :
    has(["describe", "state", "define", "list"]) ? "recall" :
    "application";

  const responseType = type === "mcq" ? "objective" : (type === "extended" ? "extended" : "constructed");

  return { commandWord, responseType };
}

export function buildTutorPedagogyPolicy(mode = "tutor") {
  if (mode === "homework") {
    return [
      "Pedagogy policy:",
      "1) Ask 1-2 diagnostic questions before giving steps.",
      "2) Give hint-first scaffolding, not final answers first.",
      "3) If the student asks for full answer, provide a worked solution only after they attempt.",
      "4) Keep each response concise and actionable.",
    ].join("\\n");
  }
  return [
    "Pedagogy policy:",
    "1) Start with retrieval prompts before explanation where possible.",
    "2) Use exam-board command words and model thinking steps.",
    "3) End with a short self-check question.",
    "4) Avoid giving complete essays unless explicitly requested after an attempt.",
  ].join("\\n");
}

function _extractFirstJson(raw = "") {
  const txt = String(raw || "").trim();
  if (!txt) return null;
  const fence = "`" + "`" + "`";
  const clean = txt.split(fence + "json").join("").split(fence).join("").trim();
  const objS = clean.indexOf("{");
  const objE = clean.lastIndexOf("}");
  const arrS = clean.indexOf("[");
  const arrE = clean.lastIndexOf("]");
  if (objS >= 0 && objE > objS) {
    try { return JSON.parse(clean.slice(objS, objE + 1)); } catch (_) {}
  }
  if (arrS >= 0 && arrE > arrS) {
    try { return JSON.parse(clean.slice(arrS, arrE + 1)); } catch (_) {}
  }
  try { return JSON.parse(clean); } catch (_) {}
  return null;
}

export function buildAiServiceInstruction(serviceName, ctx = {}) {
  if (serviceName === "answer_marker") {
    return "Return ONLY valid JSON: " +
      "{\"score\":0,\"feedback\":\"2-3 sentences\",\"missedPoints\":[\"point\"],\"modelAnswer\":\"ideal answer\",\"examTip\":\"one exam tip\"}";
  }
  if (serviceName === "blurt_analyser") {
    return "Return ONLY valid JSON: " +
      "{\"remembered\":[\"point\"],\"missed\":[\"point\"],\"partial\":[\"point\"],\"feedback\":\"2 short sentences\",\"score\":75}";
  }
  if (serviceName === "tutor_followups") {
    return "Return ONLY a JSON array of 3 short follow-up questions (max 9 words each).";
  }
  return ctx?.fallbackInstruction || "Return concise, helpful output.";
}

export function normalizeAiServiceOutput(serviceName, rawText, ctx = {}) {
  const parsed = _extractFirstJson(rawText);
  if (serviceName === "tutor_followups") {
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, 3)
      .map(v => String(v || "").trim())
      .filter(Boolean)
      .map(v => v.slice(0, 70));
  }
  if (serviceName === "answer_marker") {
    const scoreCap = Math.max(1, safeNum(ctx.maxMarks, 1));
    const src = parsed && typeof parsed === "object" ? parsed : {};
    const score = clamp(Math.round(safeNum(src.score, 0)), 0, scoreCap);
    const missed = Array.isArray(src.missedPoints)
      ? src.missedPoints.map(x => String(x || "").trim()).filter(Boolean).slice(0, 8)
      : [];
    return {
      score,
      feedback: String(src.feedback || "No marking feedback returned.").trim(),
      missedPoints: missed,
      modelAnswer: String(src.modelAnswer || "").trim(),
      examTip: String(src.examTip || "Review the command word and include explicit key terms.").trim(),
      annotatedAnswer: Array.isArray(src.annotatedAnswer) ? src.annotatedAnswer : null,
      structureDiagram: Array.isArray(src.structureDiagram) ? src.structureDiagram : null,
      comparisonTable: Array.isArray(src.comparisonTable) ? src.comparisonTable : null,
      workedSolution: src.workedSolution || null,
    };
  }
  if (serviceName === "blurt_analyser") {
    const src = parsed && typeof parsed === "object" ? parsed : {};
    const list = (v) => Array.isArray(v) ? v.map(x => String(x || "").trim()).filter(Boolean).slice(0, 12) : [];
    return {
      remembered: list(src.remembered),
      missed: list(src.missed),
      partial: list(src.partial),
      feedback: String(src.feedback || "Good effort — now fill the main missing points and try again.").trim(),
      score: clamp(Math.round(safeNum(src.score, 0)), 0, 100),
    };
  }
  return parsed;
}

export function getAiServiceFallback(serviceName, ctx = {}) {
  if (serviceName === "tutor_followups") {
    return [
      "Can you test me with one question?",
      "Give me a hint, not the answer",
      "What should I revise next?",
    ];
  }
  if (serviceName === "answer_marker") {
    return {
      score: 0,
      feedback: "ReviseIQ AI is temporarily unavailable. Self-mark against the mark scheme and resubmit.",
      missedPoints: [],
      modelAnswer: "",
      examTip: "Use the command word and include precise keywords from the topic.",
      annotatedAnswer: null,
      structureDiagram: null,
      comparisonTable: null,
      workedSolution: null,
    };
  }
  if (serviceName === "blurt_analyser") {
    return {
      remembered: [],
      missed: [],
      partial: [],
      feedback: "AI analysis is unavailable. Compare your blurt to notes and list 3 missed points.",
      score: 0,
    };
  }
  return ctx.defaultValue ?? null;
}

export function getSubjectStrategy(subj, allSections = [], fcHist = {}, calibrationData = [], timetableExams = [], stats = {}) {
  const snapshot = computeSubjectSnapshot(subj, allSections, stats, fcHist, timetableExams);
  const brier = Array.isArray(calibrationData) && calibrationData.length
    ? calibrationData.reduce((a, p) => a + Math.pow((safeNum(p.pred, 0.5) - safeNum(p.outcome, 0)), 2), 0) / calibrationData.length
    : null;

  if (snapshot.dueCards > 0 && snapshot.avgCompetency < 55) {
    return {
      strategy: 'flashcards',
      title: 'Spaced Repetition',
      icon: '🃏',
      color: '#6366f1',
      reason: `${snapshot.dueCards} cards due and competency is still building.`,
    };
  }
  if (brier != null && brier > 0.25) {
    return {
      strategy: 'blurting',
      title: 'Blurting Exercise',
      icon: '🧠',
      color: '#d97706',
      reason: 'Confidence calibration is off. Use free recall to expose gaps.',
    };
  }
  if (snapshot.examDays != null && snapshot.examDays <= 14) {
    return {
      strategy: 'questions',
      title: 'Exam Practice',
      icon: '✏️',
      color: '#ef4444',
      reason: `Exam in ${snapshot.examDays} day${snapshot.examDays !== 1 ? 's' : ''}. Prioritise timed questions.`,
    };
  }
  if (snapshot.weakQuestionPct != null && snapshot.weakQuestionPct < 55) {
    return {
      strategy: 'weak',
      title: 'Weak Topic Drill',
      icon: '🎯',
      color: '#dc2626',
      reason: `Lowest question accuracy is ${snapshot.weakQuestionPct}%.`,
    };
  }
  return {
    strategy: 'mixed',
    title: 'Mixed Revision',
    icon: '🔀',
    color: '#10b981',
    reason: 'Maintain retention with mixed cards, questions, and retrieval.',
  };
}
