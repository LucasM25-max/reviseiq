import React from "react";
import { calcBrierScore } from "./coreHelpers.js";
import { fsrsRetrievability } from "./fsrs.js";
import { C, mu } from "./ui.jsx";

export function calculateMastery(subjectId, allSections, fcHist, stats) {
  const secs = allSections.filter((s) => s.subjectId === subjectId);

  const allCards = secs.flatMap((s) => s.flashcards || []);
  const fcMastered = allCards.filter((c) => {
    const st = fcHist[c.id];
    return st && st.stability > 14;
  }).length;
  const fcMastery =
    allCards.length > 0 ? Math.round((fcMastered / allCards.length) * 100) : 0;

  const ss = stats.subjStats && stats.subjStats[subjectId];
  const questionAccuracy =
    ss && ss.qM > 0 ? Math.round((ss.qS / ss.qM) * 100) : 0;

  const totalTopics = secs.length;
  const coveredTopics = secs.filter((s) => {
    const hasFC = (s.flashcards || []).some((c) => fcHist[c.id] != null);
    const wq = stats.weakQ && stats.weakQ[s.id];
    return hasFC || (wq && wq.total > 0);
  }).length;
  const coverage =
    totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;
  const masteredTopics = secs.filter((s) => {
    const secCards = s.flashcards || [];
    const secFcM =
      secCards.length > 0
        ? (secCards.filter((c) => {
            const st = fcHist[c.id];
            return st && st.stability > 14;
          }).length /
            secCards.length) *
          100
        : 80;
    const wq = stats.weakQ && stats.weakQ[s.id];
    const secQA =
      wq && wq.total > 0
        ? Math.round(((wq.total - wq.wrong) / wq.total) * 100)
        : 80;
    return secFcM >= 80 && secQA >= 80;
  }).length;
  return {
    flashcardMastery: fcMastery,
    questionAccuracy,
    coverage,
    masteredTopics,
    totalTopics,
  };
}

export function calculateExamReadiness(
  subjectId,
  allSections,
  fcHist,
  stats,
  calibData,
  timetableExams,
) {
  const secs = allSections.filter((s) => s.subjectId === subjectId);
  const allCards = secs.flatMap((s) => s.flashcards || []);

  let retSum = 0,
    retCount = 0;

  allCards.forEach((c) => {
    const st = fcHist[c.id];
    if (st && st.stability) {
      const el = (Date.now() - (st.lastReview || Date.now())) / 86400000;
      retSum += fsrsRetrievability(st.stability, el);
      retCount++;
    }
  });
  const fsrsRet = retCount > 0 ? Math.round((retSum / retCount) * 100) : 40;

  const ss = stats.subjStats && stats.subjStats[subjectId];
  const qAcc = ss && ss.qM > 0 ? Math.round((ss.qS / ss.qM) * 100) : 40;

  const totalTopics = secs.length;
  const covered = secs.filter((s) => {
    const wq = stats.weakQ && stats.weakQ[s.id];
    return (s.flashcards || []).some((c) => fcHist[c.id]) || (wq && wq.total > 0);
  }).length;
  const coverage =
    totalTopics > 0 ? Math.round((covered / totalTopics) * 100) : 40;

  const brier =
    calibData && calibData.length >= 3 ? calcBrierScore(calibData) : null;
  const calScore =
    brier != null ? Math.max(0, Math.round((1 - brier / 0.35) * 100)) : 50;

  const mockScore = 50;

  const distributed = allCards.filter((c) => {
    const st = fcHist[c.id];
    return st && st.interval > 1;
  }).length;
  const spacedScore =
    allCards.length > 0
      ? Math.round((distributed / allCards.length) * 100)
      : 40;
  const score = Math.round(
    fsrsRet * 0.25 +
      qAcc * 0.2 +
      coverage * 0.15 +
      calScore * 0.15 +
      mockScore * 0.15 +
      spacedScore * 0.1,
  );

  const components = [
    { name: "FSRS retention", val: fsrsRet, w: 0.25 },
    { name: "question accuracy", val: qAcc, w: 0.2 },
    { name: "topic coverage", val: coverage, w: 0.15 },
    { name: "calibration", val: calScore, w: 0.15 },
    { name: "spaced practice", val: spacedScore, w: 0.1 },
  ];
  const weakest = [...components].sort((a, b) => a.val - b.val)[0];
  const grade =
    score >= 90
      ? "9"
      : score >= 80
        ? "8"
        : score >= 70
          ? "7"
          : score >= 60
            ? "6"
            : score >= 50
              ? "5"
              : score >= 40
                ? "4"
                : "3";
  const insight = `Score ${score}/100 — on track for Grade ${grade}. Focus on ${weakest.name}
(${weakest.val}%) to improve.`;
  return {
    score,
    breakdown: { fsrsRet, qAcc, coverage, calScore, spacedScore },
    insight,
  };
}

