import { _aiWithRetry, _parseAIJson, callAI, detectErrorType, markAnswer } from "./aiService.js";
import { AnnotatedImage } from "./annotation.jsx";
import { ClozeCard, QuestionFigure, SequenceCard, generateWhyPrompt } from "./cards.jsx";
import { SK_CALIBRATION, classifyError, confToProb, incrementErrorPattern } from "./coreHelpers.js";
import { CreateModal } from "./createModal.jsx";
import { ConceptMap, DiagramRenderer, GraphCard, LabelledStructure, ProcessCard, ProgressiveDiagram, SketchCanvas, generateSVGDiagram } from "./diagrams.jsx";
import { fsrsNext, getCardState, getRetrievability, isCardDue, previewIntervals } from "./fsrs.js";
import { AdminBar, Header } from "./header.jsx";
import { selectCommandWordQuestions } from "./learningEngine.js";
import { AO_COLORS, autoHints, detectAOLabel, detectCW, detectCardType } from "./questionMeta.js";
import { ContentBlock, SmartNoteCard } from "./richText.jsx";
import { Flashcards } from "./flashcards.jsx";
import { ensureCardVariantCached, generateTransferQuestion, getLadderLevel, maybeUseVariantText, selectAdaptiveQuestions, updateAdaptiveLevel, updateLadderLevel, verifyExplanation } from "./scheduling.js";
import { ForecastBar, MemoryDecayChart, SRInfoTooltip } from "./studyWidgets.jsx";
import { B, C, I, mu, showToast, stripHtml, trackEvent, tx } from "./ui.jsx";
import React from "react";

