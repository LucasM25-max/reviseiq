import React, { useState } from "react";
import { computeNextBestActions } from "./learningEngine.js";
import { B, C, mu, tx } from "./ui.jsx";

export function TodayWidget({
  D,
  subjects,
  allSections,
  fcHist,
  stats,
  timetableExams,
  boardSels,
  onNavigateSection,
  onNavigateBlurt,
  onMock,
}) {
  const [expanded, setExpanded] = useState(false);
  const plan = computeNextBestActions({
    subjects,
    allSections,
    stats,
    fcHist,
    timetableExams,
  });
  const finalItems = plan.map(function (item) {
    if (item.kind === "flashcards") {
      const subj = subjects.find(function (s) {
        return s.id === item.subjectId;
      });
      const sec = allSections.find(function (s) {
        return s.id === item.sectionId;
      });
      return {
        emoji: "\u{1F9E0}",
        text: item.label,
        sub: item.subtitle,
        color: subj ? subj.accent : "var(--riq-accent)",
        action: function () {
          if (sec) onNavigateSection(sec, "flashcards");
        },
      };
    }
    if (item.kind === "questions") {
      const subj = subjects.find(function (s) {
        return s.id === item.subjectId;
      });
      const sec = allSections.find(function (s) {
        return s.id === item.sectionId;
      });
      return {
        emoji: "\u270D\uFE0F",
        text: item.label,
        sub: item.subtitle,
        color: subj ? subj.accent : "#ef4444",
        action: function () {
          if (sec) onNavigateSection(sec, "questions");
        },
      };
    }
    if (item.kind === "exam") {
      const sec = item.sectionId
        ? allSections.find(function (s) {
            return s.id === item.sectionId;
          })
        : null;
      return {
        emoji: "\u{1F525}",
        text: item.label,
        sub: sec ? "Blurting: " + sec.title : item.subtitle,
        color:
          item.days <= 3 ? "#ef4444" : item.days <= 7 ? "#f59e0b" : "#10b981",
        action: function () {
          if (sec) onNavigateBlurt(item.subjectId, sec.id);
          else onMock();
        },
      };
    }
    return {
      emoji: "\u{1F4DD}",
      text: "Take a mock exam",
      sub: "Simulate real exam conditions",
      color: "var(--riq-accent)",
      action: onMock,
    };
  });
  if (
    !finalItems.some(function (i) {
      return i.text !== "Take a mock exam";
    })
  )
    return null;

  const txc = D ? "#eef1fb" : "#0f1729";
  const muc = D ? "#98a2bd" : "#5b6478";
  const cardBg = D ? "rgba(255,255,255,.04)" : "#ffffff";
  const hairline = D ? "rgba(255,255,255,.08)" : "rgba(16,24,40,.07)";

  const hero = finalItems[0];
  const maxVisible = expanded ? finalItems.length : 3;
  const rest = finalItems.slice(1, maxVisible);
  const moreAvailable = finalItems.length > maxVisible;
  const moreCount = Math.min(3, finalItems.length - 3);

  const wrap = { display: "flex", flexDirection: "column", gap: 14 };
  const head = { display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" };
  const headTitle = { fontSize: 19, fontWeight: 800, color: txc, letterSpacing: "-.01em", fontFamily: "var(--riq-display, inherit)" };
  const headSub = { fontSize: 13, color: muc, fontWeight: 600 };

  const heroCard = {
    position: "relative", overflow: "hidden", textAlign: "left", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 16, width: "100%",
    padding: "20px 22px", borderRadius: 20, border: "1px solid " + hairline,
    background: "linear-gradient(135deg, rgba(var(--riq-accent-rgb),.16), rgba(var(--riq-primary-3-rgb),.10))",
    boxShadow: "0 18px 40px -24px rgba(var(--riq-accent-rgb),.55)",
    transition: "transform .18s cubic-bezier(.22,1,.36,1), box-shadow .18s ease",
  };
  const heroBadge = {
    flexShrink: 0, width: 56, height: 56, borderRadius: 16, display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 28,
    background: D ? "rgba(255,255,255,.06)" : "#fff",
    boxShadow: "0 6px 18px -8px " + (hero.color || "var(--riq-accent)"),
  };
  const heroBody = { flex: 1, minWidth: 0 };
  const heroKicker = { fontSize: 11.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--riq-accent)", marginBottom: 4 };
  const heroText = { fontSize: 17, fontWeight: 800, color: txc, lineHeight: 1.25 };
  const heroSub = { fontSize: 13.5, color: muc, marginTop: 3, fontWeight: 600 };
  const heroCta = {
    flexShrink: 0, alignSelf: "center", fontSize: 14, fontWeight: 800, color: "#fff",
    padding: "10px 16px", borderRadius: 12, whiteSpace: "nowrap", border: "none",
    background: "linear-gradient(135deg, var(--riq-accent), var(--riq-primary-3))",
    boxShadow: "0 10px 22px -10px rgba(var(--riq-accent-rgb),.8)",
  };

  const list = { display: "flex", flexDirection: "column", gap: 8 };
  const rowBtn = { display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", cursor: "pointer", padding: "13px 16px", borderRadius: 14, border: "1px solid " + hairline, background: cardBg, transition: "transform .16s cubic-bezier(.22,1,.36,1), border-color .16s ease" };
  const rowEmoji = { flexShrink: 0, fontSize: 20, width: 30, textAlign: "center" };
  const rowBody = { flex: 1, minWidth: 0 };
  const rowText = { fontSize: 14.5, fontWeight: 700, color: txc, display: "flex", gap: 7, alignItems: "baseline" };
  const rowSub = { fontSize: 12.5, color: muc, marginTop: 2 };
  const numStyle = function (c) { return { fontSize: 12.5, fontWeight: 800, color: c }; };
  const chevStyle = function (c) { return { flexShrink: 0, fontSize: 18, color: c, fontWeight: 700 }; };
  const moreBtn = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", cursor: "pointer", padding: "12px 16px", borderRadius: 14, border: "1.5px dashed " + hairline, background: "transparent", color: muc, fontSize: 13.5, fontWeight: 700, transition: "border-color .16s ease, color .16s ease" };
  const moreSpan = { fontWeight: 800, color: "var(--riq-accent)" };

  return (
    <div style={wrap}>
      <div style={head}>
        <span style={headTitle}>Today</span>
        <span style={headSub}>Your focused plan</span>
      </div>

      <button
        onClick={hero.action}
        style={heroCard}
        onMouseEnter={function (e) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 26px 50px -22px rgba(var(--riq-accent-rgb),.7)";
        }}
        onMouseLeave={function (e) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "0 18px 40px -24px rgba(var(--riq-accent-rgb),.55)";
        }}
      >
        <div style={heroBadge}>{hero.emoji}</div>
        <div style={heroBody}>
          <div style={heroKicker}>Start here</div>
          <div style={heroText}>{hero.text}</div>
          <div style={heroSub}>{hero.sub}</div>
        </div>
        <span style={heroCta}>Start →</span>
      </button>

      {rest.length > 0 ? (
        <div style={list}>
          {rest.map(function (item, i) {
            return (
              <button
                key={i}
                onClick={item.action}
                style={rowBtn}
                onMouseEnter={function (e) {
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.transform = "translateX(2px)";
                }}
                onMouseLeave={function (e) {
                  e.currentTarget.style.borderColor = hairline;
                  e.currentTarget.style.transform = "";
                }}
              >
                <div style={rowEmoji}>{item.emoji}</div>
                <div style={rowBody}>
                  <div style={rowText}>
                    <span style={numStyle(item.color)}>{i + 2}.</span>
                    {item.text}
                  </div>
                  <div style={rowSub}>{item.sub}</div>
                </div>
                <span style={chevStyle(item.color)}>→</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {moreAvailable ? (
        <button
          onClick={function () { setExpanded(true); }}
          style={moreBtn}
          onMouseEnter={function (e) { e.currentTarget.style.borderColor = "var(--riq-accent)"; e.currentTarget.style.color = "var(--riq-accent)"; }}
          onMouseLeave={function (e) { e.currentTarget.style.borderColor = hairline; e.currentTarget.style.color = muc; }}
        >
          Ready for more?
          <span style={moreSpan}>
            +{moreCount} more task{moreCount === 1 ? "" : "s"} →
          </span>
        </button>
      ) : null}
    </div>
  );
}

export function PracticeSessionScreen({
  D,
  session,
  onBack,
  onOpenBlock,
  onComplete,
  onReset,
}) {
  const [done, setDone] = React.useState({});
  const blocks = session?.blocks || [];

  const completeCount = blocks.filter((b) => done[b.id]).length;
  const pct = blocks.length
    ? Math.round((completeCount / blocks.length) * 100)
    : 0;
  const bd2 = D ? "#262844" : "#e5e7eb";
  function toggleDone(id) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const finished = blocks.length > 0 && blocks.every((b) => next[b.id]);
      if (finished) onComplete && onComplete();
      return next;
    });
  }
  return (
    <div
      style={{
        minHeight: "100vh",
        background: D ? "radial-gradient(1200px 820px at 12% -12%, rgba(var(--riq-accent-rgb),.20), transparent 60%), radial-gradient(1000px 720px at 102% 4%, rgba(var(--riq-primary-3-rgb),.14), transparent 55%), radial-gradient(900px 700px at 50% 120%, rgba(59,130,246,.10), transparent 55%), #0a0a14" : "radial-gradient(1100px 780px at 10% -10%, rgba(var(--riq-accent-rgb),.10), transparent 60%), radial-gradient(940px 660px at 104% 2%, rgba(var(--riq-primary-3-rgb),.08), transparent 55%), radial-gradient(820px 640px at 50% 116%, rgba(59,130,246,.06), transparent 55%), #f6f6fc",
        color: tx(D),
      }}
      className="fade-in"
    >
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px" }}>
        <button
          onClick={onBack}
          style={{
            fontSize: 13,
            color: mu(D),
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 18,
          }}
        >
          {" "}
          Back
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          {session?.missionTitle || "Guided Session"}
        </h2>
        <p style={{ fontSize: 13, color: mu(D), marginBottom: 16 }}>
          {session?.missionSubtitle || "Complete yourrecommended study blocks."}
        </p>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: D ? "#191a2b" : "#e5e7eb",
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              height: "100%",
              width: pct + "%",
              background: "var(--riq-accent)",
              transition: "width .25sease",
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: mu(D), marginBottom: 18 }}>
          {completeCount}/{blocks.length}
          blocks complete
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {blocks.map((b, idx) => (
            <div
              key={b.id}
              style={{
                ...C(D),
                padding: 14,
                borderColor: done[b.id] ? "#16a34a" : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: mu(D), marginBottom: 4 }}>
                    Block {idx + 1} · {b.etaMin}
                    min
                  </div>
                  <div
                    style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}
                  >
                    {b.title}
                  </div>

                  <div style={{ fontSize: 12, color: mu(D) }}>{b.detail}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => onOpenBlock && onOpenBlock(b)}
                    style={{
                      ...B("var(--riq-accent)", false, {
                        fontSize: 12,
                        padding: "7px 12px",
                      }),
                    }}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => toggleDone(b.id)}
                    style={{
                      ...B(
                        done[b.id] ? "#16a34a" : "transparent",
                        !done[b.id],
                        {
                          fontSize: 12,
                          padding: "7px 12px",
                          borderColor: done[b.id] ? "#16a34a" : bd2,
                          color: done[b.id] ? "#fff" : mu(D),
                        },
                      ),
                    }}
                  >
                    {done[b.id] ? "Done" : "Mark done"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            onClick={onReset}
            style={{
              ...B("transparent", true, {
                padding: "10px 14px",
                fontSize: 13,
                borderColor: bd2,
                color: mu(D),
              }),
            }}
          >
            Regenerate Plan
          </button>
          <button
            onClick={onBack}
            style={{
              ...B("#111827", false, { padding: "10px 14px", fontSize: 13 }),
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