export const ACHIEVEMENTS = [
  {
    id: "first_card",
    title: "First Steps",
    icon: "👣",
    desc: "Complete your first flashcard review",
  },
  {
    id: "first_session",
    title: "Session Starter",
    icon: "🚀",
    desc: "Complete your first timed studysession",
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    icon: "🔥",
    desc: "Maintain a 7-day study streak",
  },
  {
    id: "streak_30",
    title: "Monthly Master",
    icon: "📆",
    desc: "Maintain a 30-day study streak",
  },
  {
    id: "cards_100",
    title: "Centurion",
    icon: "💯",
    desc: "Review 100 flashcards",
  },
  {
    id: "perfect_cal",
    title: "Mind Reader",
    icon: "🔮",
    desc: "Achieve Brier score below 0.15",
  },
  {
    id: "all_rings",
    title: "Triple Crown",
    icon: "👑",
    desc: "All three mastery rings reach 80%+",
  },
  {
    id: "mastery_topic",
    title: "Topic Expert",
    icon: "🎓",
    desc: "Fully master your first topic",
  },
  {
    id: "questions_50",
    title: "Practice Makes Perfect",
    icon: "✍️",
    desc: "Answer 50 examquestions",
  },
  {
    id: "readiness_80",
    title: "Exam Ready",
    icon: "✅",
    desc: "Achieve Exam Readiness scoreof 80+",
  },
];

export function checkNewAchievements(
  existingIds,
  stats,
  fcHist,
  allSections,
  calibData,
  streak,
  subjects,
) {
  const earned = [];
  const has = (id) => existingIds.includes(id);
  const totalFCReviewed = Object.keys(fcHist).length;
  const totalQ = stats.qM || 0;
  if (!has("first_card") && totalFCReviewed > 0) earned.push("first_card");
  if (!has("streak_7") && streak >= 7) earned.push("streak_7");
  if (!has("streak_30") && streak >= 30) earned.push("streak_30");
  if (!has("cards_100") && totalFCReviewed >= 100) earned.push("cards_100");
  if (!has("questions_50") && totalQ >= 50) earned.push("questions_50");
  const allCalScores = Object.values(calibData || {}).flat();
  if (
    !has("perfect_cal") &&
    allCalScores.length >= 10 &&
    calcBrierScore(allCalScores) < 0.15
  )
    earned.push("perfect_cal");

  for (const s of subjects) {
    const m = calculateMastery(s.id, allSections, fcHist, stats);
    if (!has("mastery_topic") && m.masteredTopics > 0)
      earned.push("mastery_topic");
    if (
      !has("all_rings") &&
      m.flashcardMastery >= 80 &&
      m.questionAccuracy >= 80 &&
      m.coverage >= 80
    )
      earned.push("all_rings");
  }
  return [...new Set(earned)];
}

