import React, { useState } from "react";
import { blurtAnalyse } from "./papers.js";
import { B, C, I, mu, stripHtml, trackEvent, tx } from "./ui.jsx";

export function BlurtingScreen({
  D,
  subjects,
  allSections,
  initSubjId,
  initSecId,
  onBack,
}) {
  const [bSubj, setBSubj] = useState(initSubjId || subjects[0]?.id || "");
  const [bSec, setBSec] = useState(initSecId || "");
  const [blurt, setBlurt] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const secList = allSections.filter((s) => s.subjectId === bSubj);
  const sec = allSections.find((s) => s.id === bSec);
  const notesText =
    (sec?.notes || [])
      .map(
        (n) => `##
${n.heading}\n${stripHtml(n.body)}`,
      )
      .join("\n\n") || "(no notes)";
  const canSubmit =
    blurt.trim().split(/\s+/).filter(Boolean).length >= 10 && bSubj;
  const Lbl = (t) => (
    <label
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: mu(D),
        display: "block",
        marginBottom: 5,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {t}
    </label>
  );
  const submit = async () => {
    if (!canSubmit || busy) return;

    setBusy(true);
    setErr("");
    setRes(null);
    trackEvent("blurt_submitted", { subjectId: bSubj, sectionId: bSec });
    try {
      setRes(await blurtAnalyse(notesText, blurt));
    } catch (e) {
      setErr("AI analysis unavailable — please try again.");
    }
    setBusy(false);
  };
  const reset = () => {
    setBlurt("");
    setRes(null);
    setErr("");
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        background: D ? "#0f1117" : "#f9fafb",
        color: tx(D),
      }}
      className="fade-in"
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <button
          onClick={onBack}
          style={{
            fontSize: 13,
            color: mu(D),
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          {" "}
          Back
        </button>
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Blurting Tool
          </h2>
          <p style={{ fontSize: 13, color: mu(D) }}>
            Write everything you remember — AI reveals your gaps.
          </p>
        </div>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: D ? "rgba(99,102,241,0.08)" : "#f0f9ff",
            border: "1px solid #6366f1",
            marginBottom: 20,
            fontSize: 12,
            color: D ? "#c7d2fe" : "#1e40af",
            lineHeight: 1.65,
          }}
        >
          <strong>How it works:</strong> Close your notes. Select a topic. Write
          down
          <em>everything</em> you can recall — key terms, processes, dates,
          equations. Don't look anything up. ReviseIQ AI will compare your
          recall to your notes and pinpoint exactly what to revise.
        </div>
        {!res && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                {Lbl("Subject")}
                <select
                  style={I(D)}
                  value={bSubj}
                  onChange={(e) => {
                    setBSubj(e.target.value);
                    setBSec("");
                    setRes(null);
                  }}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {Lbl("Topic / Section")}
                <select
                  style={I(D)}
                  value={bSec}
                  onChange={(e) => {
                    setBSec(e.target.value);
                    setRes(null);
                  }}
                >
                  <option value="">— Select section (optional) —</option>
                  {secList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {bSec && sec && !(sec.notes || []).length && (
              <div
                style={{
                  padding: "9px 13px",
                  borderRadius: 9,
                  background: D ? "#1e2537" : "#fffbeb",
                  border: `1px solid ${D ? "#374151" : "#fde68a"}`,
                  fontSize: 12,
                  color: D ? "#fcd34d" : "#92400e",
                }}
              >
                No notes in this section — AI will still assess your recall but
                with less accuracy.
              </div>
            )}
            <div>
              {Lbl("Your blurt — write everything from memory")}
              <textarea
                value={blurt}
                onChange={(e) => setBlurt(e.target.value)}
                rows={13}
                placeholder={
                  bSec
                    ? `Write down everything you remember about
"${sec?.title}"…`
                    : "Select a topic above, then start writing everything you know…"
                }
                style={{ ...I(D, { resize: "vertical", lineHeight: 1.75 }) }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color:
                      blurt.trim().split(/\s+/).filter(Boolean).length < 10
                        ? mu(D)
                        : "#16a34a",
                  }}
                >
                  {blurt.trim().split(/\s+/).filter(Boolean).length} words
                  {blurt.trim().split(/\s+/).filter(Boolean).length < 10
                    ? "(write at least 10)"
                    : ""}
                </span>
                {blurt && (
                  <button
                    onClick={reset}
                    style={{
                      fontSize: 11,
                      color: mu(D),
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {err && <p style={{ fontSize: 12, color: "#ef4444" }}>{err}</p>}
            <button
              onClick={submit}
              disabled={!canSubmit || busy}
              style={{
                ...B("#6366f1", false, {
                  padding: "12px 0",
                  fontSize: 14,
                  fontWeight: 700,
                  width: "100%",
                  opacity: !canSubmit || busy ? 0.4 : 1,
                  cursor: !canSubmit || busy ? "not-allowed" : "pointer",
                }),
              }}
            >
              {busy ? "Analysing your recall…" : "Check What I Remembered →"}
            </button>
          </div>
        )}
        {res && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div
              style={{
                ...C(D),
                padding: 22,
                textAlign: "center",
                borderColor:
                  res.score >= 70
                    ? "#16a34a"
                    : res.score >= 40
                      ? "#f59e0b"
                      : "#ef4444",
                borderWidth: 2,
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color:
                    res.score >= 70
                      ? "#16a34a"
                      : res.score >= 40
                        ? "#d97706"
                        : "#ef4444",
                  marginBottom: 6,
                }}
              >
                {res.score}%
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
                {res.score >= 80
                  ? "Excellentrecall!"
                  : res.score >= 60
                    ? "Good effort — a few gaps to fill"
                    : res.score >= 40
                      ? "Keep practising —several areas to review"
                      : "Needs work — lots to consolidate"}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: mu(D),
                  lineHeight: 1.65,
                  maxWidth: 500,
                  margin: "0 auto",
                }}
              >
                {res.feedback}
              </p>
            </div>
            {}
            {res.misconceptions && res.misconceptions.length > 0 && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: D ? "rgba(239,68,68,.1)" : "#fef2f2",
                  border: "2px solid #ef4444",
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    color: "#dc2626",
                    marginBottom: 8,
                    fontSize: 13,
                  }}
                >
                  Misconceptions Detected ({res.misconceptions.length}) — fix
                  these first!
                </p>

                {res.misconceptions.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      lineHeight: 1.65,
                      padding: "5px 0",
                      borderBottom: `1px solid ${D ? "rgba(239,68,68,.2)" : "#fee2e2"}`,
                      color: D ? "#fca5a5" : "#b91c1c",
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <span style={{ flexShrink: 0 }}></span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {res.remembered?.length > 0 && (
                <div style={{ ...C(D), padding: 16 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#16a34a",
                      marginBottom: 10,
                      fontSize: 13,
                    }}
                  >
                    Remembered ({res.remembered.length})
                  </p>
                  {res.remembered.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        lineHeight: 1.6,
                        padding: "3px 0",
                        borderBottom: `1px solid ${D ? "#1e2537" : "#f3f4f6"}`,
                        color: tx(D),
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
              {res.missed?.length > 0 && (
                <div style={{ ...C(D), padding: 16 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#ef4444",
                      marginBottom: 10,
                      fontSize: 13,
                    }}
                  >
                    {" "}
                    Missed ({res.missed.length})
                  </p>
                  {res.missed.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        lineHeight: 1.6,
                        padding: "3px 0",
                        borderBottom: `1px solid ${D ? "#1e2537" : "#f3f4f6"}`,
                        color: tx(D),
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {res.partial?.length > 0 && (
              <div style={{ ...C(D), padding: 16 }}>
                <p
                  style={{
                    fontWeight: 700,
                    color: "#d97706",
                    marginBottom: 8,
                    fontSize: 13,
                  }}
                >
                  {" "}
                  Partially recalled ({res.partial.length})
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  {res.partial.map((p, i) => (
                    <div
                      key={i}
                      style={{ fontSize: 12, lineHeight: 1.6, color: tx(D) }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={reset}
                style={{
                  flex: 2,
                  ...B("#6366f1", false, {
                    padding: "11px 0",
                    fontSize: 13,
                    fontWeight: 700,
                  }),
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  setBSec("");
                  setRes(null);
                  setBlurt("");
                }}
                style={{
                  flex: 1,
                  ...B("transparent", true, {
                    padding: "11px 0",
                    fontSize: 13,
                    borderColor: D ? "#374151" : "#d1d5db",
                    color: mu(D),
                  }),
                }}
              >
                Different Topic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const ACT_DEFS = {
  flashcards: {
    icon: " ",
    label: "SM-2 Flashcard Review",
    navTab: "flashcards",
    tip: "Spacedrepetition (Ebbinghaus, 1885; Cepeda et al., 2006) is the single most efficient revision method.",
    goal: "Review all due flashcards using the SM-2 Again/Hard/Good/Easy buttons",
  },
  blurting: {
    icon: " ",
    label: "Blurting Exercise",
    navTab: null,
    tip: "Free recall forces retrieval andreveals knowledge gaps more effectively than passive re-reading (Karpicke & Roediger, 2008).",
    goal: "Open the Blurting tool, write everything you know from memory, then review what youmissed",
  },
  questions: {
    icon: " ",
    label: "Exam Practice Questions",
    navTab: "questions",
    tip: "Practicetesting improves long-term retention by up to 50% compared to re-reading (Roediger &Karpicke, 2006).",
    goal: "Attempt all questions without looking at notes, then review markschemes for missed points",
  },
  notes: {
    icon: " ",
    label: "Active Note Review",
    navTab: "notes",
    tip: "Passive re-reading hasnegligible effect on retention. Instead: pause after each heading, cover the notes, and recite keypoints aloud.",
    goal: "Read each section of notes, then cover and recite at least 3 key points perheading from memory",
  },
  target: {
    icon: " ",
    label: "Target Test",
    navTab: null,
    tip: "Interleaved practice producessuperior long-term retention vs. blocked revision (Taylor & Rohrer, 2010).",
    goal: "Complete aTarget Test session focusing on your weakest areas for this subject",
  },
};