export function SectionScreen(props) {
  const { D, addToSection, admin, bd2, bg, cramMode, curBData, curBoard, editInSection, elabOpen, elabText, enqueueOffline, errorPatternsAll, explainFeedback, explainText, fcConf, fcHintLvl, fcHist, fcIdx, fcSelfExp, fcSelfOpen, flip, goalModalShownThisTab, hProps, labelTestComplete, labelTestMode, logEvent, markTodayActive, marking, modal, noteSearch, qConf, qHintLvl, qIdx, qRes, qSelfDone, qSelfExp, removeExtra, runAchievementCheck, section, selOpt, setCalibrationData, setCramMode, setD, setElabOpen, setElabText, setExplainFeedback, setExplainText, setFCH, setFcConf, setFcHintLvl, setFcIdx, setFcSelfExp, setFcSelfOpen, setFlip, setFocusMode, setGoalModalShownThisTab, setLabelTestComplete, setLabelTestMode, setLadderTick, setMark, setModal, setNoteSearch, setQConf, setQHintLvl, setQIdx, setQRes, setQSelfDone, setQSelfExp, setScreen, setSelOpt, setShowGoalModal, setShowReflection, setShowSketch, setShuffledCards, setSmMdl, setStats, setSvgPreview, setTA, setTab, setTransferQuestion, showGoalModal, showMdl, showSketch, shuffledCards, subjDef, subjects, svgPreview, tab, textAns, touchStartRef, transferQuestion, user } = props;

    const inFocusMode = tab === "flashcards" || tab === "questions";
    const subj = subjDef;
    const cards = section.flashcards || [],
      rawQs = section.questions || [];

    const _epForSec = errorPatternsAll[subj?.id] || {};
    const _cwQs = Object.values(_epForSec).some((v) => v >= 5)
      ? selectCommandWordQuestions(rawQs, _epForSec, 30)
      : rawQs;
    const qs = selectAdaptiveQuestions(_cwQs, user, subj?.id);
    const safeFcIdx = cards.length > 0 ? Math.min(fcIdx, cards.length - 1) : 0;
    const fc = cards.length > 0 ? cards[safeFcIdx] : null;
    const q =
      transferQuestion ||
      (qs.length > 0 ? qs[Math.min(qIdx, qs.length - 1)] : null);
    const isCustomSec = section.src === "admin";
    const ladderTopicId = section._parentTopicId || section.id;
    const ladderLevel = getLadderLevel(user, ladderTopicId);
    const isAdminItem = (key, item) => {
      if (isCustomSec) return true;
      const extras = curBData.extras?.[section.id];
      return !!extras?.[key]?.find((x) => x.id === item.id);
    };
    const dueCards = cramMode
      ? cards
      : cards.filter((c) => isCardDue(fcHist, c.id));
    const curState = fc ? getCardState(fcHist, fc.id) : null;
    const previews = fc
      ? previewIntervals(curState)
      : ["today", "today", "6d", "1w"];
    const doSM2 = (rating) => {
      if (!fc) return;
      const cardId = fc.id;
      markTodayActive();
      if (!cramMode) {
        setFCH((prevHist) => {
          const prevState = getCardState(prevHist, cardId);
          const next = fsrsNext(prevState, rating);
          return { ...prevHist, [cardId]: next };
        });
      }
      const correct = rating >= 3;
      logEvent("card_rated", { subjectId: subj.id, sectionId: section.id, cardId, conf: rating, correct });
      updateLadderLevel(user, ladderTopicId, correct);
      setLadderTick((v) => v + 1);
      if (correct) {
        setElabOpen(true);
      }
      setStats((s) => {
        const wfc = { ...s.weakFC };

        wfc[section.id] = {
          wrong: (wfc[section.id]?.wrong || 0) + (correct ? 0 : 1),
          total: (wfc[section.id]?.total || 0) + 1,
        };
        const ss = { ...s.subjStats };
        ss[subj.id] = {
          ...ss[subj.id],
          fcC: (ss[subj.id]?.fcC || 0) + (correct ? 1 : 0),
          fcT: (ss[subj.id]?.fcT || 0) + 1,
        };
        return {
          ...s,
          fcC: s.fcC + (correct ? 1 : 0),
          fcT: s.fcT + 1,
          weakFC: wfc,
          subjStats: ss,
        };
      });
      setFlip(false);
      setFcIdx((i) => {
        const len = section.flashcards?.length || 0;
        return len > 0 ? (i < len - 1 ? i + 1 : 0) : 0;
      });
    };
    const handleDeleteFC = (id) => {
      removeExtra(section.id, "flashcards", id);

      setFcIdx((i) =>
        Math.min(i, Math.max(0, (section.flashcards?.length || 1) - 2)),
      );
      setFlip(false);
      showToast("Flashcard deleted");
    };
    const handleDeleteQ = (id) => {
      removeExtra(section.id, "questions", id);
      setQIdx(0);
      setQRes(null);
      setSelOpt(null);
      setTA("");
      setSmMdl(false);
      showToast("Question deleted");
    };
    const SM2_BTNS = [
      { label: "Again", color: "#ef4444", desc: "Forgot completely", q: 0 },
      { label: "Hard", color: "#f59e0b", desc: "Struggled", q: 1 },
      { label: "Good", color: "#3b82f6", desc: "Got it", q: 2 },
      { label: "Easy", color: "#10b981", desc: "Very easy", q: 3 },
    ];
    return (
      <div
        style={{ minHeight: "100vh", background: bg, color: tx(D) }}
        className="fade-in"
      >
        {!inFocusMode && <Header {...hProps} />}
        {inFocusMode && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              background: D ? "#13131f" : "#fff",
              borderBottom: `1px solid ${D ? "#262844" : "#e5e7eb"}`,
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => setTab("notes")}
              style={{
                fontSize: 13,
                color: D ? "#8896b3" : "#9ca3af",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {section?.title || "Back"}
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setTab("flashcards")}
                style={{
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: "none",
                  background: tab === "flashcards" ? "#7c3aed" : "transparent",
                  color:
                    tab === "flashcards" ? "#fff" : D ? "#8896b3" : "#9ca3af",
                  cursor: "pointer",
                  fontWeight: tab === "flashcards" ? 600 : 400,
                }}
              >
                Cards
              </button>
              <button
                onClick={() => setTab("questions")}
                style={{
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: "none",
                  background: tab === "questions" ? "#7c3aed" : "transparent",
                  color:
                    tab === "questions" ? "#fff" : D ? "#8896b3" : "#9ca3af",
                  cursor: "pointer",
                  fontWeight: tab === "questions" ? 600 : 400,
                }}
              >
                Questions
              </button>
            </div>
            <button
              onClick={() => setD(!D)}
              style={{
                fontSize: 15,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: D ? "#8896b3" : "#9ca3af",
              }}
            >
              {D ? "☀️" : "🌙"}
            </button>
          </div>
        )}
        <div
          style={{
            maxWidth: inFocusMode ? 680 : 760,
            margin: "0 auto",
            padding: inFocusMode ? "16px 24px" : "28px 24px",
            paddingBottom: 100,
          }}
        >
          {!inFocusMode && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setScreen("subject")}
                style={{
                  fontSize: 13,
                  color: mu(D),
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {subj.name}
              </button>
              <button
                onClick={() => setFocusMode(true)}
                style={{
                  fontSize: 12,
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid #7c3aed",
                  background: "transparent",
                  color: "#7c3aed",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Focus Mode
              </button>
            </div>
          )}
          {!inFocusMode && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {section.title}
              </h2>
              <p style={{ fontSize: 12, color: mu(D) }}>
                {subj.name} · {curBoard}
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              borderBottom: `1px solid ${bd2}`,
              marginBottom: 24,
              gap: 2,
            }}
          >
            {(subj._politics
              ? [["notes", "Notes"]]
              : [
                  ["notes", "Notes"],
                  ["flashcards", "Flashcards"],
                  ["questions", "Questions"],
                ]
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? subj.accent : mu(D),
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom:
                    tab === t
                      ? `2px solid ${subj.accent}`
                      : "2px solidtransparent",
                  marginBottom: -1,
                  transition: "color .15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "notes" && (
            <div className="fade-in">
              {admin && (
                <AdminBar
                  D={D}
                  actions={[
                    {
                      label: "＋ AddNote",
                      fn: () =>
                        setModal({ mode: "note", sectionId: section.id }),
                    },
                  ]}
                />
              )}
              {(section.notes || []).length > 2 && (
                <input
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder="Search notes…"
                  style={{ ...I(D, { marginBottom: 14, fontSize: 12 }) }}
                />
              )}
              {(() => {
                const allN = section.notes || [];
                const shown = noteSearch
                  ? allN.filter((n) =>
                      (
                        (n.heading || "") +
                        " " +
                        (typeof n.body === "string" ? stripHtml(n.body) : "")
                      )
                        .toLowerCase()
                        .includes(noteSearch.toLowerCase()),
                    )
                  : allN;
                if (!allN.length)
                  return (
                    <div
                      style={{
                        ...C(D),
                        padding: 40,
                        textAlign: "center",
                        color: mu(D),
                        fontSize: 14,
                      }}
                    >
                      No notes yet.{admin ? "Add one above." : ""}
                    </div>
                  );
                if (!shown.length)
                  return (
                    <p
                      style={{
                        fontSize: 13,
                        color: mu(D),
                        textAlign: "center",
                        padding: "20px 0",
                      }}
                    >
                      No notes match "{noteSearch}"
                    </p>
                  );
                return (
                  <div>
                    {shown.map((note) => (
                      <SmartNoteCard
                        key={note.id}
                        note={note}
                        D={D}
                        subjectAccent={subj.accent}
                        canEdit={admin && isAdminItem("notes", note)}
                        onEdit={() =>
                          setModal({
                            mode: "note",
                            sectionId: section.id,
                            initialItem: note,
                          })
                        }
                        onDelete={() => {
                          removeExtra(section.id, "notes", note.id);
                          showToast("Notedeleted");
                        }}
                        onAddVisual={async (note) => {
                          if (note._removeDiagram) {
                            editInSection(section.id, "notes", {
                              ...note,
                              diagram: null,
                              _removeDiagram: undefined,
                            });
                            showToast("Diagram removed");
                            return;
                          }
                          showToast("Generating diagram…");
                          try {
                            const textContent =
                              note.heading +
                              ": " +
                              stripHtml(note.body || "").slice(0, 500);
                            const prompt = `You are a GCSE revision diagram designer. Analyse this note and
return ONLY valid JSON (no markdown) for the best diagram.\n\nNote:
${textContent}\n\nChoose ONE type: process, cycle, hierarchy, comparison, structure,
timeline.\nReturn:
{"type":"process","accent":"#059669","data":{"steps":[{"id":"1","label":"Step","sublabel":"detail"}]}}
\nRules: labels max 4 words, max 8 items, use subject-appropriate accent colour.`;

                            const diagram = await _aiWithRetry(
                              async () => {
                                const raw = await callAI(prompt, 700);
                                const p = _parseAIJson(raw);
                                if (!p || !p.type)
                                  throw new Error("No diagram");
                                return p;
                              },
                              2,
                              null,
                            );
                            if (diagram) {
                              editInSection(section.id, "notes", {
                                ...note,
                                diagram,
                              });
                              showToast("Diagram added ✓", "success");
                            } else {
                              showToast(
                                "Could not generate diagram — try again",
                                "error",
                              );
                            }
                          } catch (err) {
                            showToast(
                              "Generation failed: " + err.message,
                              "error",
                            );
                          }
                        }}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
          {tab === "flashcards" && (
            <Flashcards
              cards={cards}
              fcHist={fcHist}
              setFCH={setFCH}
              D={D}
              accent={subj?.accent || "#7c3aed"}
              markTodayActive={markTodayActive}
              sectionTitle={section.title || section.name || ""}
            />
          )}

          {tab === "questions" && (
            <div className="fade-in">
              {admin && (
                <AdminBar
                  D={D}
                  actions={[
                    {
                      label: "＋ AddQuestion",
                      fn: () =>
                        setModal({ mode: "question", sectionId: section.id }),
                    },
                  ]}
                />
              )}
              {}
              {(() => {
                const ep = errorPatternsAll[subj?.id] || {};
                const epTotal = Object.values(ep).reduce((a, b) => a + b, 0);
                if (epTotal < 8) return null;
                const sorted = Object.entries(ep).sort((a, b) => b[1] - a[1]);
                const dominant = sorted[0][0];
                const pct = Math.round((sorted[0][1] / epTotal) * 100);
                const tips = {
                  "Knowledge Gap":
                    "Focus on recall — state definitions and key facts before explaining.",
                  "Command Word Error":
                    "Check the command word first. Evaluate = argue bothsides + conclude. Explain = WHY, not WHAT.",
                  "Application Error":
                    "Apply knowledge to the specific context. Link your answer to the scenario given.",
                  "Communication Error":
                    "Write in full sentences. Use PEEL: Point → Evidence →Explanation → Link.",
                };
                const icons = {
                  "Knowledge Gap": " ",
                  "Command Word Error": " ",
                  ApplicationError: " ",
                  "Communication Error": " ",
                };
                return (
                  <div
                    style={{
                      padding: "9px 14px",
                      borderRadius: 10,
                      marginBottom: 10,
                      background: D ? "rgba(245,158,11,.08)" : "#fffbeb",
                      border: "1px solid #f59e0b44",

                      fontSize: 12,
                      color: D ? "#fcd34d" : "#92400e",
                      lineHeight: 1.6,
                    }}
                  >
                    {icons[dominant]}{" "}
                    <strong>
                      Your main gap ({pct}% of errors): {dominant}
                    </strong>{" "}
                    —{tips[dominant]}
                  </div>
                );
              })()}
              {qs.length === 0 && (
                <div
                  style={{
                    ...C(D),
                    padding: 32,
                    textAlign: "center",
                    color: mu(D),
                    fontSize: 14,
                  }}
                >
                  No questions yet.{admin ? " Add one above." : ""}
                </div>
              )}
              {q &&
                (() => {
                  const qAOkey = detectAOLabel(q);
                  const qAOdef = AO_COLORS[qAOkey] || AO_COLORS.AO1;
                  const qCW = detectCW(q.text || "");
                  const hints3 = autoHints(q);
                  const wrongExpls = q.wrongAnswerExplanations || {};
                  return (
                    <>
                      {}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 13, color: mu(D) }}>
                          Question {qIdx + 1} of {qs.length}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            className="ao-badge"
                            style={{
                              background: D ? qAOdef.bgD : qAOdef.bg,
                              color: D ? qAOdef.txtD : qAOdef.txt,
                            }}
                          >
                            {qAOkey}
                          </span>
                          {qCW && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 10,
                                background: D
                                  ? "rgba(99,102,241,.15)"
                                  : "#f5f3ff",
                                color: "#7c3aed",
                              }}
                            >
                              {qCW.word.toUpperCase()}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 20,
                              background: subj.mid,
                              color: subj.dk,
                            }}
                          >
                            {q.marks} mark{q.marks !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      {}
                      {qCW && !qRes && (
                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            marginBottom: 10,
                            background: D ? "rgba(99,102,241,.08)" : "#f5f3ff",
                            border: "1px solid #7c3aed44",

                            fontSize: 11,
                            color: D ? "#ddd6fe" : "#4c1d95",
                            lineHeight: 1.55,
                          }}
                        >
                          <strong>{qCW.word.toUpperCase()}:</strong> {qCW.tip}
                        </div>
                      )}
                      {admin && isAdminItem("questions", q) && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "flex-end",
                            marginBottom: 8,
                          }}
                        >
                          <button
                            onClick={() =>
                              setModal({
                                mode: "question",
                                sectionId: section.id,
                                initialItem: q,
                              })
                            }
                            style={{
                              ...B("#7c3aed", true, {
                                fontSize: 12,
                                padding: "5px 12px",
                              }),
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQ(q.id)}
                            style={{
                              ...B("#ef4444", true, {
                                fontSize: 12,
                                padding: "5px 12px",
                              }),
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      <div style={{ ...C(D), padding: 24, marginBottom: 12 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 10,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.06em",
                              color: mu(D),
                              textTransform: "uppercase",
                            }}
                          >
                            {q.type === "mcq"
                              ? "Multiple Choice"
                              : q.type === "short"
                                ? "Short Answer"
                                : "ExtendedResponse"}
                          </span>
                          {q.year && (
                            <span style={{ fontSize: 11, color: mu(D) }}>
                              {q.year}
                            </span>
                          )}
                        </div>
                        {(q.images || []).map((img, ii) => (
                          <AnnotatedImage key={ii} img={img} D={D} />
                        ))}
                        {q.figure && (
                          <QuestionFigure
                            figure={q.figure}
                            D={D}
                            figureNumber={1}
                            DiagramRendererComp={DiagramRenderer}
                          />
                        )}
                        <ContentBlock
                          content={q.text}
                          D={D}
                          fontSize={15}
                          style={{ marginBottom: 18 }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => {
                              setTransferQuestion(generateTransferQuestion(q));
                              setQRes(null);
                              setSelOpt(null);
                              setTA("");
                            }}
                            style={{
                              fontSize: 12,
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #7c3aed",
                              background: "transparent",
                              color: "#7c3aed",
                              cursor: "pointer",
                            }}
                          >
                            Apply It
                          </button>
                          {q &&
                            /how does .* relate to|relate[s]? to/i.test(
                              (q.text || "").toLowerCase(),
                            ) && (
                              <details>
                                <summary
                                  style={{ cursor: "pointer", fontSize: 12 }}
                                >
                                  Concept Map
                                </summary>
                                <ConceptMap
                                  x={(q.text || "X").split(" ")[2]}
                                  y={(q.text || "Y").split(" ").slice(-1)[0]}
                                  relation="relates to"
                                  D={D}
                                />
                              </details>
                            )}
                        </div>
                        {}
                        {q.type === "mcq" && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {q.options.map((opt, oi) => {
                              const sel = selOpt === oi,
                                correct = oi === q.answer,
                                rev = qRes != null;
                              let bg2 = D ? "#1c1d30" : "#f9fafb",
                                br2 = bd2,
                                co2 = tx(D);
                              if (rev && correct) {
                                bg2 = "#dcfce7";
                                br2 = "#22c55e";
                                co2 = "#15803d";
                              } else if (rev && sel && !correct) {
                                bg2 = "#fee2e2";
                                br2 = "#ef4444";
                                co2 = "#b91c1c";
                              } else if (rev && !correct && !sel) {
                                bg2 = D ? "#1c1d30" : "#f9fafb";
                                br2 = bd2;
                                co2 = mu(D);
                              }
                              return (
                                <div key={oi}>
                                  <button
                                    onClick={() => {
                                      if (!qRes) {
                                        const ok = oi === q.answer;
                                        setSelOpt(oi);
                                        setQRes(ok ? "correct" : "wrong");
                                        markTodayActive();
                                        updateAdaptiveLevel(user, subj.id, ok);
                                        updateLadderLevel(
                                          user,
                                          ladderTopicId,
                                          ok,
                                        );
                                        setLadderTick((v) => v + 1);
                                        logEvent("question_answered", { subjectId: subj.id, sectionId: section.id, correct: ok });
                                        setStats((s) => {
                                          const wq = { ...s.weakQ };
                                          wq[section.id] = {
                                            wrong:
                                              (wq[section.id]?.wrong || 0) +
                                              (ok ? 0 : 1),
                                            total:
                                              (wq[section.id]?.total || 0) + 1,
                                          };
                                          const ss = { ...s.subjStats };
                                          ss[subj.id] = {
                                            ...ss[subj.id],
                                            qS:
                                              (ss[subj.id]?.qS || 0) +
                                              (ok ? 1 : 0),
                                            qM: (ss[subj.id]?.qM || 0) + 1,
                                            fcC: ss[subj.id]?.fcC || 0,
                                            fcT: ss[subj.id]?.fcT || 0,
                                          };
                                          return {
                                            ...s,
                                            qS: s.qS + (ok ? 1 : 0),
                                            qM: s.qM + 1,
                                            weakQ: wq,
                                            subjStats: ss,
                                          };
                                        });
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      textAlign: "left",
                                      padding: "11px 16px",
                                      borderRadius: 10,
                                      border: `1.5px solid ${br2}`,
                                      background: bg2,
                                      cursor: qRes ? "default" : "pointer",
                                      color: co2,
                                      fontSize: 13,
                                      transition: "all .15s",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontFamily: "monospace",
                                        fontSize: 11,
                                        opacity: 0.7,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {"ABCD"[oi]}.
                                    </span>
                                    <span style={{ flex: 1 }}>{opt}</span>
                                    {rev && correct && (
                                      <span
                                        style={{ fontSize: 14, flexShrink: 0 }}
                                      ></span>
                                    )}
                                    {rev && sel && !correct && (
                                      <span
                                        style={{ fontSize: 14, flexShrink: 0 }}
                                      ></span>
                                    )}
                                  </button>
                                  {}
                                  {rev && (correct || sel) && (
                                    <div
                                      className="hint-slide"
                                      style={{
                                        marginTop: 4,
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        fontSize: 11,
                                        lineHeight: 1.6,
                                        background: correct
                                          ? D
                                            ? "rgba(16,185,129,.1)"
                                            : "#f0fdf4"
                                          : D
                                            ? "rgba(239,68,68,.1)"
                                            : "#fef2f2",
                                        color: correct
                                          ? D
                                            ? "#6ee7b7"
                                            : "#15803d"
                                          : D
                                            ? "#fca5a5"
                                            : "#b91c1c",
                                      }}
                                    >
                                      {correct ? (
                                        <>
                                          <strong> Correct.</strong>{" "}
                                          {q.explanation ||
                                            "This is the right answer."}
                                        </>
                                      ) : (
                                        <>
                                          <strong> Incorrect.</strong>{" "}
                                          {wrongExpls[String(oi)] ||
                                            `The correct
answer is ${q.options[q.answer]}${q.explanation ? " — " + q.explanation : "."}`}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {}
                        {(q.type === "short" || q.type === "extended") && (
                          <div>
                            {}
                            {!qRes && (
                              <div style={{ marginBottom: 10 }}>
                                {qConf === null ? (
                                  <div
                                    style={{
                                      padding: "10px 14px",
                                      borderRadius: 10,
                                      background: D ? "#191a2b" : "#fafafa",
                                      border: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
                                    }}
                                  >
                                    <p
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: mu(D),
                                        marginBottom: 8,
                                      }}
                                    >
                                      How confident are you in your answer?
                                    </p>
                                    <div style={{ display: "flex", gap: 6 }}>
                                      {[
                                        {
                                          v: 1,
                                          l: "Not sure",
                                          c: "#ef4444",
                                          i: " ",
                                        },
                                        {
                                          v: 2,
                                          l: "Fairlysure",
                                          c: "#f59e0b",
                                          i: " ",
                                        },
                                        {
                                          v: 3,
                                          l: "Confident",
                                          c: "#10b981",
                                          i: " ",
                                        },
                                      ].map((opt) => (
                                        <button
                                          key={opt.v}
                                          onClick={() => setQConf(opt.v)}
                                          style={{
                                            flex: 1,
                                            padding: "7px 4px",
                                            borderRadius: 9,
                                            border: `1.5px solid ${opt.c}22`,
                                            background: D ? "#13131f" : "#fff",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            transition: "border-color .15s",
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor =
                                              opt.c;
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor =
                                              opt.c + "22";
                                          }}
                                        >
                                          <div style={{ fontSize: 16 }}>
                                            {opt.i}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 700,
                                              color: opt.c,
                                              marginTop: 2,
                                            }}
                                          >
                                            {opt.l}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: mu(D),
                                      marginBottom: 4,
                                      textAlign: "right",
                                    }}
                                  >
                                    Confidence:{" "}
                                    {
                                      ["Not sure", "Fairly sure", "Confident"][
                                        qConf - 1
                                      ]
                                    }
                                  </div>
                                )}
                              </div>
                            )}
                            {}
                            {!qRes && (
                              <div style={{ marginBottom: 10 }}>
                                {qHintLvl === 0 ? (
                                  <button
                                    onClick={() => setQHintLvl(1)}
                                    style={{
                                      fontSize: 11,
                                      color: mu(D),
                                      background: "none",
                                      border: `1px solid ${D ? "#374151" : "#d1d5db"}`,
                                      borderRadius: 8,
                                      padding: "5px 12px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Strategy hint
                                  </button>
                                ) : qHintLvl === 1 ? (
                                  <div
                                    className="hint-slide"
                                    style={{
                                      padding: "9px 13px",
                                      borderRadius: 10,
                                      background: D
                                        ? "rgba(245,158,11,.1)"
                                        : "#fffbeb",
                                      border: "1px solid #f59e0b33",
                                      fontSize: 12,
                                      color: D ? "#fcd34d" : "#92400e",
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    <strong>Strategy:</strong> {hints3[0]}
                                    <button
                                      onClick={() => setQHintLvl(2)}
                                      style={{
                                        display: "block",
                                        marginTop: 5,
                                        fontSize: 11,
                                        color: mu(D),
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      Need more help?
                                    </button>
                                  </div>
                                ) : qHintLvl === 2 ? (
                                  <div
                                    className="hint-slide"
                                    style={{
                                      padding: "9px 13px",
                                      borderRadius: 10,
                                      background: D
                                        ? "rgba(245,158,11,.1)"
                                        : "#fffbeb",
                                      border: "1px solid #f59e0b44",
                                      fontSize: 12,
                                      color: D ? "#fcd34d" : "#92400e",
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    <strong>Strategy:</strong> {hints3[0]}
                                    <br />
                                    <strong>Subject clue:</strong> {hints3[1]}
                                    <button
                                      onClick={() => setQHintLvl(3)}
                                      style={{
                                        display: "block",
                                        marginTop: 5,
                                        fontSize: 11,
                                        color: mu(D),
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      Show first mark
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className="hint-slide"
                                    style={{
                                      padding: "9px 13px",
                                      borderRadius: 10,
                                      background: D
                                        ? "rgba(245,158,11,.12)"
                                        : "#fffbeb",
                                      border: "1px solid #f59e0b55",
                                      fontSize: 12,
                                      color: D ? "#fcd34d" : "#92400e",
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    <strong>Strategy:</strong> {hints3[0]}
                                    <br />
                                    <strong>Subject clue:</strong> {hints3[1]}
                                    <br />
                                    <strong>First mark:</strong> {hints3[2]}
                                  </div>
                                )}
                              </div>
                            )}

                            <textarea
                              value={textAns}
                              onChange={(e) => setTA(e.target.value)}
                              disabled={!!qRes}
                              rows={q.type === "extended" ? 7 : 3}
                              placeholder={`Write your answer here… [${q.marks}
mark${q.marks !== 1 ? "s" : ""}]`}
                              style={{
                                ...I(D, {
                                  resize: "vertical",
                                  lineHeight: 1.65,
                                }),
                              }}
                            />
                            {!qRes && (
                              <button
                                onClick={async () => {
                                  if (!textAns.trim()) return;
                                  setMark(true);
                                  markTodayActive();
                                  trackEvent("question_submitted", {
                                    sectionId: section?.id,
                                    subjectId: subjDef?.id,
                                    tab: "questions",
                                  });
                                  try {
                                    const r = await markAnswer(q, textAns);
                                    const errType =
                                      typeof classifyError === "function"
                                        ? await Promise.resolve(
                                            classifyError(
                                              q,
                                              textAns,
                                              q.markScheme,
                                            ),
                                          ).catch(() => null)
                                        : detectErrorType(
                                            q.text,
                                            textAns,
                                            q.markScheme,
                                            r?.missedPoints,
                                          );
                                    if (errType) {
                                      incrementErrorPattern(
                                        user,
                                        subj.id,
                                        errType,
                                      );
                                      r.errorType = errType;
                                    }
                                    const pct =
                                      q.marks > 0 ? r.score / q.marks : 0;
                                    updateAdaptiveLevel(
                                      user,
                                      subj.id,
                                      pct >= 0.5,
                                    );
                                    updateLadderLevel(
                                      user,
                                      ladderTopicId,
                                      pct >= 0.5,
                                    );
                                    setLadderTick((v) => v + 1);
                                    setQRes(r);
                                    setStats((s) => {
                                      const wq = { ...s.weakQ };
                                      wq[section.id] = {
                                        wrong:
                                          (wq[section.id]?.wrong || 0) +
                                          (pct < 0.5 ? 1 : 0),
                                        total: (wq[section.id]?.total || 0) + 1,
                                      };
                                      const ss = { ...s.subjStats };
                                      ss[subj.id] = {
                                        ...ss[subj.id],
                                        qS:
                                          (ss[subj.id]?.qS || 0) +
                                          (r.score || 0),
                                        qM: (ss[subj.id]?.qM || 0) + q.marks,
                                        fcC: ss[subj.id]?.fcC || 0,
                                        fcT: ss[subj.id]?.fcT || 0,
                                      };
                                      return {
                                        ...s,
                                        qS: s.qS + (r.score || 0),
                                        qM: s.qM + q.marks,
                                        weakQ: wq,
                                        subjStats: ss,
                                      };
                                    });
                                  } catch (e) {
                                    setQRes({
                                      score: "?",
                                      feedback:
                                        "ReviseIQ AI unavailable — self-mark using the mark scheme below.",
                                      missedPoints: [],
                                      modelAnswer: q.sampleAnswer || "",
                                      examTip: "",
                                    });
                                  }
                                  setMark(false);
                                }}
                                disabled={!textAns.trim() || marking}
                                style={{
                                  marginTop: 10,
                                  width: "100%",
                                  background:
                                    textAns.trim() && !marking
                                      ? "#7c3aed"
                                      : "#9ca3af",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 12,
                                  padding: "12px 0",
                                  fontSize: 14,
                                  fontWeight: 600,
                                  cursor:
                                    textAns.trim() && !marking
                                      ? "pointer"
                                      : "not-allowed",
                                }}
                              >
                                {marking
                                  ? "Marking with ReviseIQ AI…"
                                  : "Submit for ReviseIQ AI Marking→"}
                              </button>
                            )}

                            {qRes &&
                              typeof qRes === "object" &&
                              qRes.feedback && (
                                <div
                                  style={{
                                    marginTop: 14,
                                    ...C(D),
                                    padding: 20,
                                    background: D ? "#1a1a2e" : "#f8f7ff",
                                    borderColor: "#7c3aed",
                                  }}
                                  className="fade-in"
                                >
                                  {}
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "flex-start",
                                      marginBottom: 10,
                                      flexWrap: "wrap",
                                      gap: 8,
                                    }}
                                  >
                                    <span
                                      style={{ fontWeight: 700, fontSize: 15 }}
                                    >
                                      ReviseIQ AI Marking
                                    </span>
                                    <div style={{ textAlign: "right" }}>
                                      <div
                                        style={{
                                          fontSize: 24,
                                          fontWeight: 900,
                                          lineHeight: 1,
                                          color:
                                            Number(qRes.score) >= q.marks * 0.7
                                              ? "#16a34a"
                                              : Number(qRes.score) >=
                                                  q.marks * 0.4
                                                ? "#d97706"
                                                : "#dc2626",
                                        }}
                                      >
                                        {qRes.score}/{q.marks}
                                      </div>
                                      {qConf && (
                                        <div
                                          style={{
                                            fontSize: 10,
                                            color: mu(D),
                                            marginTop: 2,
                                          }}
                                        >
                                          {(() => {
                                            const ap =
                                              q.marks > 0
                                                ? (Number(qRes.score) || 0) /
                                                  q.marks
                                                : 0;
                                            if (qConf === 3 && ap >= 0.7)
                                              return "Well-calibrated!";
                                            if (qConf === 1 && ap >= 0.7)
                                              return "Better than you thought!";
                                            if (qConf === 3 && ap < 0.5)
                                              return "Overconfident — review this";
                                            return "Keep practising";
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <p
                                    style={{
                                      fontSize: 13,
                                      lineHeight: 1.7,
                                      color: D ? "#d1d5db" : "#374151",
                                      marginBottom: 10,
                                    }}
                                  >
                                    {qRes.feedback}
                                  </p>
                                  {}
                                  {qRes.missedPoints?.length > 0 && (
                                    <div
                                      style={{
                                        marginBottom: 12,
                                        padding: "10px 14px",
                                        borderRadius: 10,
                                        background: D
                                          ? "rgba(239,68,68,.08)"
                                          : "#fef2f2",
                                        border: "1px solid #ef444422",
                                      }}
                                    >
                                      <p
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#dc2626",
                                          marginBottom: 6,
                                          textTransform: "uppercase",
                                          letterSpacing: "0.05em",
                                        }}
                                      >
                                        Points missed:
                                      </p>
                                      {qRes.missedPoints.map((pt, i) => (
                                        <div
                                          key={i}
                                          style={{
                                            fontSize: 12,
                                            color: "#dc2626",
                                            display: "flex",
                                            gap: 8,
                                            marginBottom: 3,
                                            lineHeight: 1.5,
                                          }}
                                        >
                                          <span style={{ flexShrink: 0 }}>
                                            •
                                          </span>
                                          <span>{pt}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {qRes.examTip && (
                                    <div
                                      style={{
                                        padding: "9px 12px",
                                        borderRadius: 10,
                                        background: D ? "#1e2f4a" : "#eff6ff",
                                        border: "1px solid #bfdbfe",
                                        marginBottom: 12,
                                      }}
                                    >
                                      <p
                                        style={{
                                          fontSize: 12,
                                          color: "#1d4ed8",
                                        }}
                                      >
                                        <strong>Exam tip:</strong>
                                        {qRes.examTip}
                                      </p>
                                    </div>
                                  )}
                                  {qRes.errorType && (
                                    <div
                                      style={{
                                        padding: "8px 12px",
                                        borderRadius: 10,
                                        background: D
                                          ? "rgba(245,158,11,.1)"
                                          : "#fffbeb",
                                        border: "1px solid #f59e0b55",
                                        marginBottom: 10,
                                        fontSize: 12,
                                        color: D ? "#fcd34d" : "#92400e",
                                      }}
                                    >
                                      Main error type:{" "}
                                      <strong>{qRes.errorType}</strong>
                                    </div>
                                  )}
                                  <details style={{ marginBottom: 8 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Structure Diagram
                                    </summary>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        flexWrap: "wrap",
                                        marginTop: 8,
                                      }}
                                    >
                                      {(
                                        qRes.structureDiagram || [
                                          "Point",
                                          "Evidence",
                                          "Explanation",
                                          "Application",
                                        ]
                                      ).map((s, idx) => (
                                        <React.Fragment key={idx}>
                                          <span
                                            style={{
                                              padding: "6px 10px",
                                              borderRadius: 8,
                                              background: D
                                                ? "#191a2b"
                                                : "#f5f3ff",
                                              fontSize: 11,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {s}
                                          </span>
                                          {idx <
                                            (qRes.structureDiagram || [])
                                              .length -
                                              1 && (
                                            <span
                                              style={{ color: mu(D) }}
                                            ></span>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </details>
                                  <details style={{ marginBottom: 8 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Progressive Reveal
                                    </summary>
                                    <div style={{ marginTop: 8 }}>
                                      <ProgressiveDiagram
                                        D={D}
                                        steps={(
                                          qRes.structureDiagram || []
                                        ).map(function (s) {
                                          return { text: s, svg: null };
                                        })}
                                      />
                                    </div>
                                  </details>
                                  <details style={{ marginBottom: 8 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Annotated Model Answer
                                    </summary>
                                    <div
                                      style={{
                                        marginTop: 8,
                                        lineHeight: 1.8,
                                        fontSize: 13,
                                      }}
                                    >
                                      {(Array.isArray(qRes.annotatedAnswer)
                                        ? qRes.annotatedAnswer
                                        : []
                                      ).map((seg, idx) => {
                                        const bg =
                                          seg.type === "point"
                                            ? "#dcfce7"
                                            : seg.type === "evidence"
                                              ? "#dbeafe"
                                              : "#fef3c7";
                                        return (
                                          <span
                                            key={idx}
                                            style={{
                                              background: bg,
                                              padding: "1px 4px",
                                              borderRadius: 4,
                                              marginRight: 4,
                                            }}
                                          >
                                            {seg.text}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </details>
                                  <details style={{ marginBottom: 8 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Comparison Table
                                    </summary>
                                    <table
                                      style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        marginTop: 8,
                                        fontSize: 12,
                                      }}
                                    >
                                      <thead>
                                        <tr>
                                          <th
                                            style={{
                                              border: "1px solid #cbd5e1",
                                              padding: 6,
                                              textAlign: "left",
                                            }}
                                          >
                                            Student Answer
                                          </th>
                                          <th
                                            style={{
                                              border: "1px solid #cbd5e1",
                                              padding: 6,
                                              textAlign: "left",
                                            }}
                                          >
                                            Mark Scheme Expectation
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(qRes.comparisonTable || []).map(
                                          (row, ri) => (
                                            <tr key={ri}>
                                              <td
                                                style={{
                                                  border: "1px solid #cbd5e1",
                                                  padding: 6,
                                                }}
                                              >
                                                {row.student}
                                              </td>
                                              <td
                                                style={{
                                                  border: "1px solid #cbd5e1",
                                                  padding: 6,
                                                }}
                                              >
                                                {row.expectation}
                                              </td>
                                            </tr>
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </details>
                                  <details style={{ marginBottom: 12 }}>
                                    <summary
                                      style={{
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        fontSize: 12,
                                      }}
                                    >
                                      Worked Solution
                                    </summary>
                                    <pre
                                      style={{
                                        marginTop: 8,
                                        whiteSpace: "pre-wrap",
                                        fontSize: 12,
                                        fontFamily: "IBMPlex Mono, monospace",
                                        background: D ? "#0a0a14" : "#f8fafc",
                                        padding: 10,
                                        borderRadius: 8,
                                      }}
                                    >
                                      {qRes.workedSolution ||
                                        qRes.modelAnswer ||
                                        q.sampleAnswer ||
                                        ""}
                                    </pre>
                                  </details>
                                  {}

                                  {!qSelfDone ? (
                                    <div style={{ marginBottom: 12 }}>
                                      <p
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: D ? "#ddd6fe" : "#5b21b6",
                                          marginBottom: 6,
                                        }}
                                      >
                                        Before the model answer — write one
                                        thing you missed or would do
                                        differently:
                                      </p>
                                      <textarea
                                        value={qSelfExp}
                                        onChange={(e) =>
                                          setQSelfExp(e.target.value)
                                        }
                                        rows={2}
                                        placeholder="e.g. 'I forgot to link cause to effect' or 'I missed units'"
                                        style={{
                                          ...I(D, {
                                            resize: "none",
                                            fontSize: 12,
                                            marginBottom: 6,
                                          }),
                                        }}
                                      />
                                      <button
                                        onClick={() => setQSelfDone(true)}
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          padding: "7px 16px",
                                          borderRadius: 8,
                                          border: "none",
                                          background: "#7c3aed",
                                          color: "#fff",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Save &amp; see model answer
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      {qSelfExp && (
                                        <div
                                          style={{
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            marginBottom: 10,
                                            background: D
                                              ? "rgba(99,102,241,.1)"
                                              : "#f5f3ff",
                                            border: "1px solid #7c3aed22",
                                            fontSize: 11,
                                            color: D ? "#c4b5fd" : "#5b21b6",
                                          }}
                                        >
                                          <strong>Your reflection:</strong>{" "}
                                          {qSelfExp}
                                        </div>
                                      )}
                                      <button
                                        onClick={() => setSmMdl(!showMdl)}
                                        style={{
                                          fontSize: 12,
                                          color: mu(D),
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          textDecoration: "underline",
                                          marginBottom: 8,
                                          display: "block",
                                        }}
                                      >
                                        {showMdl ? "Hide" : "Show"} model answer
                                      </button>
                                      {showMdl && (
                                        <div
                                          style={{
                                            padding: "12px 14px",
                                            borderRadius: 10,
                                            background: D
                                              ? "#13131f"
                                              : "#f9fafb",
                                            border: `1px solid ${bd2}`,
                                            marginBottom: 6,
                                          }}
                                        >
                                          <p
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 700,
                                              color: mu(D),
                                              marginBottom: 6,
                                              textTransform: "uppercase",
                                              letterSpacing: "0.05em",
                                            }}
                                          >
                                            Model Answer
                                          </p>
                                          <ContentBlock
                                            content={
                                              qRes.modelAnswer ||
                                              q.sampleAnswer ||
                                              ""
                                            }
                                            D={D}
                                            fontSize={13}
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                      {qRes && (
                        <button
                          onClick={() => {
                            setQIdx((i) => (i < qs.length - 1 ? i + 1 : 0));
                            setQRes(null);
                            setSelOpt(null);
                            setTA("");
                            setSmMdl(false);
                            setQHintLvl(0);
                            setQConf(null);
                            setQSelfExp("");
                            setQSelfDone(false);
                            setTransferQuestion(null);
                          }}
                          style={{
                            width: "100%",
                            ...B(subj.accent, false, {
                              padding: "12px 0",
                              borderRadius: 12,
                              fontSize: 14,
                            }),
                          }}
                        >
                          {qIdx < qs.length - 1
                            ? "Next Question →"
                            : "↺ Restart"}
                        </button>
                      )}
                    </>
                  );
                })()}
            </div>
          )}
        </div>
        {modal?.mode === "note" && (
          <CreateModal
            mode="note"
            D={D}
            subjects={subjects}
            initialItem={modal.initialItem}
            onClose={() => setModal(null)}
            onSave={(item) =>
              modal.initialItem
                ? editInSection(modal.sectionId, "notes", item)
                : addToSection(modal.sectionId, "notes", item)
            }
          />
        )}
        {modal?.mode === "flashcard" && (
          <CreateModal
            mode="flashcard"
            D={D}
            subjects={subjects}
            initialItem={modal.initialItem}
            onClose={() => setModal(null)}
            onSave={(item) =>
              modal.initialItem
                ? editInSection(modal.sectionId, "flashcards", item)
                : addToSection(modal.sectionId, "flashcards", item)
            }
          />
        )}
        {modal?.mode === "question" && (
          <CreateModal
            mode="question"
            D={D}
            subjects={subjects}
            initialItem={modal.initialItem}
            onClose={() => setModal(null)}
            onSave={(item) =>
              modal.initialItem
                ? editInSection(modal.sectionId, "questions", item)
                : addToSection(modal.sectionId, "questions", item)
            }
          />
        )}
      </div>
    );
  
}
