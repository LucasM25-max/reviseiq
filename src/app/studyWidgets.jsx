import React, { useState } from "react";
import { calcBrierScore, getStrategyRecommendation } from "./coreHelpers.js";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fsrsRetrievability, getCardState } from "./fsrs.js";
import { B, C, I, mu, tx } from "./ui.jsx";

export function PastPapersTab({
  papers = [],
  onAdd,
  onDelete,
  admin,
  D,
  accent,
  board,
  subjectName,
}) {
  const bd = D ? "#262844" : "#e5e7eb";
  return (
    <div className="fade-in">
      {admin && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 12,
            background: D ? "#1a1a2e" : "#f5f3ff",
            border: "1.5px solid #7c3aed",
            marginBottom: 18,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>
            ADMIN
          </span>

          <button
            onClick={onAdd}
            style={{
              ...B("#7c3aed", true, { fontSize: 12, padding: "5px 12px" }),
            }}
          >
            ＋ Add Past Paper
          </button>
        </div>
      )}
      {papers.length === 0 ? (
        <div style={{ ...C(D), padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 28, marginBottom: 10 }}> </p>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            {subjectName} · {board}
          </p>
          <p style={{ fontSize: 13, color: mu(D) }}>
            No past papers added yet.{admin ? " Add oneabove." : ""}
          </p>
        </div>
      ) : (
        <div style={{ ...C(D), overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ background: D ? "#191a2b" : "#f9fafb" }}>
                  {[
                    "Year / Paper",
                    "PastPaper",
                    "Mark Scheme",
                    "Examiner Report",
                    ...(admin ? [""] : []),
                  ].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: mu(D),
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        borderBottom: `1px solid ${bd}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {papers.map((row) => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: `1px solid ${bd}` }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = D
                        ? "#1c1d30"
                        : "#f9fafb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontWeight: 600,
                        color: tx(D),
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.year}
                      {row.title && (
                        <>
                          <br />
                          <span
                            style={{
                              fontSize: 11,
                              color: mu(D),
                              fontWeight: 400,
                            }}
                          >
                            {row.title}
                          </span>
                        </>
                      )}
                    </td>
                    {[
                      { url: row.paperUrl, label: "Paper" },
                      { url: row.markSchemeUrl, label: "MarkScheme" },
                      { url: row.examinerUrl, label: "Report" },
                    ].map(({ url, label }, ci) => (
                      <td key={ci} style={{ padding: "12px 16px" }}>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: accent,
                              textDecoration: "none",
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            {label}{" "}
                          </a>
                        ) : (
                          <span style={{ color: mu(D), fontSize: 12 }}>—</span>
                        )}
                      </td>
                    ))}
                    {admin && (
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => onDelete(row.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            color: "#ef4444",
                            opacity: 0.7,
                          }}
                        >
                          {" "}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function MasteryRing({ pct, size, accent }) {
  const r = (size || 32) / 2 - 4;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg
      width={size || 32}
      height={size || 32}
      style={{ flexShrink: 0, transform: "rotate(-90deg)" }}
    >
      <circle
        cx={(size || 32) / 2}
        cy={(size || 32) / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={3}
      />
      <circle
        cx={(size || 32) / 2}
        cy={(size || 32) / 2}
        r={r}
        fill="none"
        stroke={accent || "#10b981"}
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={circ - dash}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SRInfoTooltip({ D }) {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setShow((v) => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          color: "#7c3aed",
          padding: "0 2px",
          lineHeight: 1,
        }}
        title="About spaced repetition"
      >
        {" "}
      </button>
      {show && (
        <div
          onClick={() => setShow(false)}
          style={{ position: "fixed", inset: 0, zIndex: 8000 }}
        />
      )}
      {show && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% +6px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 8001,
            background: D ? "#191a2b" : "#fff",
            border: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
            borderRadius: 10,
            padding: "12px 14px",
            width: 260,
            boxShadow: "0 8px 32px rgba(0,0,0,.18)",
            fontSize: 12,
            lineHeight: 1.6,
            color: D ? "#e5e7eb" : "#374151",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, color: "#7c3aed" }}>
            Spaced Repetition
          </div>
          <p style={{ margin: 0 }}>
            The <strong>Ebbinghaus forgetting curve</strong> shows memory fades
            rapidly without review — SR schedules each card just before you
            forget it, compounding retention with every correct recall.
          </p>
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: D ? "#9ca3af" : "#6b7280",
            }}
          >
            Rate
            <em>Again</em> to see it soon · <em>Easy</em> to push it weeks away.
          </div>
        </div>
      )}
    </span>
  );
}

export function ForecastBar({ cards, fcHist, D, accent }) {
  const days = React.useMemo(() => {
    const arr = [];
    const now = Date.now();
    for (let i = 0; i < 14; i++) {
      const dayStart = now + i * 86400000;
      const dayEnd = dayStart + 86400000;
      const count = cards.filter((c) => {
        const s = getCardState(fcHist, c.id);
        if (!s) return i === 0;
        return s.due >= dayStart && s.due < dayEnd;
      }).length;
      const d = new Date(dayStart);
      arr.push({
        i,
        label:
          i === 0
            ? "Today"
            : i === 1
              ? "Tmrw"
              : d.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                }),
        count,
      });
    }
    return arr;
  }, [cards, fcHist]);
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div
      style={{
        marginTop: 10,
        padding: "10px 14px",
        borderRadius: 10,
        background: D ? "#13131f" : "#f9fafb",
        border: `1px solid ${D ? "#262844" : "#e5e7eb"}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: D ? "#9ca3af" : "#6b7280",
          marginBottom: 8,
        }}
      >
        14-day review forecast
      </div>
      <div
        style={{
          display: "flex",
          gap: 4,
          alignItems: "flex-end",
          height: 40,
          overflowX: "auto",
        }}
      >
        {days.map(({ i, label, count }) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              minWidth: 28,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color:
                  count > 0 ? accent || "#7c3aed" : D ? "#4b5563" : "#d1d5db",
                fontWeight: count > 0 ? 700 : 400,
              }}
            >
              {count || ""}
            </div>
            <div
              style={{
                width: "100%",
                borderRadius: 3,
                background:
                  count > 0 ? accent || "#7c3aed" : D ? "#262844" : "#e5e7eb",
                height: Math.max(4, Math.round((count / max) * 28)),
                transition: "height .2s",
                opacity: i === 0 ? 1 : 0.7,
              }}
            />
            <div
              style={{
                fontSize: 8,
                color: D ? "#8896b3" : "#9ca3af",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 28,
                textAlign: "center",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SessionGoalModal({ D, onStart, onSkip }) {
  const [goal, setGoal] = React.useState("");
  const [confidence, setConf] = React.useState(3);
  const [duration, setDuration] = React.useState(25);
  const times = [5, 10, 15, 25, 45, 60];
  const confLabels = ["Low", "Unsure", "OK", "Good", "High"];
  const bd2 = D ? "#374151" : "#e5e7eb";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.65)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      className="fade-in"
    >
      <div
        style={{
          background: D ? "#13131f" : "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 440,
          padding: 28,
          boxShadow: "0 30px 80px rgba(0,0,0,.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}> </div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: D ? "#e8ecf4" : "#111827",
              margin: 0,
            }}
          >
            Set Your Session Goal
          </h3>
          <p
            style={{
              fontSize: 12,
              color: D ? "#9ca3af" : "#6b7280",
              marginTop: 4,
            }}
          >
            30 seconds of planning = 30% better retention
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: D ? "#9ca3af" : "#6b7280",
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              What do you want to achieve?
            </label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Master photosynthesis equations"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1.5px solid ${bd2}`,
                background: D ? "#191a2b" : "#f9fafb",
                color: D ? "#e8ecf4" : "#111827",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: D ? "#9ca3af" : "#6b7280",
                display: "block",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              How confident do you feel right now?
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setConf(v)}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    borderRadius: 10,
                    border: `2px solid ${confidence === v ? "#7c3aed" : bd2}`,
                    background: confidence === v ? "#7c3aed" : "transparent",
                    color:
                      confidence === v ? "#fff" : D ? "#9ca3af" : "#6b7280",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: confidence === v ? 700 : 400,
                    transition: "all .12s",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#7c3aed",
                textAlign: "center",
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              {confLabels[confidence - 1]}
            </div>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: D ? "#9ca3af" : "#6b7280",
                display: "block",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Time available
            </label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {times.map((t) => (
                <button
                  key={t}
                  onClick={() => setDuration(t)}
                  style={{
                    flex: 1,
                    minWidth: 44,
                    padding: "8px 4px",
                    borderRadius: 9,
                    border: `2px solid ${duration === t ? "#7c3aed" : bd2}`,
                    background: duration === t ? "#7c3aed" : "transparent",
                    color: duration === t ? "#fff" : D ? "#9ca3af" : "#6b7280",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: duration === t ? 700 : 400,
                    transition: "all .12s",
                  }}
                >
                  {t}m
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 12,
              border: `1px solid ${bd2}`,
              background: "transparent",
              color: D ? "#9ca3af" : "#6b7280",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Skip
          </button>
          <button
            onClick={() =>
              onStart({
                goal: goal.trim(),
                confidence,
                duration,
                startTime: Date.now(),
              })
            }
            style={{
              flex: 2,
              padding: "11px 0",
              borderRadius: 12,
              border: "none",
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
}

export function PostSessionReflection({ D, sessionGoal, subjectId, onSave, onSkip }) {
  const [open, setOpen] = React.useState(true);
  const [understood, setU] = React.useState("");
  const [unclear, setC] = React.useState("");
  const [improve, setI] = React.useState("");
  const bd2 = D ? "#374151" : "#e5e7eb";
  const handleSave = () => {
    onSave({
      date: new Date().toISOString().slice(0, 10),
      goal: sessionGoal || "",
      reflections: {
        understood: understood.trim(),
        unclear: unclear.trim(),
        improve: improve.trim(),
      },
    });
  };
  if (!open) return null;
  return (
    <div
      style={{
        ...C(D),
        marginTop: 16,
        overflow: "hidden",
        border: "1.5px solid #7c3aed",
      }}
      className="slide-up"
    >
      <button
        onClick={() => setOpen(false)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: D ? "rgba(99,102,241,.1)" : "#f5f3ff",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 18 }}> </span>
        <span
          style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#7c3aed" }}
        >
          Session Reflection
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: D ? "#c4b5fd" : "#5b21b6",
            }}
          >
            (optional — 2 mins)
          </span>
        </span>

        <span
          style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700 }}
        ></span>
      </button>
      <div
        style={{
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {sessionGoal && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: D ? "#191a2b" : "#f9fafb",
              fontSize: 12,
              color: D ? "#9ca3af" : "#6b7280",
            }}
          >
            Goal: <em>{sessionGoal}</em>
          </div>
        )}
        {[
          {
            key: "understood",
            label: "What did I understand well?",
            val: understood,
            set: setU,
            ph: "e.g.The stages of mitosis",
          },
          {
            key: "unclear",
            label: "What is still unclear?",
            val: unclear,
            set: setC,
            ph: "e.g. Why ATP isneeded",
          },
          {
            key: "improve",
            label: "What will I do differently next time?",
            val: improve,
            set: setI,
            ph: "e.g.Test myself without notes first",
          },
        ].map((field) => (
          <div key={field.key}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: D ? "#9ca3af" : "#6b7280",
                display: "block",
                marginBottom: 4,
              }}
            >
              {field.label}
            </label>
            <textarea
              value={field.val}
              onChange={(e) => field.set(e.target.value)}
              rows={2}
              placeholder={field.ph}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${bd2}`,
                background: D ? "#191a2b" : "#f9fafb",
                color: D ? "#e8ecf4" : "#111827",
                fontSize: 12,
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              border: `1px
solid ${bd2}`,
              background: "transparent",
              color: D ? "#9ca3af" : "#6b7280",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            S kip
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: "9px 0",
              borderRadius: 10,
              border: "none",
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Save Reflection{" "}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudyJournalTab({ D, entries, mu2, tx2 }) {
  if (!entries || !entries.length)
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <p style={{ fontSize: 28, marginBottom: 8 }}> </p>
        <p
          style={{ fontSize: 14, fontWeight: 600, color: tx2, marginBottom: 4 }}
        >
          No reflections yet
        </p>
        <p style={{ fontSize: 12, color: mu2 }}>
          Complete a study session and add a reflection to start your journal.
        </p>
      </div>
    );
  return (
    <div className="fade-in">
      {[...entries].reverse().map((entry, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#7c3aed",
                flexShrink: 0,
                marginTop: 4,
              }}
            />
            {i < entries.length - 1 && (
              <div
                style={{
                  width: 2,
                  flex: 1,
                  background: D ? "#262844" : "#e5e7eb",
                  marginTop: 4,
                }}
              />
            )}
          </div>
          <div style={{ flex: 1, paddingBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                color: mu2,
                marginBottom: 4,
                fontWeight: 600,
              }}
            >
              {entry.date}
            </div>
            {entry.goal && (
              <div
                style={{
                  fontSize: 12,
                  color: "#7c3aed",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                {entry.goal}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entry.reflections?.understood && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: D ? "rgba(16,185,129,.08)" : "#f0fdf4",
                    fontSize: 12,
                    color: D ? "#6ee7b7" : "#15803d",
                  }}
                >
                  <strong>Understood:</strong> {entry.reflections.understood}
                </div>
              )}
              {entry.reflections?.unclear && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: D ? "rgba(245,158,11,.08)" : "#fffbeb",
                    fontSize: 12,
                    color: D ? "#fcd34d" : "#92400e",
                  }}
                >
                  <strong>Unclear:</strong> {entry.reflections.unclear}
                </div>
              )}
              {entry.reflections?.improve && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: D ? "rgba(99,102,241,.08)" : "#f5f3ff",
                    fontSize: 12,
                    color: D ? "#c4b5fd" : "#5b21b6",
                  }}
                >
                  <strong>Next time:</strong> {entry.reflections.improve}
                </div>
              )}
              {}
              {entry.coaching && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: D ? "rgba(99,102,241,.06)" : "#f8f7ff",
                    border: "1px solid" + (D ? "#6d28d922" : "#ddd6fe"),
                    marginTop: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#7c3aed",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: 6,
                    }}
                  >
                    AI Coach
                  </div>
                  {entry.coaching.summary && (
                    <p
                      style={{
                        fontSize: 12,
                        color: D ? "#ddd6fe" : "#4c1d95",
                        marginBottom: 4,
                        lineHeight: 1.55,
                      }}
                    >
                      {entry.coaching.summary}
                    </p>
                  )}
                  {entry.coaching.keyGap && (
                    <p style={{ fontSize: 11, color: mu2, marginBottom: 3 }}>
                      <strong>Key gap:</strong>
                      {entry.coaching.keyGap}
                    </p>
                  )}
                  {entry.coaching.nextAction && (
                    <p style={{ fontSize: 11, color: mu2, marginBottom: 3 }}>
                      <strong>Next session:</strong>
                      {entry.coaching.nextAction}
                    </p>
                  )}
                  {entry.coaching.encouragement && (
                    <p
                      style={{
                        fontSize: 11,
                        fontStyle: "italic",
                        color: D ? "#c4b5fd" : "#5b21b6",
                      }}
                    >
                      {entry.coaching.encouragement}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalibrationGauge({ D, calibData, subjectName }) {
  const score =
    calibData && calibData.length > 0 ? calcBrierScore(calibData) : null;
  if (score === null) return null;

  const clampedScore = Math.min(score, 0.35);
  const pct = clampedScore / 0.35;
  const label =
    score < 0.15
      ? "Well-calibrated"
      : score < 0.25
        ? "Moderate"
        : "Overconfident";
  const col = score < 0.15 ? "#10b981" : score < 0.25 ? "#f59e0b" : "#ef4444";
  const r = 44,
    cx2 = 56,
    cy2 = 56;
  const arcLen = Math.PI * r;

  const dash = arcLen * (1 - pct);

  const showWarning = score >= 0.25 && calibData.length >= 5;
  return (
    <div style={{ ...C(D), padding: 20 }}>
      <h3
        style={{
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 4,
          color: D ? "#e8ecf4" : "#111827",
        }}
      >
        Calibration Accuracy
      </h3>
      <p
        style={{
          fontSize: 12,
          color: D ? "#9ca3af" : "#6b7280",
          marginBottom: 14,
        }}
      >
        How well your confidence predicts actual performance.
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <svg width={112} height={68} viewBox="0 0 112 68">
            <path
              d={`M 12 56 A ${r} ${r} 0 0 1 100 56`}
              fill="none"
              stroke={D ? "#262844" : "#e5e7eb"}
              strokeWidth={10}
              strokeLinecap="round"
            />
            <path
              d={`M 12 56 A ${r} ${r} 0 0 1 100 56`}
              fill="none"
              stroke={col}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={arcLen}
              strokeDashoffset={dash * 0}
              style={{
                strokeDashoffset: dash,
                transition: "stroke-dashoffset .8s ease",
              }}
            />
            <text
              x={cx2}
              y={52}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              fill={col}
            >
              {score.toFixed(2)}
            </text>
            <text
              x={cx2}
              y={64}
              textAnchor="middle"
              fontSize={9}
              fill={D ? "#9ca3af" : "#6b7280"}
            >
              Brier score
            </text>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: col,
              marginBottom: 4,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 12,
              color: D ? "#9ca3af" : "#6b7280",
              lineHeight: 1.55,
            }}
          >
            Based on {calibData.length} prediction
            {calibData.length !== 1 ? "s" : ""}.
            {score < 0.15
              ? " Your confidence closely matches your actual recall — excellentmetacognition."
              : score < 0.25
                ? " Your predictions are fairly accurate but there's room for improvement."
                : " You're regularly overestimating your understanding."}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
              fontSize: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: "#10b98122",
                color: "#10b981",
                padding: "2px 8px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              &lt;0.15 good
            </span>
            <span
              style={{
                background: "#f59e0b22",
                color: "#d97706",
                padding: "2px 8px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              0.15–0.25
            </span>
            <span
              style={{
                background: "#ef444422",
                color: "#ef4444",
                padding: "2px 8px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              &gt;0.25 poor
            </span>
          </div>
        </div>
      </div>
      {showWarning && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            background: D ? "rgba(239,68,68,.1)" : "#fef2f2",
            border: "1px solid #ef4444",
            fontSize: 12,
            color: D ? "#fca5a5" : "#b91c1c",
            lineHeight: 1.6,
          }}
        >
          You're overestimating your understanding — try slowing down and
          checking answers before committing. Consider using the Blurting tool
          to reveal real gaps.
        </div>
      )}
    </div>
  );
}

export function MemoryDecayChart({ D, cardState, accent }) {
  const data = React.useMemo(() => {
    if (!cardState || !cardState.stability) return [];
    const stability = cardState.stability;
    const lastReview = cardState.lastReview || Date.now();
    const elapsedDays = (Date.now() - lastReview) / 86400000;
    const pts = [];
    for (let d = 0; d <= Math.max(30, stability * 2); d += 1) {
      const ebbinghaus = Math.round(
        Math.exp(-(d + elapsedDays) / (stability * 1.5)) * 100,
      );

      const fsrs = Math.round(
        fsrsRetrievability(stability, d + elapsedDays) * 100,
      );
      const nextReviewDay = Math.round(cardState.interval || stability);
      pts.push({
        d,
        ebbinghaus: Math.max(0, ebbinghaus),
        fsrs: Math.max(0, fsrs),
        isNext: d === nextReviewDay,
      });
    }
    return pts;
  }, [cardState]);
  if (!data.length) return null;

  const nextReview = cardState.interval || 0;
  const retAtNext = data.find((p) => p.d === Math.round(nextReview));
  return (
    <div
      style={{
        marginBottom: 8,
        padding: "10px 14px",
        borderRadius: 10,
        background: D ? "#13131f" : "#f9fafb",
        border: `1px solid ${D ? "#262844" : "#e5e7eb"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: D ? "#9ca3af" : "#6b7280",
          }}
        >
          Memory decay curve
        </span>

        {retAtNext && (
          <span style={{ fontSize: 10, color: accent, fontWeight: 600 }}>
            Next review:
            {Math.round(nextReview)}d · {retAtNext.fsrs}% recall
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <LineChart
          data={data}
          margin={{ top: 2, right: 2, left: -30, bottom: 0 }}
        >
          <XAxis
            dataKey="d"
            tick={{ fontSize: 8, fill: D ? "#6b7280" : "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v % 10 === 0 ? v + "d" : "")}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 8, fill: D ? "#6b7280" : "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v === 100 ? "" : v + "%")}
          />
          <Tooltip
            contentStyle={{
              background: D ? "#191a2b" : "#fff",
              border: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
              borderRadius: 6,
              fontSize: 10,
              padding: "4px 8px",
            }}
            formatter={(val, name) => [
              val + "%",
              name === "ebbinghaus" ? "Ebbinghaus" : "FSRS",
            ]}
            labelFormatter={(v) => "Day " + v}
          />
          <Line
            type="monotone"
            dataKey="ebbinghaus"
            stroke={D ? "#4b5563" : "#d1d5db"}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
            name="ebbinghaus"
          />
          <Line
            type="monotone"
            dataKey="fsrs"
            stroke={accent}
            strokeWidth={2}
            dot={false}
            name="fsrs"
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 2,
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: D ? "#6b7280" : "#9ca3af",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span
            style={{
              width: 12,
              height: 2,
              background: D ? "#4b5563" : "#d1d5db",
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          Ebbinghaus
        </span>
        <span
          style={{
            fontSize: 9,
            color: accent,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span
            style={{
              width: 12,
              height: 2,
              background: accent,
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          FSRS
        </span>
      </div>
    </div>
  );
}

export function StrategyRecommendation({
  D,
  subj,
  allSections,
  fcHist,
  calibData,
  timetableExams,
  stats,
  onFlashcards,
  onBlurt,
  onQuestions,
  onWeak,
}) {
  const rec = React.useMemo(
    () =>
      getStrategyRecommendation(
        subj,
        allSections,
        fcHist,
        calibData,
        timetableExams,
        stats,
      ),
    [subj, allSections, fcHist, calibData, timetableExams, stats],
  );
  const actionMap = {
    flashcards: onFlashcards,
    blurting: onBlurt,
    questions: onQuestions,
    weak: onWeak,
    mixed: onFlashcards,
  };
  const action = actionMap[rec.strategy] || onFlashcards;
  return (
    <div
      style={{
        ...C(D),
        padding: 18,
        marginBottom: 18,
        borderColor: rec.color,
        borderWidth: 1.5,
        background: D ? rec.color + "0d" : rec.color + "08",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: rec.color + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {rec.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: rec.color,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 2,
            }}
          >
            Recommended for you
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: D ? "#e8ecf4" : "#111827",
              marginBottom: 3,
            }}
          >
            {rec.title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: D ? "#9ca3af" : "#6b7280",
              lineHeight: 1.55,
            }}
          >
            {rec.reason}
          </div>
        </div>
        <button
          onClick={action}
          style={{
            padding: "9px 18px",
            borderRadius: 10,
            border: "none",
            background: rec.color,
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
            alignSelf: "center",
          }}
        >
          Start
        </button>
      </div>
    </div>
  );
}
