import React, { useState } from "react";
import { _aiWithRetry, aiServiceFeedbackRubric, callAI } from "./aiService.js";
import { stripHtml } from "./ui.jsx";

export const COMMAND_WORDS = [
  {
    word: "Explain",
    boards: ["AQA", "Edexcel", "OCR", "WJEC"],
    tip: "Give clear reasons — use'because', 'therefore', 'this means'. Chain causes to effects. Don't just describe; showcausation.",
    scaffold: ["Point", "Reasoning", "Evidence", "Impact"],
  },
  {
    word: "Evaluate",
    boards: ["AQA", "Edexcel", "OCR", "WJEC"],
    tip: "Weigh up both sides, thencommit to a clear judgement. AQA rewards a final 'Overall…' sentence. Don't just list pros andcons.",
    scaffold: [
      "Argument for",
      "Counter-argument",
      "Evidence for both",
      "Overall judgement",
    ],
  },
  {
    word: "Analyse",
    boards: ["AQA", "Edexcel", "OCR", "WJEC"],
    tip: "Break the topic into componentsand examine each in depth. Explain the significance of each part. Avoid surfacedescription.",
    scaffold: [
      "Key component",
      "How it works / why it matters",
      "Evidence",
      "Widersignificance",
    ],
  },
  {
    word: "Compare",
    boards: ["AQA", "Edexcel", "OCR", "WJEC"],
    tip: "Identify specific similaritiesAND differences. Use comparative connectives: 'whereas', 'similarly', 'in contrast'. Link directly— don't write two separate accounts.",
    scaffold: [
      "Similarity",
      "Difference",
      "Evidence foreach",
      "Overall comparison",
    ],
  },
  {
    word: "Describe",
    boards: ["AQA", "Edexcel", "OCR", "WJEC"],
    tip: "Give accurate, detailedfeatures. Use subject-specific vocabulary. A strong description has multiple developed points,not a list.",
    scaffold: ["Feature 1", "Feature 2", "Feature 3", "Supporting detail"],
  },
  {
    word: "Assess",
    boards: ["AQA", "Edexcel", "OCR"],
    tip: "Weigh up the relative importance orvalidity. Consider criteria: how much? how significant? how reliable? Reach a reasonedconclusion.",
    scaffold: [
      "Claim",
      "Supporting evidence",
      "Limitation / counter",
      "Reasonedconclusion",
    ],
  },
  {
    word: "Discuss",
    boards: ["AQA", "Edexcel", "OCR", "WJEC"],
    tip: "Present multiple perspectiveswith evidence. Don't just list views — evaluate their merit. A conclusion that synthesises thedebate gains top marks.",
    scaffold: [
      "View 1 + evidence",
      "View 2 + evidence",
      "Evaluation ofboth",
      "Synthesised conclusion",
    ],
  },
  {
    word: "Justify",
    boards: ["AQA", "Edexcel", "OCR"],
    tip: "Give strong reasons for a decision orposition. Anticipate objections and explain why your reasoning outweighsthem.",
    scaffold: [
      "Decision / position",
      "Reason 1 + evidence",
      "Reason 2 + evidence",
      "Whyalternative is weaker",
    ],
  },
  {
    word: "Examine",
    boards: ["AQA", "Edexcel"],
    tip: "Investigate carefully, looking at differentaspects. Similar to Analyse — go beyond surface description to probe causes, effects andsignificance.",
    scaffold: [
      "Aspect 1 — detail",
      "Aspect 2 — detail",
      "Relationship betweenaspects",
      "Overall finding",
    ],
  },
  {
    word: "To what extent",
    boards: ["AQA", "Edexcel", "OCR", "WJEC"],
    tip: "Always take a clearposition. Structure: agree partially, then qualify. Your extent should be explicit: 'largely', 'to alimited extent', 'primarily because…'",
    scaffold: [
      "Main argument (extent)",
      "Supportingevidence",
      "Counter-argument",
      "Qualified conclusion stating extent",
    ],
  },
];

