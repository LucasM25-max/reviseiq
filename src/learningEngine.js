// Unified learning-domain primitives and orchestration utilities.
// Phase 1 foundation: centralize cross-feature decision logic so
// screens consume one engine instead of duplicating heuristics.
//
// Phase 3 additions:
//   - getPedagogicalContext()       — full LearningState snapshot for AI calls
//   - computeDerivedSocraticLevel() — auto-derive Socratic level from history
//   - selectCommandWordQuestions()  — surface questions by dominant error type
//   - computeCrossSubjectCalibration() — cross-subject Brier segmented by AO
//   - buildAISessionPrompt()        — structured prompt for AI session builder
//   - applyAISession()              — merge AI session response into blocks

function safeNum(n, d = 0) {
  return Number.isFinite(Number(n)) ? Number(n) : d;
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

// ─── PHASE 3 ADDITIONS ──────────────────────────────────────────────────────

/**
 * 3.2 getPedagogicalContext
 * Builds a full LearningState snapshot for reactive AI decision-making.
 * Called on every meaningful state change; consumed by home screen,
 * session builder, tutor, and the AI session personalisation endpoint.
 */
export function getPedagogicalContext({
  user,
  subjects = [],
  allSections = [],
  stats = {},
  fcHist = {},
  calibrationData = {},  // { subjectId: [{pred, outcome, ts}] }
  errorPatterns = {},    // { subjectId: { "Knowledge Gap": N, ... } }
  timetableExams = [],
  achievements = [],
  streak = 0,
  totalDaysStudied = 0,
  nowTs = Date.now(),
}) {
  // Per-subject snapshots
  const subjectSnapshots = subjects.map(s =>
    computeSubjectSnapshot(s, allSections, stats, fcHist, timetableExams, nowTs)
  );

  // Global due count
  const totalDue = subjectSnapshots.reduce((a, s) => a + s.dueCards, 0);

  // Cross-subject Brier score
  const allPreds = Object.values(calibrationData).flat();
  const globalBrier = allPreds.length >= 5
    ? allPreds.reduce((a, p) => a + Math.pow(safeNum(p.pred, 0.5) - safeNum(p.outcome, 0), 2), 0) / allPreds.length
    : null;

  // Dominant error type across all subjects
  const globalErrors = { "Knowledge Gap": 0, "Application Error": 0, "Command Word Error": 0, "Communication Error": 0 };
  Object.values(errorPatterns).forEach(ep => {
    Object.keys(globalErrors).forEach(k => { globalErrors[k] += safeNum(ep[k]); });
  });
  const errorTotal = Object.values(globalErrors).reduce((a, b) => a + b, 0);
  const dominantErrorType = errorTotal >= 10
    ? Object.entries(globalErrors).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Urgent exam
  const urgent = getUrgentExam(timetableExams, nowTs);

  // Weakest subject by competency
  const weakestSubject = [...subjectSnapshots]
    .filter(s => s.avgCompetency > 0)
    .sort((a, b) => a.avgCompetency - b.avgCompetency)[0] || null;

  // Strongest subject (for interleaving contrast)
  const strongestSubject = [...subjectSnapshots]
    .filter(s => s.avgCompetency > 0)
    .sort((a, b) => b.avgCompetency - a.avgCompetency)[0] || null;

  // Cross-subject calibration insight (3.5)
  const crossSubjectInsight = computeCrossSubjectCalibration(subjects, calibrationData, allSections, stats);

  return {
    user,
    nowTs,
    streak,
    totalDaysStudied,
    totalDue,
    globalBrier,
    dominantErrorType,
    urgentExam: urgent,
    weakestSubject,
    strongestSubject,
    subjectSnapshots,
    crossSubjectInsight,
    achievementCount: achievements.length,
    hasEnoughData: totalDaysStudied >= 3 || stats.qM >= 10 || Object.keys(fcHist).length >= 15,
  };
}

/**
 * 3.2 computeDerivedSocraticLevel
 * Auto-derives the appropriate Socratic level (0=direct, 1=guided, 2=full Socratic)
 * based on conversation depth, student performance, and calibration quality.
 * Replaces the ad-hoc message-count heuristic in AITutorScreen.
 *
 * @param {number} userMessageCount   — number of user messages in current conversation
 * @param {number|null} questionPct   — question accuracy for the selected section (0-100)
 * @param {number|null} brierScore    — calibration Brier score for the subject
 * @param {boolean} isHomeworkMode    — if true, always use guided (level 1)
 * @returns {0|1|2}
 */
export function computeDerivedSocraticLevel(
  userMessageCount = 0,
  questionPct = null,
  brierScore = null,
  isHomeworkMode = false
) {
  if (isHomeworkMode) return 1;

  // New conversation — start fully Socratic to elicit prior knowledge
  if (userMessageCount < 4) return 2;

  // Student is struggling (low accuracy) — ease off probing, give more direct help
  if (questionPct != null && questionPct < 40) return 0;

  // Student is overconfident (high Brier) — maintain Socratic to surface gaps
  if (brierScore != null && brierScore > 0.22) return 2;

  // Mid-conversation with reasonable performance — guided mode
  if (userMessageCount >= 4 && userMessageCount < 12) return 1;

  // Long conversation — student has been retrieval-practising; give direct answers
  return 0;
}

/**
 * 3.4 selectCommandWordQuestions
 * Given a pool of questions and an error pattern map, returns questions
 * prioritised to target the student's dominant error type.
 *
 * Dominant error → preferred command words:
 *   Knowledge Gap    → state, name, define, describe
 *   Application Error → calculate, suggest, predict, apply
 *   Command Word Error → explain, evaluate, assess, justify, compare
 *   Communication Error → extended responses requiring structured prose
 *
 * @param {Array}  questions       — raw question array for a section
 * @param {Object} errorPatterns   — { "Knowledge Gap": N, "Application Error": N, ... }
 * @param {number} [limit=20]
 * @returns {Array} reordered questions, dominant-type first
 */
export function selectCommandWordQuestions(questions = [], errorPatterns = {}, limit = 20) {
  if (!questions.length) return [];

  const total = Object.values(errorPatterns).reduce((a, b) => a + safeNum(b), 0);
  if (total < 5) return questions.slice(0, limit); // not enough data — use default order

  const dominant = Object.entries(errorPatterns).sort((a, b) => safeNum(b[1]) - safeNum(a[1]))[0][0];

  const commandWordSets = {
    "Knowledge Gap":      /\b(state|name|identify|define|give|list|what is|what are)\b/i,
    "Application Error":  /\b(calculate|suggest|predict|apply|work out|find the|show|use|estimate)\b/i,
    "Command Word Error": /\b(explain|evaluate|assess|justify|compare|analyse|discuss|to what extent|how far)\b/i,
    "Communication Error": null, // target extended questions (high mark)
  };

  const targetPattern = commandWordSets[dominant];

  const score = q => {
    const text = (q.text || "").toLowerCase();
    if (dominant === "Communication Error") {
      return q.type === "extended" || safeNum(q.marks) >= 6 ? 2 : 0;
    }
    if (targetPattern && targetPattern.test(text)) return 2;
    return 0;
  };

  return [...questions]
    .map(q => ({ q, s: score(q) }))
    .sort((a, b) => b.s - a.s)
    .map(x => x.q)
    .slice(0, limit);
}

/**
 * 3.5 computeCrossSubjectCalibration
 * Segments Brier scores by AO level across subjects, then surfaces
 * a single actionable cross-subject insight if a pattern is detected.
 *
 * Returns null if insufficient data, or an object:
 *   { insight: string, affectedSubjects: string[], weakAO: string, recommendation: string }
 */
export function computeCrossSubjectCalibration(subjects = [], calibrationData = {}, allSections = [], stats = {}) {
  // Build per-AO Brier scores across all subjects
  // We tag calibration entries with ao if available; otherwise we infer from section accuracy
  const aoAccuracy = { AO1: [], AO2: [], AO3: [] };

  subjects.forEach(s => {
    const secs = allSections.filter(sec => sec.subjectId === s.id);
    secs.forEach(sec => {
      const pct = getQuestionAccuracy(sec.id, stats);
      if (pct == null) return;

      // Classify section by question type distribution
      const qs = sec.questions || [];
      const extCount = qs.filter(q => q.type === "extended" || safeNum(q.marks) >= 6).length;
      const mcqCount = qs.filter(q => q.type === "mcq").length;
      const total = qs.length || 1;

      if (mcqCount / total > 0.6) aoAccuracy.AO1.push({ pct, subjectId: s.id });
      else if (extCount / total > 0.4) aoAccuracy.AO3.push({ pct, subjectId: s.id });
      else aoAccuracy.AO2.push({ pct, subjectId: s.id });
    });
  });

  const avgPct = arr => arr.length ? Math.round(arr.reduce((a, x) => a + x.pct, 0) / arr.length) : null;
  const ao1Avg = avgPct(aoAccuracy.AO1);
  const ao2Avg = avgPct(aoAccuracy.AO2);
  const ao3Avg = avgPct(aoAccuracy.AO3);

  // Need data in at least 2 AO bands
  const bands = [ao1Avg, ao2Avg, ao3Avg].filter(v => v != null);
  if (bands.length < 2) return null;

  const weakestBandPct = Math.min(...bands.filter(v => v != null));
  const weakAO =
    ao3Avg === weakestBandPct ? "AO3" :
    ao2Avg === weakestBandPct ? "AO2" : "AO1";

  const aoLabels = {
    AO1: "recall and knowledge (AO1)",
    AO2: "application and analysis (AO2)",
    AO3: "extended evaluation and argument (AO3)",
  };

  // Only surface if the gap is meaningful (≥15 points between best and worst)
  const strongestBandPct = Math.max(...bands.filter(v => v != null));
  if (strongestBandPct - weakestBandPct < 15) return null;

  // Which subjects are affected (lowest quartile in the weak band)
  const affected = (aoAccuracy[weakAO] || [])
    .filter(x => x.pct < weakestBandPct + 10)
    .map(x => x.subjectId)
    .filter((v, i, a) => a.indexOf(v) === i);

  const affectedNames = affected
    .map(id => subjects.find(s => s.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3);

  const recommendations = {
    AO1: "Use blurting and flashcard review to cement core knowledge before attempting application questions.",
    AO2: "Practise 'suggest', 'calculate', and 'explain' questions. Focus on linking cause to effect with 'because' and 'therefore'.",
    AO3: "Prioritise extended writing practice. Use the Exam Coach to build evaluate and assess responses with a clear judgement.",
  };

  return {
    insight: `Your ${aoLabels[weakAO]} score (${weakestBandPct}%) lags your ${aoLabels[weakAO === "AO3" ? (ao2Avg > ao1Avg ? "AO1" : "AO2") : "AO3"]} score by ${strongestBandPct - weakestBandPct} points across ${affectedNames.length > 1 ? "multiple subjects" : (affectedNames[0] || "your subjects")}.`,
    affectedSubjects: affectedNames,
    weakAO,
    weakPct: weakestBandPct,
    recommendation: recommendations[weakAO],
  };
}

/**
 * 3.3 buildAISessionPrompt
 * Builds a structured prompt for the AI personalised session endpoint.
 * Called by buildAIPersonalisedSession() when the student has enough data.
 *
 * @param {Object} ctx  — output of getPedagogicalContext()
 * @param {Array}  allSections
 * @param {Object} stats
 * @param {Object} fcHist
 * @returns {string} prompt string
 */
export function buildAISessionPrompt(ctx, allSections = [], stats = {}, fcHist = {}) {
  const weakSec = ctx.weakestSubject
    ? allSections.find(s => s.id === ctx.weakestSubject.weakSectionId)
    : null;

  const urgentLine = ctx.urgentExam
    ? `Exam in ${ctx.urgentExam.days} days: ${ctx.urgentExam.exam.label || "upcoming exam"}.`
    : "No urgent exams.";

  const errorLine = ctx.dominantErrorType
    ? `Dominant error type: ${ctx.dominantErrorType}.`
    : "No dominant error pattern yet.";

  const calibLine = ctx.globalBrier != null
    ? `Global calibration Brier score: ${ctx.globalBrier.toFixed(3)} (${ctx.globalBrier < 0.15 ? "good" : ctx.globalBrier < 0.25 ? "moderate" : "overconfident"}).`
    : "Calibration data insufficient.";

  const crossLine = ctx.crossSubjectInsight
    ? `Cross-subject insight: ${ctx.crossSubjectInsight.insight}`
    : "";

  return `You are an evidence-based GCSE revision planner. Design a 25-minute study session for this student.

STUDENT PROFILE:
- Streak: ${ctx.streak} days
- Total days studied: ${ctx.totalDaysStudied}
- Total flashcards due now: ${ctx.totalDue}
- ${urgentLine}
- ${errorLine}
- ${calibLine}
${crossLine ? "- " + crossLine : ""}

WEAKEST AREA: ${ctx.weakestSubject ? ctx.weakestSubject.subjectId + " (competency: " + ctx.weakestSubject.avgCompetency + "%)" : "unknown"}
STRONGEST AREA: ${ctx.strongestSubject ? ctx.strongestSubject.subjectId + " (competency: " + ctx.strongestSubject.avgCompetency + "%)" : "unknown"}

TASK: Return ONLY valid JSON — no markdown, no backticks:
{
  "sessionTitle": "short motivating title",
  "sessionRationale": "1-sentence explanation of why this session design helps this student",
  "blocks": [
    {
      "type": "flashcards|questions|blurting|mock|interleaved",
      "subjectId": "subject id string",
      "sectionId": "section id or null",
      "title": "block title",
      "detail": "specific instruction for the student",
      "etaMin": 5,
      "priority": "high|medium|low",
      "targetCommandWords": ["evaluate", "explain"]  // optional, for question blocks
    }
  ],
  "interleaveStrategy": "none|alternating|spaced",
  "closingTip": "one concrete exam technique tip related to their dominant error"
}

Rules:
- 2-4 blocks totalling 20-30 minutes
- If dominant error is Command Word Error, at least one block must target evaluate/assess/justify questions
- If calibration is poor (Brier > 0.25), include a blurting block
- If exam < 7 days, weight toward questions over flashcards
- First block should be the highest-leverage action`;
}

/**
 * 3.3 applyAISession
 * Validates and merges an AI-returned session object into the standard
 * buildTodaySessionPlan format. Gracefully falls back to rule-based plan
 * if the AI response is malformed.
 *
 * @param {Object|null} aiSession  — parsed JSON from AI
 * @param {Object}      fallback   — output of buildTodaySessionPlan()
 * @returns {Object}               — merged session object
 */
export function applyAISession(aiSession, fallback) {
  if (!aiSession || !Array.isArray(aiSession.blocks) || !aiSession.blocks.length) {
    return fallback;
  }

  const validTypes = ["flashcards", "questions", "blurting", "mock", "interleaved"];
  const validBlocks = aiSession.blocks
    .filter(b => b && validTypes.includes(b.type) && typeof b.title === "string")
    .map((b, i) => ({
      id: `ai-b${i}`,
      type: b.type,
      subjectId: b.subjectId || null,
      sectionId: b.sectionId || null,
      title: String(b.title || "").slice(0, 80),
      detail: String(b.detail || "").slice(0, 200),
      etaMin: Math.max(3, Math.min(30, safeNum(b.etaMin, 10))),
      priority: b.priority || "medium",
      targetCommandWords: Array.isArray(b.targetCommandWords) ? b.targetCommandWords.slice(0, 4) : [],
      _fromAI: true,
    }));

  if (!validBlocks.length) return fallback;

  const totalEta = validBlocks.reduce((a, b) => a + b.etaMin, 0);

  return {
    ...fallback,
    generatedAt: Date.now(),
    missionTitle: String(aiSession.sessionTitle || fallback.missionTitle).slice(0, 80),
    missionSubtitle: String(aiSession.sessionRationale || fallback.missionSubtitle).slice(0, 160),
    primaryBlock: validBlocks[0],
    totalEta,
    blocks: validBlocks,
    interleaveStrategy: aiSession.interleaveStrategy || "none",
    closingTip: typeof aiSession.closingTip === "string" ? aiSession.closingTip.slice(0, 200) : null,
    _aiPersonalised: true,
  };
}
