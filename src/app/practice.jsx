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
        emoji: " ",
        text: item.label,
        sub: item.subtitle,
        color: subj ? subj.accent : "#6366f1",
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
        emoji: " ",
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
        emoji: " ",
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
      emoji: " ",
      text: "Take a mock exam",
      sub: "Simulate real examconditions",
      color: "#6366f1",
      action: onMock,
    };
  });
  if (
    !finalItems.some(function (i) {
      return i.text !== "Take a mock exam";
    })
  )
    return null;

  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 16 }}> </span>

        <span style={{ fontSize: 14, fontWeight: 700 }}>
          What to revise today
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {finalItems.map(function (item, i) {
          return (
            <button
              key={i}
              onClick={item.action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 12,
                background: D ? "#161b27" : "#fff",
                border: "1.5px solid " + (D ? "#2a3347" : "#e5e7eb"),
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "border-color .15s,transform.1s",
              }}
              onMouseEnter={function (e) {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={function (e) {
                e.currentTarget.style.borderColor = D ? "#2a3347" : "#e5e7eb";
                e.currentTarget.style.transform = "";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: item.color + "22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {item.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: D ? "#e8ecf4" : "#111827",
                    marginBottom: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      color: item.color,
                      marginRight: 5,
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}.
                  </span>
                  {item.text}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: D ? "#9ca3af" : "#6b7280",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.sub}
                </div>
              </div>
              <span
                style={{ fontSize: 12, color: item.color, flexShrink: 0 }}
              ></span>
            </button>
          );
        })}
      </div>
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
  const bd2 = D ? "#2a3347" : "#e5e7eb";
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
        background: D ? "#0f1117" : "#f9fafb",
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
            background: D ? "#1e2537" : "#e5e7eb",
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              height: "100%",
              width: pct + "%",
              background: "#6366f1",
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
                      ...B("#6366f1", false, {
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
                          padding: "7px12px",
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
                padding: "10px14px",
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
              ...B("#111827", false, { padding: "10px14px", fontSize: 13 }),
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