export function MasteryRings({ mastery, accent, size = 60, D }) {
  const { flashcardMastery: fm, questionAccuracy: qa, coverage: cov } = mastery;
  const rings = [
    { pct: fm, color: "#6366f1", r: 26, label: "FC" },
    { pct: qa, color: "#10b981", r: 18, label: "Q" },
    { pct: cov, color: "#f59e0b", r: 10, label: "Cv" },
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      style={{ flexShrink: 0 }}
    >
      {rings.map(({ pct, color, r }) => {
        const circ = 2 * Math.PI * r;
        const dash = circ * (pct / 100);
        return (
          <g key={r}>
            <circle
              cx={30}
              cy={30}
              r={r}
              fill="none"
              stroke={D ? "#2a3347" : "#e5e7eb"}
              strokeWidth={4}
            />
            <circle
              cx={30}
              cy={30}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={4}
              strokeDasharray={circ}
              strokeDashoffset={circ - dash}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
              style={{ transition: "stroke-dashoffset .6s ease" }}
            />
          </g>
        );
      })}
      <text
        x={30}
        y={34}
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
        fill={D ? "#e8ecf4" : "#111827"}
      >
        {Math.round((fm + qa + cov) / 3)}%
      </text>
    </svg>
  );
}

export function MasteryPanel({ D, mastery, subjectName }) {
  const {
    flashcardMastery: fm,
    questionAccuracy: qa,
    coverage: cov,
    masteredTopics: mt,
    totalTopics: tt,
  } = mastery;
  const rings = [
    {
      label: "Flashcard Mastery",
      val: fm,
      color: "#6366f1",
      icon: "🗂️",
      desc: `Cards with stability >14
days`,
    },
    {
      label: "Question Accuracy",
      val: qa,
      color: "#10b981",
      icon: "🎯",
      desc: `First-attempt question
scores`,
    },
    {
      label: "Topic Coverage",
      val: cov,
      color: "#f59e0b",
      icon: "📚",
      desc: `Topics with any review
activity`,
    },
  ];
  const allGreen = fm >= 80 && qa >= 80 && cov >= 80;
  return (
    <div style={{ ...C(D), padding: 20, marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>
            Mastery Meter
          </h3>
          <p style={{ fontSize: 11, color: mu(D), margin: "2px 0 0" }}>
            {mt}/{tt} topics fully mastered
          </p>
        </div>
        {allGreen && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: "#dcfce7",
              color: "#15803d",
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            Subject Mastered!
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rings.map((r) => (
          <div key={r.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: D ? "#e8ecf4" : "#374151",
                }}
              >
                {r.icon}
                {r.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color:
                    r.val >= 80
                      ? "#10b981"
                      : r.val >= 50
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              >
                {r.val}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 6,
                background: D ? "#2a3347" : "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 6,
                  background: r.color,
                  width: r.val + "%",
                  transition: "width .8sease",
                }}
              />
            </div>
            {r.val < 80 && (
              <p style={{ fontSize: 10, color: mu(D), margin: "3px 0 0" }}>
                {r.desc}
              </p>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          fontSize: 10,
          color: mu(D),
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            background: "#6366f122",
            color: "#6366f1",
            padding: "2px 7px",
            borderRadius: 8,
          }}
        >
          Flashcards
        </span>
        <span
          style={{
            background: "#10b98122",
            color: "#10b981",
            padding: "2px 7px",
            borderRadius: 8,
          }}
        >
          Questions
        </span>
        <span
          style={{
            background: "#f59e0b22",
            color: "#d97706",
            padding: "2px 7px",
            borderRadius: 8,
          }}
        >
          Coverage
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontWeight: 600,
            color: allGreen ? "#10b981" : mu(D),
          }}
        >
          All 3 ≥ 80% to master
        </span>
      </div>
    </div>
  );
}

export function ExamReadinessGauge({ D, readiness, subjectName, accent }) {
  const { score, breakdown, insight } = readiness;
  const col =
    score >= 80
      ? "#10b981"
      : score >= 60
        ? "#6366f1"
        : score >= 40
          ? "#f59e0b"
          : "#ef4444";
  const r = 40,
    circ = 2 * Math.PI * r,
    arc = circ * 0.75;
  const dash = arc * (score / 100);
  const offset = circ * 0.125;
  return (
    <div style={{ ...C(D), padding: 20, marginBottom: 16 }}>
      <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        Exam Readiness
      </h3>
      <p style={{ fontSize: 11, color: mu(D), marginBottom: 14 }}>
        Combined score across all revision dimensions
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flexShrink: 0, position: "relative" }}>
          <svg width={100} height={100} viewBox="0 0 100 100">
            <circle
              cx={50}
              cy={50}
              r={r}
              fill="none"
              stroke={D ? "#2a3347" : "#e5e7eb"}
              strokeWidth={8}
              strokeDasharray={`${arc} ${circ - arc}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
            <circle
              cx={50}
              cy={50}
              r={r}
              fill="none"
              stroke={col}
              strokeWidth={8}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray .8s ease" }}
            />
            <text
              x={50}
              y={48}
              textAnchor="middle"
              fontSize={20}
              fontWeight={800}
              fill={col}
            >
              {score}
            </text>
            <text
              x={50}
              y={62}
              textAnchor="middle"
              fontSize={9}
              fill={D ? "#9ca3af" : "#6b7280"}
            >
              / 100
            </text>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: D ? "#d1d5db" : "#374151",
              marginBottom: 10,
            }}
          >
            {insight}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { l: "FSRS retention", v: breakdown.fsrsRet, w: "25%" },
              { l: "Question accuracy", v: breakdown.qAcc, w: "20%" },
              { l: "Coverage", v: breakdown.coverage, w: "15%" },
              { l: "Calibration", v: breakdown.calScore, w: "15%" },
              { l: "Spaced practice", v: breakdown.spacedScore, w: "10%" },
            ].map((item) => (
              <div
                key={item.l}
                style={{ display: "flex", gap: 6, alignItems: "center" }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: mu(D),
                    width: 90,
                    flexShrink: 0,
                  }}
                >
                  {item.l}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 4,
                    background: D ? "#2a3347" : "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 4,
                      background: col,
                      width: item.v + "%",
                      transition: "width .6s",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: mu(D),
                    width: 28,
                    textAlign: "right",
                  }}
                >
                  {item.v}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AchievementToast({ achievement, D, onClose }) {
  const def = ACHIEVEMENTS.find((a) => a.id === achievement) || {
    icon: "🏅",
    title: achievement,
    desc: "",
  };
  return (
    <div
      className="slide-up"
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        color: "#fff",
        borderRadius: 16,
        padding: "14px 20px",
        minWidth: 260,
        maxWidth: 340,
        boxShadow: "0 12px 40px rgba(99,102,241,.4)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 32, flexShrink: 0 }}>{def.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            opacity: 0.8,
            marginBottom: 2,
          }}
        >
          Achievement Unlocked!
        </div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{def.title}</div>
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>
          {def.desc}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "rgba(255,255,255,.2)",
          border: "none",
          color: "#fff",
          borderRadius: "50%",
          width: 24,
          height: 24,
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function TrophyGrid({ D, achievementIds }) {
  if (!achievementIds || !achievementIds.length)
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: mu(D) }}>
        <p style={{ fontSize: 28, marginBottom: 6 }}> </p>
        <p style={{ fontSize: 13 }}>
          No achievements yet — keep studying to unlock them!
        </p>
      </div>
    );
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
        gap: 10,
      }}
    >
      {ACHIEVEMENTS.map((a) => {
        const earned = achievementIds.includes(a.id);
        return (
          <div
            key={a.id}
            style={{
              ...C(D),
              padding: 14,
              textAlign: "center",
              opacity: earned ? 1 : 0.35,
              borderColor: earned ? "#6366f1" : undefined,
              transition: "opacity .2s",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: D ? "#e8ecf4" : "#111827",
                marginBottom: 2,
              }}
            >
              {a.title}
            </div>
            <div style={{ fontSize: 10, color: mu(D), lineHeight: 1.4 }}>
              {a.desc}
            </div>
            {earned && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 9,
                  color: "#6366f1",
                  fontWeight: 700,
                }}
              >
                EARNED
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
