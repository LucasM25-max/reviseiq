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
          {tab === "flashcards" &&
            (() => {
              // NOTE: the session-goal modal must NOT be triggered here.
              // Calling parent setState during this child's render crashes the
              // flashcards tab ("Cannot update a component while rendering a
              // different component"). It is opened from the Focus Mode control
              // instead. See setShowGoalModal usage in the header actions.
              const [shuffled, setShuffled] = [shuffledCards, setShuffledCards];
              const activeCards = shuffled || cards;
              const safeFI =
                activeCards.length > 0
                  ? Math.min(fcIdx, activeCards.length - 1)
                  : 0;
              const fc2 = activeCards.length > 0 ? activeCards[safeFI] : null;
              const curState2 = fc2 ? getCardState(fcHist, fc2.id) : null;
              const reviewCount = Number(curState2?.reps || 0);
              const stabilityDays = Number(curState2?.stability || 0);
              if (fc2) {
                ensureCardVariantCached(
                  user,
                  fc2,
                  reviewCount,
                  stabilityDays,
                ).catch(function () {});
              }
              const fcVariantText = fc2
                ? maybeUseVariantText(user, fc2, reviewCount, stabilityDays)
                : null;
              const previews2 = fc2
                ? previewIntervals(curState2)
                : ["today", "today", "6d", "1w"];
              const dueCards2 = cramMode
                ? activeCards
                : activeCards.filter((c) => isCardDue(fcHist, c.id));

              const cardType2 = fc2
                ? detectCardType(fc2.q || "")
                : { label: "Recall", color: "#7c3aed", icon: "🧠" };

              const fcHints2 = fc2
                ? [
                    fc2.hint1 ||
                      `Think: the answer relates to "${(fc2.a || "").split(" ").slice(0, 5).join(" ")}…"`,
                    fc2.hint2 ||
                      `This is a ${cardType2.icon} ${cardType2.label} card.
${cardType2.label === "Calculate" ? "Start by writing the formula." : cardType2.label === "Explain" ? "Use 'because' or 'therefore' in your answer." : "Think about the key term or process being tested."}`,
                  ]
                : [
                    "Think carefully before flipping.",
                    "Consider which topic this relates to.",
                  ];

              const handleTouchStart = (e) => {
                touchStartRef.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                };
              };
              const handleTouchEnd = (e) => {
                if (!touchStartRef.current) return;
                const dx =
                  e.changedTouches[0].clientX - touchStartRef.current.x;
                const dy = Math.abs(
                  e.changedTouches[0].clientY - touchStartRef.current.y,
                );
                touchStartRef.current = null;
                if (Math.abs(dx) < 40 || dy > Math.abs(dx)) return;
                if (fcConf === null) return;
                setFlip(false);
                setFcConf(null);
                setFcHintLvl(0);
                setFcSelfExp("");
                setFcSelfOpen(false);
                if (dx < 0)
                  setFcIdx((i) => (i < activeCards.length - 1 ? i + 1 : 0));
                else setFcIdx((i) => (i > 0 ? i - 1 : activeCards.length - 1));
              };
              const doSM2local = (rating) => {
                if (!fc2) return;
                const cardId = fc2.id;
                markTodayActive();
                enqueueOffline({
                  type: "fsrs",
                  payload: {
                    cardId: cardId,
                    rating: rating,
                    subjectId: subjDef?.id || "",
                    sectionId: section?.id || "",
                  },
                });
                if (!cramMode) {
                  setFCH((prevH) => {
                    const ps = getCardState(prevH, cardId);
                    return { ...prevH, [cardId]: fsrsNext(ps, rating) };
                  });
                }
                const correct = rating >= 3;
                updateLadderLevel(user, ladderTopicId, correct);
                setLadderTick((v) => v + 1);

                if (fcConf !== null) {
                  const pred = confToProb(fcConf);
                  const outcome = correct ? 1 : 0;
                  const sId = subjDef?.id || "";
                  setCalibrationData((prev) => {
                    const cur = prev[sId] || [];
                    const next = [
                      ...cur,
                      { pred, outcome, ts: Date.now() },
                    ].slice(-200);

                    window.storage
                      .set(
                        SK_CALIBRATION(user, sId),
                        JSON.stringify(next),
                        true,
                      )
                      .catch(() => {});
                    return { ...prev, [sId]: next };
                  });
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
                trackEvent("card_rated", {
                  sectionId: section?.id,
                  subjectId: subjDef?.id,
                  value: rating,
                });
                setFlip(false);
                setFcConf(null);
                setFcHintLvl(0);
                setFcSelfExp("");
                setFcSelfOpen(false);
                if (correct) setElabOpen(true);
                setFcIdx((i) => {
                  const len = activeCards.length;
                  return len > 0 ? (i < len - 1 ? i + 1 : 0) : 0;
                });

                setTimeout(() => runAchievementCheck(null), 300);
              };

              const CONF3 = [
                {
                  v: 1,
                  label: "Not sure",
                  icon: "😕",
                  color: "#ef4444",
                  tip: "I'll need to see this again",
                },
                {
                  v: 2,
                  label: "Maybe",
                  icon: "🙂",
                  color: "#f59e0b",
                  tip: "I kind of knew it",
                },
                {
                  v: 3,
                  label: "Got it",
                  icon: "😎",
                  color: "#10b981",
                  tip: "I know this well",
                },
              ];
              const SM2B = [
                { label: "Again", color: "#ef4444", rating: 1 },
                { label: "Hard", color: "#f59e0b", rating: 2 },
                { label: "Good", color: "#3b82f6", rating: 3 },
                { label: "Easy", color: "#10b981", rating: 4 },
              ];

              const isDualCoded = !!(fc2?.cardImage || fc2?.diagram);

              const hasLabelTest = !!(
                fc2?.diagram?.type === "structure" &&
                (fc2?.diagram?.data?.labels || []).length > 0
              );
              return (
                <div className="fade-in">
                  {admin && (
                    <AdminBar
                      D={D}
                      actions={[
                        {
                          label: "＋ AddFlashcard",
                          fn: () =>
                            setModal({
                              mode: "flashcard",
                              sectionId: section.id,
                            }),
                        },
                      ]}
                    />
                  )}

                  {activeCards.length === 0 && (
                    <div
                      style={{
                        ...C(D),
                        padding: 32,
                        textAlign: "center",
                        color: mu(D),
                        fontSize: 14,
                      }}
                    >
                      No flashcards yet.{admin ? " Add one above." : ""}
                    </div>
                  )}
                  {fc2 && (
                    <div>
                      {}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 14px",
                          borderRadius: 10,
                          background: D ? "#191a2b" : "#f3f4f6",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 12, color: mu(D) }}>
                          <strong
                            style={{
                              color: cramMode
                                ? "#7c3aed"
                                : dueCards2.length > 0
                                  ? "#f59e0b"
                                  : tx(D),
                            }}
                          >
                            {cramMode ? "CRAM" : dueCards2.length}
                          </strong>
                          {cramMode ? " mode" : " due"} ·{" "}
                          {
                            activeCards.filter((c) => {
                              const s = getCardState(fcHist, c.id);
                              return s && !isCardDue(fcHist, c.id);
                            }).length
                          }{" "}
                          scheduled
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            onClick={() => {
                              if (shuffled) {
                                setShuffled(null);
                                setFcIdx(0);
                                setFlip(false);
                                setFcConf(null);
                                showToast("Shuffle off");
                              } else {
                                const arr = [...cards].sort(
                                  () => Math.random() - 0.5,
                                );
                                setShuffled(arr);
                                setFcIdx(0);
                                setFlip(false);
                                setFcConf(null);
                                showToast("Shuffled!");
                              }
                            }}
                            style={{
                              fontSize: 10,
                              padding: "3px 9px",
                              borderRadius: 8,
                              border: `1.5px solid ${shuffled ? "#f59e0b" : "#d1d5db"}`,
                              background: shuffled ? "#f59e0b" : "transparent",
                              color: shuffled ? "#fff" : mu(D),
                              cursor: "pointer",
                              fontWeight: shuffled ? 700 : 400,
                            }}
                          >
                            {" "}
                          </button>
                          <button
                            onClick={() => {
                              setCramMode((v) => !v);
                              setFcIdx(0);
                              setFlip(false);
                              setFcConf(null);
                            }}
                            style={{
                              fontSize: 10,
                              padding: "3px 9px",
                              borderRadius: 8,
                              border: `1.5px solid ${cramMode ? "#7c3aed" : "#d1d5db"}`,
                              background: cramMode ? "#7c3aed" : "transparent",
                              color: cramMode ? "#fff" : mu(D),
                              cursor: "pointer",
                              fontWeight: cramMode ? 700 : 400,
                            }}
                          >
                            Cram
                          </button>
                          {hasLabelTest && (
                            <button
                              onClick={() => {
                                setLabelTestMode((v) => !v);
                                setLabelTestComplete(false);
                              }}
                              style={{
                                fontSize: 10,
                                padding: "3px 9px",
                                borderRadius: 8,
                                border: `1.5px solid ${labelTestMode ? "#0891B2" : "#d1d5db"}`,
                                background: labelTestMode
                                  ? "#0891B2"
                                  : "transparent",

                                color: labelTestMode ? "#fff" : mu(D),
                                cursor: "pointer",
                                fontWeight: labelTestMode ? 700 : 400,
                              }}
                            >
                              Label Test
                            </button>
                          )}
                          <span style={{ fontSize: 11, color: mu(D) }}>
                            FSRS
                          </span>
                          <SRInfoTooltip D={D} />
                        </div>
                      </div>
                      {}
                      {fc2 && curState2 && curState2.stability > 0 && (
                        <MemoryDecayChart
                          D={D}
                          cardState={curState2}
                          accent={subj.accent}
                        />
                      )}
                      <ForecastBar
                        cards={activeCards}
                        fcHist={fcHist}
                        D={D}
                        accent={subj.accent}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                          marginTop: 10,
                        }}
                      >
                        <span style={{ fontSize: 13, color: mu(D) }}>
                          {safeFI + 1} / {activeCards.length}
                          {shuffled ? "" : ""}
                        </span>

                        <span style={{ fontSize: 12, color: mu(D) }}>
                          {cramMode
                            ? "cram"
                            : curState2
                              ? curState2.reps > 0
                                ? `${curState2.interval}d`
                                : "new"
                              : "new"}
                        </span>
                      </div>
                      {}
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                          marginBottom: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 12,
                            background: cardType2.color + "22",
                            color: cardType2.color,
                          }}
                        >
                          {cardType2.icon} {cardType2.label}
                        </span>
                        {isDualCoded && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 10,
                              background: D
                                ? "rgba(99,102,241,.15)"
                                : "#f5f3ff",
                              color: "#7c3aed",
                            }}
                          >
                            Dual-coded
                          </span>
                        )}
                        {hasLabelTest && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 10,
                              background: D ? "rgba(8,145,178,.15)" : "#f0f9ff",
                              color: D ? "#67e8f9" : "#0e7490",
                            }}
                          >
                            {(fc2.diagram.data?.labels || []).length} labels
                          </span>
                        )}
                        {curState2 && (
                          <span
                            style={{
                              fontSize: 10,
                              color: mu(D),
                              background: D ? "#191a2b" : "#f3f4f6",
                              padding: "3px 8px",
                              borderRadius: 10,
                            }}
                          >{`Stability: ${curState2.stability?.toFixed(1)}d ·
${getRetrievability(fcHist, fc2.id) ?? "—"}% recall`}</span>
                        )}
                      </div>

                      {admin && fc2 && isAdminItem("flashcards", fc2) && (
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
                                mode: "flashcard",
                                sectionId: section.id,
                                initialItem: fc2,
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
                            onClick={() => handleDeleteFC(fc2.id)}
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

                      {}
                      {!flip && fcConf === null && (
                        <div
                          style={{
                            marginBottom: 12,
                            padding: "12px 16px",
                            borderRadius: 12,
                            background: D ? "#191a2b" : "#fafafa",
                            border: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: mu(D),
                              marginBottom: 10,
                              textAlign: "center",
                            }}
                          >
                            Before you flip — how confident are you?
                          </p>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3,1fr)",
                              gap: 8,
                            }}
                          >
                            {CONF3.map((opt) => (
                              <button
                                key={opt.v}
                                onClick={() => setFcConf(opt.v)}
                                className="conf-pop"
                                style={{
                                  padding: "10px 4px",
                                  borderRadius: 12,
                                  border: `2px solid ${opt.color}22`,
                                  background: D ? "#13131f" : "#fff",
                                  cursor: "pointer",
                                  textAlign: "center",
                                  transition: "border-color .15s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = opt.color;
                                  e.currentTarget.style.background = opt.color + "15";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor =
                                    opt.color + "22";
                                  e.currentTarget.style.background = D ? "#13131f" : "#fff";
                                }}
                              >
                                <div style={{ fontSize: 20, marginBottom: 3 }}>
                                  {opt.icon}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: opt.color,
                                  }}
                                >
                                  {opt.label}
                                </div>
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: mu(D),
                                    marginTop: 1,
                                  }}
                                >
                                  {opt.tip}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {}
                      {!flip && fcConf !== null && (
                        <div style={{ marginBottom: 10 }}>
                          {fcHintLvl === 0 ? (
                            <button
                              onClick={() => setFcHintLvl(1)}
                              style={{
                                fontSize: 11,
                                color: mu(D),
                                background: "none",
                                border: `1px solid ${D ? "#374151" : "#d1d5db"}`,
                                borderRadius: 8,
                                padding: "5px 12px",
                                cursor: "pointer",
                                marginBottom: 6,
                              }}
                            >
                              Need a hint?
                            </button>
                          ) : fcHintLvl === 1 ? (
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
                                marginBottom: 6,
                              }}
                            >
                              <strong>Hint 1:</strong> {fcHints2[0]}
                              <button
                                onClick={() => setFcHintLvl(2)}
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
                                Still not sure? See hint 2
                              </button>
                            </div>
                          ) : (
                            <div
                              className="hint-slide"
                              style={{
                                padding: "9px 13px",
                                borderRadius: 10,
                                background: D
                                  ? "rgba(245,158,11,.1)"
                                  : "#fffbeb",
                                border: "1px solid #f59e0b55",
                                fontSize: 12,
                                color: D ? "#fcd34d" : "#92400e",
                                lineHeight: 1.6,
                                marginBottom: 6,
                              }}
                            >
                              <strong>Hint 1:</strong> {fcHints2[0]}
                              <br />
                              <strong>Hint 2:</strong> {fcHints2[1]}
                            </div>
                          )}
                        </div>
                      )}

                      {}
                      {labelTestMode && hasLabelTest ? (
                        <div style={{ ...C(D), padding: 20, marginBottom: 14 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 12,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: D ? "#67e8f9" : "#0e7490",
                                }}
                              >
                                Label Reveal Test
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: mu(D),
                                  marginTop: 2,
                                }}
                              >
                                Type each label from memory. All correct to
                                continue.
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setLabelTestMode(false);
                                setLabelTestComplete(false);
                              }}
                              style={{
                                fontSize: 11,
                                color: mu(D),
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              Exit
                            </button>
                          </div>
                          {!labelTestComplete ? (
                            <LabelledStructure
                              imageUrl={fc2.diagram.data?.imageUrl || null}
                              labels={fc2.diagram.data?.labels || []}
                              accent={fc2.diagram.accent || subj.accent}
                              D={D}
                              width={560}
                              selfTestMode={true}
                              onAllCorrect={() => {
                                setLabelTestComplete(true);
                                markTodayActive();
                                showToast(
                                  "All labels correct!",
                                  "success",
                                  2600,
                                );
                              }}
                            />
                          ) : (
                            <div
                              style={{ textAlign: "center", padding: "20px 0" }}
                            >
                              <div style={{ fontSize: 36, marginBottom: 8 }}>
                                {" "}
                              </div>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 700,
                                  marginBottom: 4,
                                  color: "#059669",
                                }}
                              >
                                All labels correct!
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: mu(D),
                                  marginBottom: 16,
                                }}
                              >
                                Rate how well you knew this:
                              </div>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(4,1fr)",
                                  gap: 8,
                                  maxWidth: 360,
                                  margin: "0auto",
                                }}
                              >
                                {[
                                  {
                                    label: "Again",
                                    color: "#ef4444",
                                    rating: 1,
                                  },
                                  {
                                    label: "Hard",
                                    color: "#f59e0b",
                                    rating: 2,
                                  },
                                  {
                                    label: "Good",
                                    color: "#3b82f6",
                                    rating: 3,
                                  },
                                  {
                                    label: "Easy",
                                    color: "#10b981",
                                    rating: 4,
                                  },
                                ].map((btn) => (
                                  <button
                                    key={btn.rating}
                                    onClick={() => {
                                      doSM2local(btn.rating);
                                      setLabelTestMode(false);
                                      setLabelTestComplete(false);
                                    }}
                                    style={{
                                      padding: "10px 4px",
                                      borderRadius: 12,
                                      border: `2px solid ${btn.color}`,
                                      background: "transparent",
                                      cursor: "pointer",
                                      color: btn.color,
                                      fontWeight: 700,
                                      fontSize: 13,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        btn.color;
                                      e.currentTarget.style.color = "#fff";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "transparent";
                                      e.currentTarget.style.color = btn.color;
                                    }}
                                  >
                                    {btn.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="fc-scene"
                          onTouchStart={handleTouchStart}
                          onTouchEnd={handleTouchEnd}
                        >
                          <div
                            className={`fc-card${flip ? " flipped" : ""}`}
                            onClick={() => {
                              if (fcConf !== null) {
                                setFlip((v) => !v);
                                setFcHintLvl(0);
                              }
                            }}
                            style={{
                              minHeight: isDualCoded ? 260 : 180,
                              borderRadius: 14,
                              border: `1.5px solid ${flip ? subj.accent : bd2}`,
                              cursor: fcConf !== null ? "pointer" : "default",
                              opacity: fcConf === null ? 0.5 : 1,
                              transition: "opacity .2s",
                            }}
                          >
                            {}
                            <div
                              className="fc-face"
                              style={{
                                background: D ? "#13131f" : "#fff",
                                padding: "20px 24px",
                                justifyContent: "flex-start",
                              }}
                            >
                              {isDualCoded && (
                                <div
                                  style={{
                                    width: "100%",
                                    marginBottom: 12,
                                    opacity: 0.75,
                                    transition: "opacity .3s",
                                  }}
                                >
                                  {fc2.cardImage ? (
                                    <img
                                      src={fc2.cardImage}
                                      alt="card visual"
                                      style={{
                                        maxWidth: "100%",
                                        maxHeight: 130,
                                        borderRadius: 8,
                                        display: "block",
                                        margin: "0 auto",
                                        border: `1px solid ${D ? "#262844" : "#e5e7eb"}`,
                                      }}
                                    />
                                  ) : fc2.diagram ? (
                                    <DiagramRenderer
                                      diagram={fc2.diagram}
                                      D={D}
                                      width={400}
                                    />
                                  ) : null}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  letterSpacing: "0.1em",
                                  color: mu(D),
                                  textTransform: "uppercase",
                                  marginBottom: 8,
                                  alignSelf: "flex-start",
                                }}
                              >
                                Question
                                {fcConf !== null && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: CONF3.find((c) => c.v === fcConf)
                                        ?.color,
                                    }}
                                  >
                                    · {CONF3.find((c) => c.v === fcConf)?.icon}{" "}
                                    {CONF3.find((c) => c.v === fcConf)?.label}
                                  </span>
                                )}
                              </div>
                              {(fc2.images || []).length > 0 &&
                                fc2.images.map((img, ii) => (
                                  <AnnotatedImage key={ii} img={img} D={D} />
                                ))}
                              <ContentBlock
                                content={
                                  fc2.type === "cloze"
                                    ? String(fc2.text || fc2.q || "").replace(
                                        /\{\{(.*?)\}\}/g,
                                        "_____",
                                      )
                                    : fc2.type === "sequence"
                                      ? fc2.prompt ||
                                        "Arrange these steps in the correct order."
                                      : fcVariantText || fc2.q
                                }
                                D={D}
                                fontSize={15}
                                style={{
                                  color: tx(D),
                                  textAlign: isDualCoded ? "left" : "center",
                                  width: "100%",
                                }}
                              />
                              {fcConf === null ? (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: mu(D),
                                    marginTop: 14,
                                    alignSelf: "center",
                                  }}
                                >
                                  {" "}
                                  Rate your confidence first
                                </p>
                              ) : (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: mu(D),
                                    marginTop: 14,
                                    alignSelf: "center",
                                  }}
                                >
                                  Tap to reveal · Swipe to navigate
                                </p>
                              )}
                            </div>
                            {}
                            <div
                              className="fc-face fc-back"
                              style={{
                                background: D ? "#1a1040" : "#f5f3ff",
                                borderRadius: 14,
                                padding: "20px 24px",
                                justifyContent: "flex-start",
                              }}
                            >
                              {isDualCoded && (
                                <div
                                  style={{ width: "100%", marginBottom: 12 }}
                                >
                                  {fc2.cardImage ? (
                                    <div>
                                      <img
                                        src={fc2.cardImage}
                                        alt="card visual"
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: 140,
                                          borderRadius: 8,
                                          display: "block",
                                          margin: "0 auto",
                                          border: `1.5px solid ${subj.accent}44`,
                                        }}
                                      />
                                      {fc2.cardImageCaption && (
                                        <p
                                          style={{
                                            fontSize: 10,
                                            color: subj.accent,
                                            textAlign: "center",
                                            marginTop: 4,
                                            fontStyle: "italic",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {fc2.cardImageCaption}
                                        </p>
                                      )}
                                    </div>
                                  ) : fc2.diagram ? (
                                    <DiagramRenderer
                                      diagram={fc2.diagram}
                                      D={D}
                                      width={400}
                                    />
                                  ) : null}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  letterSpacing: "0.1em",
                                  color: subj.accent,
                                  textTransform: "uppercase",
                                  marginBottom: 8,
                                  alignSelf: "flex-start",
                                }}
                              >
                                Answer
                              </div>
                              {fc2.type === "cloze" ||
                              fc2.type === "sequence" ||
                              fc2.type === "process" ||
                              fc2.type === "graph" ? (
                                fc2.type === "cloze" ? (
                                  <ClozeCard
                                    card={fc2}
                                    D={D}
                                    onSubmit={() => setFcSelfOpen(true)}
                                    DiagramRendererComp={DiagramRenderer}
                                  />
                                ) : fc2.type === "sequence" ? (
                                  <SequenceCard
                                    card={fc2}
                                    D={D}
                                    onSubmit={() => setFcSelfOpen(true)}
                                  />
                                ) : fc2.type === "process" ? (
                                  <ProcessCard card={fc2} D={D} />
                                ) : (
                                  <GraphCard card={fc2} D={D} />
                                )
                              ) : (
                                <ContentBlock
                                  content={fc2.a}
                                  D={D}
                                  fontSize={15}
                                  style={{
                                    color: subj.accent,
                                    fontWeight: 500,
                                    textAlign: isDualCoded ? "left" : "center",
                                    width: "100%",
                                  }}
                                />
                              )}
                              {!!fc2?.diagram && (
                                <div style={{ marginTop: 8 }}>
                                  <button
                                    onClick={() => setShowSketch((s) => !s)}
                                    style={{
                                      fontSize: 11,
                                      padding: "4px 9px",
                                      borderRadius: 8,
                                      border: "1px solid #7c3aed",
                                      background: "transparent",
                                      color: "#7c3aed",
                                    }}
                                  >
                                    Sketch it
                                  </button>
                                  {showSketch && (
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr1fr",
                                        gap: 8,
                                        marginTop: 8,
                                      }}
                                    >
                                      <SketchCanvas D={D} />
                                      <DiagramRenderer
                                        diagram={fc2.diagram}
                                        D={D}
                                        width={240}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {}
                      {flip && (
                        <div style={{ marginTop: 12 }}>
                          {}
                          {fcConf !== null && (
                            <div
                              style={{
                                padding: "7px 12px",
                                borderRadius: 9,
                                marginBottom: 10,
                                fontSize: 11,
                                background: D ? "#191a2b" : "#f3f4f6",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ color: mu(D) }}>
                                You predicted:
                              </span>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: CONF3.find((c) => c.v === fcConf)
                                    ?.color,
                                }}
                              >
                                {CONF3.find((c) => c.v === fcConf)?.icon}{" "}
                                {CONF3.find((c) => c.v === fcConf)?.label}
                              </span>

                              <span style={{ color: mu(D) }}>
                                — how did that match?
                              </span>
                            </div>
                          )}
                          {}
                          {!fcSelfOpen ? (
                            <button
                              onClick={() => setFcSelfOpen(true)}
                              style={{
                                fontSize: 11,
                                color: "#7c3aed",
                                background: "none",
                                border: "1px solid #7c3aed",
                                borderRadius: 8,
                                padding: "5px 12px",
                                cursor: "pointer",
                                marginBottom: 10,
                                display: "block",
                              }}
                            >
                              Explain the answer in your own words (+50%
                              retention boost)
                            </button>
                          ) : (
                            <div style={{ marginBottom: 10 }}>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: mu(D),
                                  marginBottom: 5,
                                }}
                              >
                                In your own words, why is this the answer?
                              </p>
                              <textarea
                                value={fcSelfExp}
                                onChange={(e) => setFcSelfExp(e.target.value)}
                                rows={2}
                                placeholder="e.g. 'This works because…' / 'The key principle is…'"
                                style={{
                                  ...I(D, {
                                    resize: "none",
                                    fontSize: 12,
                                    lineHeight: 1.6,
                                  }),
                                }}
                              />
                            </div>
                          )}
                          {}
                          <div
                            style={{
                              position: "sticky",
                              bottom: window.innerWidth < 640 ? 78 : 16,
                              zIndex: 10,
                              background: D ? "#0a0a14" : "#f9fafb",
                              padding: "10px 0",
                              margin: "0 -4px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 11,
                                color: mu(D),
                                textAlign: "center",
                                marginBottom: 8,
                              }}
                            >
                              How well did you know this?
                            </p>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4,1fr)",
                                gap: 8,
                              }}
                            >
                              {SM2B.map((btn) => (
                                <button
                                  key={btn.rating}
                                  onClick={() => doSM2local(btn.rating)}
                                  aria-label={btn.label}
                                  style={{
                                    padding: "12px 4px",
                                    borderRadius: 12,
                                    border: `2px solid ${btn.color}`,
                                    background: "transparent",
                                    cursor: "pointer",
                                    transition: "all .12s",
                                    color: btn.color,
                                    minHeight:
                                      window.innerWidth < 640 ? 52 : 44,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      btn.color;
                                    e.currentTarget.style.color = "#fff";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "transparent";
                                    e.currentTarget.style.color = btn.color;
                                  }}
                                >
                                  <div
                                    style={{ fontWeight: 700, fontSize: 13 }}
                                  >
                                    {btn.label}
                                  </div>
                                  {!cramMode && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        marginTop: 2,
                                        opacity: 0.8,
                                      }}
                                    >
                                      {previews2[btn.rating - 1]}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                            {!cramMode && (
                              <p
                                style={{
                                  fontSize: 10,
                                  color: mu(D),
                                  textAlign: "center",
                                  marginTop: 6,
                                }}
                              >
                                Again{previews2[0]} · Hard{previews2[1]} · Good
                                {previews2[2]} · Easy{previews2[3]}
                              </p>
                            )}
                            {cramMode && (
                              <p
                                style={{
                                  fontSize: 10,
                                  color: "#7c3aed",
                                  textAlign: "center",
                                  marginTop: 6,
                                }}
                              >
                                Cram mode — FSRS scheduling paused
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: D ? "#191a2b" : "#f8fafc",
                          border: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            marginBottom: 6,
                          }}
                        >
                          Difficulty Ladder
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5,1fr)",
                            gap: 4,
                          }}
                        >
                          {[
                            "Know",
                            "Understand",
                            "Apply",
                            "Evaluate",
                            "Mastery",
                          ].map((l, i) => (
                            <div
                              key={l}
                              style={{
                                padding: "5px 4px",
                                borderRadius: 6,
                                fontSize: 9,
                                textAlign: "center",
                                background:
                                  i + 1 <= ladderLevel
                                    ? "#7c3aed"
                                    : "transparent",
                                color: i + 1 <= ladderLevel ? "#fff" : mu(D),
                                border: `1px solid ${bd2}`,
                              }}
                            >
                              {l}
                            </div>
                          ))}
                        </div>
                      </div>
                      {flip && elabOpen && fc2 && (
                        <details style={{ marginTop: 8 }}>
                          <summary
                            style={{
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Why/How prompt
                          </summary>
                          <div
                            style={{ marginTop: 6, fontSize: 12, color: mu(D) }}
                          >
                            {generateWhyPrompt(fc2)}
                          </div>
                          <textarea
                            value={elabText}
                            onChange={(e) => setElabText(e.target.value)}
                            rows={2}
                            style={{ ...I(D, { marginTop: 6, fontSize: 12 }) }}
                            placeholder="Write 1–2 sentences…"
                          />
                          <button
                            onClick={() => {
                              try {
                                localStorage.setItem(
                                  "gcse:elab:" +
                                    user.replace(/\W/g, "-") +
                                    ":" +
                                    fc2.id,
                                  JSON.stringify({
                                    prompt: generateWhyPrompt(fc2),
                                    response: elabText,
                                    date: new Date().toISOString(),
                                  }),
                                );
                                showToast("Saved");
                              } catch (_) {}
                            }}
                            style={{
                              marginTop: 6,
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: "#7c3aed",
                              color: "#fff",
                              fontSize: 12,
                            }}
                          >
                            Save
                          </button>
                        </details>
                      )}
                      {fc2 && (
                        <details style={{ marginTop: 8 }}>
                          <summary
                            style={{
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Explain It
                          </summary>
                          <textarea
                            value={explainText}
                            onChange={(e) => setExplainText(e.target.value)}
                            rows={2}
                            style={{ ...I(D, { marginTop: 6, fontSize: 12 }) }}
                            placeholder="Explain this card in your own words…"
                          />
                          <button
                            onClick={() =>
                              setExplainFeedback(
                                verifyExplanation(
                                  fc2.a || fc2.text || fc2.q,
                                  explainText,
                                ),
                              )
                            }
                            style={{
                              marginTop: 6,
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: "#0ea5e9",
                              color: "#fff",
                              fontSize: 12,
                            }}
                          >
                            Check explanation
                          </button>
                          <button
                            onClick={async () => {
                              const svg = await generateSVGDiagram(
                                stripHtml(fc2.a || fc2.text || fc2.q),
                                user,
                              );
                              setSvgPreview(svg);
                            }}
                            style={{
                              marginTop: 6,
                              marginLeft: 6,
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "none",
                              background: "#7c3aed",
                              color: "#fff",
                              fontSize: 12,
                            }}
                          >
                            PromptS VG
                          </button>
                          {explainFeedback && (
                            <div style={{ marginTop: 6, fontSize: 12 }}>
                              <div>{explainFeedback.correct}</div>
                              <div>{explainFeedback.missing}</div>
                            </div>
                          )}
                          {svgPreview && (
                            <div
                              style={{ marginTop: 8 }}
                              dangerouslySetInnerHTML={{
                                __html: String(svgPreview).includes("<svg")
                                  ? svgPreview
                                  : "",
                              }}
                            />
                          )}
                          {explainFeedback && (
                            <div style={{ marginTop: 6, fontSize: 12 }}>
                              <div>{explainFeedback.correct}</div>
                              <div>{explainFeedback.missing}</div>
                            </div>
                          )}
                        </details>
                      )}

                      {!flip && (
                        <div
                          style={{ display: "flex", gap: 12, marginTop: 12 }}
                        >
                          <button
                            onClick={() => {
                              setFlip(false);
                              setFcConf(null);
                              setFcHintLvl(0);
                              setFcSelfExp("");
                              setFcSelfOpen(false);
                              setFcIdx((i) =>
                                i > 0 ? i - 1 : activeCards.length - 1,
                              );
                            }}
                            style={{
                              flex: 1,
                              padding: "12px 0",
                              borderRadius: 12,
                              background: "transparent",
                              border: `1px solid ${bd2}`,
                              color: mu(D),
                              cursor: "pointer",
                              fontSize: 13,
                              minHeight: 44,
                            }}
                          >
                            {" "}
                            Prev
                          </button>
                          <button
                            onClick={() => {
                              setFlip(false);
                              setFcConf(null);
                              setFcHintLvl(0);
                              setFcSelfExp("");
                              setFcSelfOpen(false);
                              setFcIdx((i) =>
                                i < activeCards.length - 1 ? i + 1 : 0,
                              );
                            }}
                            style={{
                              flex: 1,
                              padding: "12px 0",
                              borderRadius: 12,
                              background: "transparent",
                              border: `1px solid ${bd2}`,
                              color: mu(D),
                              cursor: "pointer",
                              fontSize: 13,
                              minHeight: 44,
                            }}
                          >
                            Next{" "}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const c = { ...fcHist };
                          activeCards.forEach((x) => delete c[x.id]);
                          setFCH(c);
                          setFcIdx(0);
                          setFlip(false);
                          setFcConf(null);
                          setFcHintLvl(0);
                          showToast("Cardsreset");
                        }}
                        style={{
                          marginTop: 14,
                          display: "block",
                          margin: "14px auto0",
                          fontSize: 11,
                          color: mu(D),
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Reset all cards
                      </button>
                      <button
                        onClick={() => {
                          setShowReflection(true);
                          runAchievementCheck(null);
                        }}
                        style={{
                          display: "block",
                          margin: "8px auto0",
                          fontSize: 11,
                          color: "#7c3aed",
                          background: "none",
                          border: "1px solid #7c3aed",
                          borderRadius: 8,
                          padding: "5px 14px",
                          cursor: "pointer",
                        }}
                      >
                        End Session & Reflect
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

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