export function ExamCoachScreen({
  D,
  subjects,
  allSections,
  boardSels,
  boardData,
  onBack,
}) {
  const bg = D ? "#0f1117" : "#f9fafb",
    tx2 = D ? "#e8ecf4" : "#111827",
    mu2 = D ? "#9ca3af" : "#6b7280";
  const C2 = D
    ? { background: "#161b27", border: "1px solid #2a3347", borderRadius: 14 }
    : { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14 };
  const [selSubj, setSelSubj] = React.useState(subjects[0]?.id || "");
  const [selCW, setSelCW] = React.useState(COMMAND_WORDS[0].word);
  const [phase, setPhase] = React.useState("setup");
  const [question, setQuestion] = React.useState("");
  const [loadingQ, setLoadingQ] = React.useState(false);
  const [scaffold, setScaffold] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState("");
  const subjDef = subjects.find(function (s) {
    return s.id === selSubj;
  });
  const board = subjDef ? boardSels[subjDef.id] || "AQA" : "AQA";

  const cmdDef =
    COMMAND_WORDS.find(function (c) {
      return c.word === selCW;
    }) || COMMAND_WORDS[0];

  function getContextNotes() {
    const secs = allSections.filter(function (s) {
      return s.subjectId === selSubj;
    });
    return secs
      .flatMap(function (s) {
        return (s.notes || []).map(function (n) {
          return n.heading + ": " + stripHtml(n.body);
        });
      })
      .slice(0, 12)
      .join("\n");
  }
  function generateQuestion() {
    setLoadingQ(true);
    setErrMsg("");
    setQuestion("");
    setFeedback(null);
    setScaffold({});
    const notes = getContextNotes();
    const prompt =
      "You are a " +
      board +
      " GCSE " +
      (subjDef ? subjDef.name : "subject") +
      "examiner.\n" +
      "Generate ONE exam-quality practice question using the command word '" +
      selCW +
      "'.\n" +
      (notes
        ? "Base it on this revision content:\n" + notes + "\n\n"
        : "Generate a typical " +
          board +
          "GCSE " +
          (subjDef ? subjDef.name : "subject") +
          " question.\n\n") +
      "Requirements:\n" +
      "- Start the question with '" +
      selCW +
      "'\n" +
      "- Use authentic " +
      board +
      " GCSE style and command word conventions\n" +
      "- Include a mark allocation (e.g. [6 marks] or [8 marks])\n" +
      "- Make it appropriately challenging for GCSE level\n\n" +
      "Respond ONLY with the question text. No preamble, no explanation.";

    _aiWithRetry(
      function () {
        return callAI(prompt, 200).then(function (t) {
          if (!t || !t.trim()) throw new Error("Empty");
          return t.trim();
        });
      },
      2,
      function () {
        return (
          selCW +
          " the key factors that influence [a relevant concept in " +
          (subjDef ? subjDef.name : "this subject") +
          "]. Use specific evidence to support your answer. [6marks]"
        );
      },
    )
      .then(function (text) {
        setQuestion(text);
        setPhase("practice");
        setLoadingQ(false);
      })
      .catch(function (e) {
        setErrMsg("Could not generate question: " + e.message);
        setLoadingQ(false);
      });
  }

  function submitAnswer() {
    const filled = cmdDef.scaffold
      .map(function (label, i) {
        return label + ":" + (scaffold[i] || "");
      })
      .join("\n\n");
    if (!filled.replace(/[:\s]/g, "").trim()) {
      setErrMsg("Please fill in at least one section beforesubmitting.");
      return;
    }
    setSubmitting(true);
    setErrMsg("");

    var marksMatch = question.match(/\[(\d+)\s*marks?\]/i);
    var detectedMarks = marksMatch ? parseInt(marksMatch[1]) : 8;
    var syntheticQ = {
      text: question,
      marks: detectedMarks,
      markScheme:
        'Assessment criteria: (1) Correct use of command word "' +
        selCW +
        '" —' +
        cmdDef.tip +
        " (2) Subject accuracy and relevant content. (3) Clear, developed explanation. Awardmarks proportionally.",
      sampleAnswer: "",
      type: detectedMarks >= 6 ? "extended" : "short",
      board: board,
    };

    var structuredAnswer = cmdDef.scaffold
      .map(function (label, i) {
        var val = (scaffold[i] || "").trim();
        return val ? label + ": " + val : null;
      })
      .filter(Boolean)
      .join("\n\n");
    aiServiceFeedbackRubric(syntheticQ, structuredAnswer)
      .then(function (result) {
        var scoreNum = result.score || 0;
        var bandMap = {
          Notattempted: "Developing",
          Developing: "Developing",
          Achieving: "Achieving",
          Exceeding: "Exceeding",
        };
        var mapped = {
          overallBand: bandMap[result.band] || "Developing",
          score: scoreNum + "/" + detectedMarks,
          strengths:
            result.strengths && result.strengths.length
              ? result.strengths
              : ["Attempteda structured response"],
          improvements:
            result.missedPoints && result.missedPoints.length
              ? result.missedPoints
              : [
                  "Develop your points further with more subject-specific detail",
                ],
          commandWordFeedback:
            result.feedback ||
            'Check you have used the command word"' + selCW + '" correctly.',
          modelAnswer: result.modelAnswer || "",

          examTip: result.examTip || cmdDef.tip,
        };
        setFeedback(mapped);
        setPhase("feedback");
        setSubmitting(false);
      })
      .catch(function (e) {
        setFeedback({
          overallBand: "Developing",
          score: "—/" + detectedMarks,
          strengths: ["Attempted a structured response"],
          improvements: [
            "AI feedback unavailable — self-assess using the command word guidancebelow",
          ],
          commandWordFeedback: cmdDef.tip,
          modelAnswer: "",
          examTip:
            "Re-read the mark scheme and identify which scaffold sections need moredevelopment.",
        });
        setPhase("feedback");
        setSubmitting(false);
      });
  }
  function reset() {
    setPhase("setup");
    setQuestion("");
    setFeedback(null);
    setScaffold({});
    setErrMsg("");
  }
  const bandColor = feedback
    ? feedback.overallBand === "Exceeding"
      ? "#10b981"
      : feedback.overallBand === "Achieving"
        ? "#3b82f6"
        : "#f59e0b"
    : "#6366f1";
  return (
    <div
      style={{ minHeight: "100vh", background: bg, color: tx2 }}
      className="fade-in"
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px" }}>
        <button
          onClick={onBack}
          style={{
            fontSize: 13,
            color: mu2,
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          {" "}
          Home
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Exam Technique Coach
        </h2>
        <p style={{ fontSize: 13, color: mu2, marginBottom: 24 }}>
          Master command words with structured practice and AI feedback.
        </p>

        {}
        <div style={{ ...C2, padding: 22, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 140 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: mu2,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                SUBJECT
              </label>
              <select
                value={selSubj}
                onChange={function (e) {
                  setSelSubj(e.target.value);
                  reset();
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid" + (D ? "#374151" : "#d1d5db"),
                  background: D ? "#1e2537" : "#fff",
                  color: tx2,
                  fontSize: 13,
                }}
              >
                {subjects.map(function (s) {
                  return (
                    <option key={s.id} value={s.id}>
                      {s.icon}
                      {s.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: mu2,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                COMMAND WORD
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {COMMAND_WORDS.map(function (cw) {
                  const sel = selCW === cw.word;
                  return (
                    <button
                      key={cw.word}
                      onClick={function () {
                        setSelCW(cw.word);
                        reset();
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 20,
                        border: "1.5px solid" + (sel ? "#6366f1" : "#d1d5db"),
                        background: sel ? "#6366f1" : "transparent",
                        color: sel ? "#fff" : mu2,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: sel ? 600 : 400,
                        transition: "all .12s",
                      }}
                    >
                      {cw.word}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: D ? "#1a1a2e" : "#eef2ff",
              border: "1px solid" + (D ? "#312e81" : "#c7d2fe"),
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#6366f1",
                marginBottom: 4,
              }}
            >
              {board} ·{selCW}
            </div>
            <p
              style={{
                fontSize: 13,
                color: D ? "#c7d2fe" : "#3730a3",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {cmdDef.tip}
            </p>
          </div>
          <button
            onClick={generateQuestion}
            disabled={loadingQ}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              background: loadingQ ? "#a5b4fc" : "#6366f1",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: loadingQ ? "not-allowed" : "pointer",
            }}
          >
            {loadingQ ? "Generating question…" : "Generate Practice Question"}
          </button>

          {errMsg && phase === "setup" && (
            <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>
              {errMsg}
            </p>
          )}
        </div>
        {}
        {phase !== "setup" && question && (
          <div style={{ ...C2, padding: 22, marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#6366f1",
                marginBottom: 8,
              }}
            >
              PRACTICE QUESTION
            </div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              {question}
            </p>
            {phase === "practice" && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: mu2,
                    marginBottom: 12,
                  }}
                >
                  SCAFFOLD YOUR ANSWER — {selCW.toUpperCase()} STRUCTURE
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {cmdDef.scaffold.map(function (label, i) {
                    return (
                      <div key={i}>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#6366f1",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          {i + 1}.{label}
                        </label>
                        <textarea
                          value={scaffold[i] || ""}
                          onChange={function (e) {
                            setScaffold(function (p) {
                              var n = Object.assign({}, p);
                              n[i] = e.target.value;
                              return n;
                            });
                          }}
                          placeholder={
                            "Write your " + label.toLowerCase() + " here…"
                          }
                          style={{
                            width: "100%",
                            minHeight: 72,
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid" + (D ? "#374151" : "#d1d5db"),
                            background: D ? "#1e2537" : "#f9fafb",
                            color: tx2,
                            fontSize: 13,
                            resize: "vertical",
                            boxSizing: "border-box",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                {errMsg && phase === "practice" && (
                  <p style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>
                    {errMsg}
                  </p>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    onClick={submitAnswer}
                    disabled={submitting}
                    style={{
                      padding: "10px 22px",
                      borderRadius: 10,
                      border: "none",
                      background: submitting ? "#a5b4fc" : "#6366f1",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Getting feedback…" : "Submit for Feedback"}
                  </button>

                  <button
                    onClick={reset}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid" + (D ? "#374151" : "#d1d5db"),
                      background: "transparent",
                      color: mu2,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Start over
                  </button>
                </div>
              </>
            )}
            {phase === "feedback" && feedback && (
              <div className="fade-in">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                    padding: "14px 18px",
                    borderRadius: 12,
                    background: D ? "#161b27" : "#f8fafc",
                    border: "1.5px solid " + bandColor,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: bandColor,
                      }}
                    >
                      {feedback.score}
                    </div>
                    <div style={{ fontSize: 10, color: mu2, fontWeight: 600 }}>
                      {feedback.overallBand}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: bandColor,
                        marginBottom: 3,
                      }}
                    >
                      {feedback.overallBand}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: D ? "#c7d2fe" : "#4338ca",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {feedback.commandWordFeedback}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: D ? "#052e16" : "#f0fdf4",
                      border: "1px solid" + (D ? "#166534" : "#bbf7d0"),
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#16a34a",
                        marginBottom: 6,
                      }}
                    >
                      Strengths
                    </div>
                    {(feedback.strengths || []).map(function (s, i) {
                      return (
                        <p
                          key={i}
                          style={{
                            fontSize: 12,
                            color: D ? "#86efac" : "#15803d",
                            margin: "0 0 4px",
                            lineHeight: 1.5,
                          }}
                        >
                          • {s}
                        </p>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: D ? "#431407" : "#fff7ed",
                      border: "1px solid" + (D ? "#9a3412" : "#fed7aa"),
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#ea580c",
                        marginBottom: 6,
                      }}
                    >
                      Improve
                    </div>
                    {(feedback.improvements || []).map(function (s, i) {
                      return (
                        <p
                          key={i}
                          style={{
                            fontSize: 12,
                            color: D ? "#fdba74" : "#c2410c",
                            margin: "0 0 4px",
                            lineHeight: 1.5,
                          }}
                        >
                          • {s}
                        </p>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: D ? "#1a1a2e" : "#eef2ff",
                    border: "1px solid" + (D ? "#312e81" : "#c7d2fe"),
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6366f1",
                      marginBottom: 4,
                    }}
                  >
                    Model Answer
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: D ? "#c7d2fe" : "#3730a3",
                      margin: 0,
                      lineHeight: 1.65,
                    }}
                  >
                    {feedback.modelAnswer}
                  </p>
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: D ? "#0f172a" : "#f8fafc",
                    border: "1px solid" + (D ? "#1e293b" : "#e2e8f0"),
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: mu2 }}>
                    Exam tip:{" "}
                  </span>
                  <span
                    style={{ fontSize: 12, color: D ? "#e2e8f0" : "#475569" }}
                  >
                    {feedback.examTip}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={generateQuestion}
                    disabled={loadingQ}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 10,
                      border: "none",
                      background: "#6366f1",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    New Question
                  </button>
                  <button
                    onClick={reset}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid" + (D ? "#374151" : "#d1d5db"),
                      background: "transparent",
                      color: mu2,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Change command word
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
