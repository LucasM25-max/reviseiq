import React, { useState, useEffect, useRef } from "react";
import { ALL_SUBJECTS } from "./subjects.js";

export function SearchModal({
  D,
  subjects,
  allSections,
  boardData,
  boardSels,
  onNavigate,
  onClose,
}) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
  }, []);
  const results = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const hits = [];
    allSections.forEach((sec) => {
      const subj = subjects.find((s) => s.id === sec.subjectId);
      if (!subj) return;
      const sub = subj.name + " › " + sec.title;
      if (sec.title && sec.title.toLowerCase().includes(query)) {
        hits.push({
          type: "section",
          label: sec.title,
          sub,
          icon: subj.icon,
          subj,
          sec,
        });
      }
      (sec.notes || []).forEach((n) => {
        if (
          (n.heading || "").toLowerCase().includes(query) ||
          (typeof n.body === "string" && n.body.toLowerCase().includes(query))
        ) {
          hits.push({
            type: "note",
            label: n.heading || "Note",
            sub,
            icon: "📝",
            subj,
            sec,
          });
        }
      });
      (sec.flashcards || []).forEach((fc) => {
        if (
          (fc.q || "").toLowerCase().includes(query) ||
          (fc.a || "").toLowerCase().includes(query)
        ) {
          hits.push({
            type: "flashcard",
            label: (fc.q || "").slice(0, 60),
            sub,
            icon: "🎴",
            subj,
            sec,
            tab: "flashcards",
          });
        }
      });
      (sec.questions || []).forEach((qItem) => {
        if ((qItem.text || "").toLowerCase().includes(query)) {
          hits.push({
            type: "question",
            label: (qItem.text || "").slice(0, 60),
            sub,
            icon: "❓",
            subj,
            sec,
            tab: "questions",
          });
        }
      });
    });
    return hits.slice(0, 12);
  }, [q, subjects, allSections]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        zIndex: 9000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 80,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: D ? "#1e2537" : "#fff",
          borderRadius: 14,
          width: 520,
          maxWidth: "92vw",
          boxShadow: "0 30px 80px rgba(0,0,0,.3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px",
            borderBottom: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
          }}
        >
          <span style={{ fontSize: 16 }}> </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
            placeholder="Search notes, flashcards, sections…"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 15,
              color: D ? "#e8ecf4" : "#111827",
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: D ? "#8896b3" : "#9ca3af",
              background: D ? "#374151" : "#f3f4f6",
              padding: "2px 7px",
              borderRadius: 6,
            }}
          >
            Esc
          </span>
        </div>
        {!q && (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: D ? "#8896b3" : "#9ca3af",
              fontSize: 13,
            }}
          >
            Start typing to search…
          </div>
        )}
        {q && results.length === 0 && (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: D ? "#8896b3" : "#9ca3af",
              fontSize: 13,
            }}
          >
            No results for "{q}"
          </div>
        )}
        {results.map((r, i) => (
          <button
            key={i}
            onClick={() => {
              onNavigate(r);
              onClose();
            }}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              width: "100%",
              padding: "12px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              borderBottom: `1px solid ${D ? "#374151" : "#f3f4f6"}`,
              transition: "background .1s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = D ? "#374151" : "#f9fafb")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
              {r.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: D ? "#e8ecf4" : "#111827",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.label}
              </div>
              <div style={{ fontSize: 11, color: D ? "#9ca3af" : "#6b7280" }}>
                {r.sub}
              </div>
            </div>
            <span
              style={{
                fontSize: 10,
                color: "#6366f1",
                fontWeight: 600,
                background: D ? "#312e81" : "#eef2ff",
                padding: "2px 7px",
                borderRadius: 8,
                flexShrink: 0,
                alignSelf: "center",
              }}
            >
              {r.type}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SubjectSelectionScreen({
  D,
  initialSelected,
  initialBoardSels,
  onComplete,
  isEditing,
}) {
  const GCSE_SUBJECTS = ALL_SUBJECTS.filter((s) => !s._politics);
  const POLITICS = ALL_SUBJECTS.find((s) => s._politics);

  const [selected, setSelected] = React.useState(() => {
    if (initialSelected && initialSelected.length > 0)
      return new Set(initialSelected);
    return new Set();
  });
  const [boardPerSubj, setBoardPerSubj] = React.useState(() => {
    return initialBoardSels || {};
  });
  const [step, setStep] = React.useState("subjects");
  const [err, setErr] = React.useState("");
  const bd2 = D ? "#2a3347" : "#e5e7eb";
  const BOARDS = ["AQA", "Edexcel", "Eduqas", "OCR", "WJEC"];
  const toggleSubject = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setErr("");
  };
  const setBoard = (sId, board) => {
    setBoardPerSubj((prev) => ({ ...prev, [sId]: board }));
  };
  const handleSubjectsDone = () => {
    if (selected.size === 0) {
      setErr("Please select at least one subject.");
      return;
    }

    const filled = { ...boardPerSubj };
    for (const id of selected) {
      if (!filled[id]) filled[id] = "AQA";
    }

    if (POLITICS && !filled[POLITICS.id]) filled[POLITICS.id] = "AQA";
    setBoardPerSubj(filled);
    setStep("boards");
  };
  const handleComplete = () => {
    const selArray = [...selected];
    const finalBoards = { ...boardPerSubj };
    for (const id of selArray) {
      if (!finalBoards[id]) finalBoards[id] = "AQA";
    }
    if (POLITICS) finalBoards[POLITICS.id] = finalBoards[POLITICS.id] || "AQA";
    onComplete(selArray, finalBoards);
  };

  const SCIENCE_IDS = ["bio", "chem", "phys", "combined-sci"];
  const LANG_IDS = ["french", "spanish", "german"];
  const HUMANITIES = ["history", "geography", "business", "politics"];
  const CREATIVE = ["drama", "music", "dt", "computing"];
  const CORE = ["maths", "eng-lang", "eng-lit"];
  const groups = [
    { label: "Core", ids: CORE },
    { label: "Sciences", ids: SCIENCE_IDS },
    { label: "Humanities", ids: HUMANITIES },
    { label: "Languages", ids: LANG_IDS },
    { label: "Creative & Technical", ids: CREATIVE },
  ];
  if (step === "subjects")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: D ? "#0f1117" : "#f0f4ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 680,
            background: D ? "#161b27" : "#fff",
            borderRadius: 20,
            boxShadow: "0 30px 80px rgba(0,0,0,.15)",
            overflow: "hidden",
          }}
        >
          {}
          <div
            style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              padding: "32px 32px 24px",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}> </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 6,
              }}
            >
              {isEditing ? "Edit Your Subjects" : "Welcome to ReviseIQ!"}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,.8)",
                lineHeight: 1.5,
              }}
            >
              {isEditing
                ? "Update which subjects you're studying. Only these will appear throughout the app."
                : "Select the subjects you're studying for GCSE. You can change this anytime inAccount Settings."}
            </p>
          </div>
          <div
            style={{
              padding: "24px 28px",
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            {}
            {POLITICS && (
              <div
                style={{
                  marginBottom: 20,
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: D ? "rgba(15,118,110,.12)" : "#f0fdfa",
                  border: "1.5px solid #0f766e",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 22 }}>{POLITICS.icon}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: D ? "#5eead4" : "#0f766e",
                    }}
                  >
                    {POLITICS.name}
                  </div>
                  <div
                    style={{ fontSize: 11, color: D ? "#9ca3af" : "#6b7280" }}
                  >
                    Always included — general political awareness
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#0f766e",
                    color: "#fff",
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  Always On
                </span>
              </div>
            )}
            {}
            {groups.map((group) => {
              const groupSubjects = GCSE_SUBJECTS.filter((s) =>
                group.ids.includes(s.id),
              );
              if (!groupSubjects.length) return null;
              return (
                <div key={group.label} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: D ? "#8896b3" : "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 10,
                    }}
                  >
                    {group.label}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill,minmax(160px,1fr))",
                      gap: 8,
                    }}
                  >
                    {groupSubjects.map((s) => {
                      const on = selected.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSubject(s.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 14px",
                            borderRadius: 12,
                            border: `2px solid ${on ? s.accent : bd2}`,
                            background: on ? s.accent + "18" : "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all .15s",
                            boxShadow: on ? `0 0 0 1px ${s.accent}44` : "none",
                          }}
                        >
                          <span style={{ fontSize: 20, flexShrink: 0 }}>
                            {s.icon}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: on ? 700 : 500,
                                color: on
                                  ? s.accent
                                  : D
                                    ? "#e8ecf4"
                                    : "#374151",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                lineHeight: 1.3,
                              }}
                            >
                              {s.name}
                            </div>
                            {on && (
                              <div
                                style={{
                                  fontSize: 9,
                                  color: s.accent,
                                  fontWeight: 700,
                                  marginTop: 1,
                                }}
                              >
                                Selected
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              padding: "20px 28px",
              borderTop: `1px solid ${bd2}`,
              background: D ? "#0f1117" : "#f9fafb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, color: D ? "#8896b3" : "#9ca3af" }}>
                {selected.size === 0 ? (
                  "No subjects selected yet"
                ) : (
                  <>
                    <strong style={{ color: "#6366f1" }}>
                      {selected.size}
                    </strong>
                    subject{selected.size !== 1 ? "s" : ""} selected
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {err && (
                  <span style={{ fontSize: 12, color: "#ef4444" }}>{err}</span>
                )}
                {isEditing && (
                  <button
                    onClick={() => onComplete(null, null)}
                    style={{
                      fontSize: 13,
                      color: D ? "#8896b3" : "#9ca3af",
                      background: "none",
                      border: `1px solid ${bd2}`,
                      borderRadius: 10,
                      padding: "10px 18px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSubjectsDone}
                  disabled={selected.size === 0}
                  style={{
                    padding: "11px 28px",
                    borderRadius: 12,
                    border: "none",
                    background: selected.size > 0 ? "#6366f1" : "#9ca3af",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: selected.size > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  Next: Set Exam Boards
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  const selSubjects = GCSE_SUBJECTS.filter((s) => selected.has(s.id));
  return (
    <div
      style={{
        minHeight: "100vh",
        background: D ? "#0f1117" : "#f0f4ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 580,
          background: D ? "#161b27" : "#fff",
          borderRadius: 20,
          boxShadow: "0 30px 80px rgba(0,0,0,.15)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            padding: "28px 32px 22px",
          }}
        >
          <button
            onClick={() => setStep("subjects")}
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,.7)",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Back
          </button>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 4,
            }}
          >
            Choose Your Exam Boards
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>
            Set the exam board for each subject. You can change these later.
          </p>
        </div>
        <div
          style={{
            padding: "20px 28px",
            maxHeight: "60vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: D ? "#1e2537" : "#f3f4f6",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: D ? "#8896b3" : "#6b7280",
                flexShrink: 0,
              }}
            >
              Set all to:
            </span>
            {["AQA", "Edexcel", "Eduqas", "OCR", "WJEC"].map((b) => (
              <button
                key={b}
                onClick={() => {
                  const next = {};
                  for (const s of selSubjects) next[s.id] = b;
                  if (POLITICS) next[POLITICS.id] = b;
                  setBoardPerSubj(next);
                }}
                style={{
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: `1px solid ${D ? "#374151" : "#d1d5db"}`,
                  background: "transparent",
                  color: D ? "#e8ecf4" : "#374151",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {b}
              </button>
            ))}
          </div>
          {selSubjects.map((s) => {
            const curB = boardPerSubj[s.id] || "AQA";
            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${bd2}`,
                  background: D ? "#1e2537" : "#f9fafb",
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: 600,
                    color: D ? "#e8ecf4" : "#111827",
                  }}
                >
                  {s.name}
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  {BOARDS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBoard(s.id, b)}
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 8,
                        border: `1.5px solid ${curB === b ? s.accent : bd2}`,
                        background: curB === b ? s.accent : "transparent",
                        color: curB === b ? "#fff" : D ? "#8896b3" : "#6b7280",
                        cursor: "pointer",
                        fontWeight: curB === b ? 700 : 400,
                        transition: "all .12s",
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: "20px 28px",
            borderTop: `1px solid ${bd2}`,
            background: D ? "#0f1117" : "#f9fafb",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {isEditing && (
            <button
              onClick={() => onComplete(null, null)}
              style={{
                fontSize: 13,
                color: D ? "#8896b3" : "#9ca3af",
                background: "none",
                border: `1px solid ${bd2}`,
                borderRadius: 10,
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleComplete}
            style={{
              padding: "12px 32px",
              borderRadius: 12,
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {isEditing ? "Save Changes ✓" : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingWizard({ D, onComplete }) {
  const [step, setStep] = React.useState(1);
  const [board, setBoard] = React.useState("AQA");
  const [examDate, setExamDate] = React.useState("");
  const boardOpts = ["AQA", "Edexcel", "Eduqas", "OCR", "WJEC"];
  if (step === 1)
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.65)",
          zIndex: 8000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            background: D ? "#1e2537" : "#fff",
            borderRadius: 20,
            padding: 32,
            width: 400,
            maxWidth: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}> </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 6,
              color: D ? "#e8ecf4" : "#111827",
            }}
          >
            Welcome to ReviseIQ!
          </h2>
          <p
            style={{
              fontSize: 14,
              color: D ? "#9ca3af" : "#6b7280",
              marginBottom: 24,
            }}
          >
            Let's set you up in 2 quick steps.
          </p>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: D ? "#e8ecf4" : "#374151",
              marginBottom: 10,
            }}
          >
            Step 1 of 2: Which exam board do you mainly use?
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            {boardOpts.map((b) => (
              <button
                key={b}
                onClick={() => setBoard(b)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `2px solid ${b === board ? "#6366f1" : "#e5e7eb"}`,
                  background: b === board ? "#6366f1" : "transparent",
                  color: b === board ? "#fff" : D ? "#d1d5db" : "#374151",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            style={{
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 32px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  if (step === 2)
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.65)",
          zIndex: 8000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            background: D ? "#1e2537" : "#fff",
            borderRadius: 20,
            padding: 32,
            width: 400,
            maxWidth: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}> </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 6,
              color: D ? "#e8ecf4" : "#111827",
            }}
          >
            When are your exams?
          </h2>
          <p
            style={{
              fontSize: 14,
              color: D ? "#9ca3af" : "#6b7280",
              marginBottom: 24,
            }}
          >
            Step 2 of 2: Add your main exam date (optional — you can skip this).
          </p>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: `1.5px solid ${D ? "#374151" : "#e5e7eb"}`,
              background: D ? "#374151" : "#f9fafb",
              color: D ? "#e8ecf4" : "#111827",
              fontSize: 14,
              marginBottom: 20,
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => onComplete(board, null)}
              style={{
                flex: 1,
                background: "none",
                color: "#6b7280",
                border: `1.5px solid ${D ? "#374151" : "#e5e7eb"}`,
                borderRadius: 12,
                padding: "12px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Skip
            </button>
            <button
              onClick={() => onComplete(board, examDate || null)}
              style={{
                flex: 2,
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Get Started!
            </button>
          </div>
        </div>
      </div>
    );
  return null;
}
