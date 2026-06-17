import { CreateModal } from "./createModal.jsx";
import { getCardState, isCardDue } from "./fsrs.js";
import { AdminBar, Header } from "./header.jsx";
import { ExamReadinessGauge, MasteryPanel, calculateExamReadiness, calculateMastery } from "./mastery.jsx";
import { CalibrationGauge, MasteryRing, PastPapersTab, StrategyRecommendation, StudyJournalTab } from "./studyWidgets.jsx";
import { B, C, gradeColor, mu, pctToGrade, tx } from "./ui.jsx";

export function SubjectScreen(props) {
  const { D, addCustomSection, addPaper, addSubtopic, admin, allSections, bd2, bg, calibrationData, curBData, curBoard, curTopics, deleteCustomSec, deletePaper, deleteSubtopic, editingTitle, fcHist, hProps, journalData, modal, navToSection, renameCustomSubtopic, renameCustomTopic, setBlurtSecId2, setBlurtSubjId, setEditingTitle, setFocusMode, setModal, setScreen, setSubjTab, setTTSubj, setTab, setTargetGrades, stats, subIdx, subjDef, subjTab, subjects, targetGrades, timetableExams, user } = props;

    const subj = subjDef;
    return (
      <div
        style={{ minHeight: "100vh", background: bg, color: tx(D) }}
        className="fade-in"
      >
        <Header {...hProps} />
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "32px 24px",
            paddingBottom: window.innerWidth < 640 ? 70 : 0,
          }}
        >
          <button
            onClick={() => setScreen("home")}
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
            All subjects
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: `linear-gradient(135deg,${subj.accent},
${subj.accent}88)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                flexShrink: 0,
                boxShadow: "0 10px 24px -8px " + subj.accent,
              }}
            >
              {subj.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>
                {subj.name}
              </h2>
              {!subj._politics && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      padding: "4px 14px",
                      borderRadius: 20,
                      background: subj.accent,
                      color: "#fff",
                    }}
                  >
                    {curBoard}
                  </span>
                  <button
                    onClick={() => setScreen("account")}
                    style={{
                      fontSize: 11,
                      color: mu(D),
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Change in Account Settings
                  </button>
                </div>
              )}
              {!subj._politics &&
                (() => {
                  const ss = stats.subjStats?.[subj.id];
                  const qPct =
                    ss?.qM > 0 ? Math.round((ss.qS / ss.qM) * 100) : null;
                  const predicted = qPct != null ? pctToGrade(qPct) : null;
                  const target = targetGrades[subj.id] || null;
                  const grades = [
                    "9",
                    "8",
                    "7",
                    "6",
                    "5",
                    "4",
                    "3",
                    "2",
                    "1",
                    "U",
                  ];
                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {predicted && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                            padding: "8px 12px",
                            borderRadius: 10,
                            background: D
                              ? "rgba(255,255,255,.04)"
                              : "rgba(0,0,0,.03)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: mu(D),
                              fontWeight: 600,
                            }}
                          >
                            Predicted
                          </span>
                          <span
                            style={{
                              fontSize: 20,
                              fontWeight: 900,
                              color: "#fff",
                              background: gradeColor(predicted),
                              padding: "3px 13px",
                              borderRadius: 9,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {predicted}
                          </span>
                          {qPct != null && (
                            <span style={{ fontSize: 11, color: mu(D) }}>
                              {qPct}% · {ss.qM} marks answered
                            </span>
                          )}
                          {target && (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: 8,
                                background:
                                  parseInt(predicted) >= parseInt(target) ||
                                  predicted === target
                                    ? "#dcfce7"
                                    : "#fef3c7",

                                color:
                                  parseInt(predicted) >= parseInt(target) ||
                                  predicted === target
                                    ? "#15803d"
                                    : "#92400e",
                              }}
                            >
                              {predicted === target
                                ? "✓ On target!"
                                : parseInt(predicted) > parseInt(target)
                                  ? "Above target!"
                                  : `${parseInt(target) - parseInt(predicted)}
grade${parseInt(target) - parseInt(predicted) !== 1 ? "s" : ""} to go`}
                            </span>
                          )}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: mu(D),
                            flexShrink: 0,
                            fontWeight: 600,
                          }}
                        >
                          Target:
                        </span>
                        <div
                          style={{ display: "flex", gap: 3, flexWrap: "wrap" }}
                        >
                          {grades.map((g) => {
                            const sel = target === g;
                            const gc = gradeColor(g);
                            return (
                              <button
                                key={g}
                                onClick={() =>
                                  setTargetGrades((p) => ({
                                    ...p,
                                    [subj.id]: sel ? undefined : g,
                                  }))
                                }
                                aria-label={`Set target grade ${g}${sel ? " (selected, click to clear)" : ""}`}
                                aria-pressed={sel}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  border: `2px solid ${sel ? gc : D ? "#374151" : "#d1d5db"}`,
                                  background: sel ? gc : D ? "#13131f" : "#fff",
                                  color: sel
                                    ? "#fff"
                                    : D
                                      ? "#8896b3"
                                      : "#9ca3af",
                                  fontWeight: sel ? 800 : 500,
                                  fontSize: 12,
                                  cursor: "pointer",
                                  transition: "all .15s",
                                  boxShadow: sel ? `0 0 0 3px ${gc}33` : "",
                                }}
                              >
                                {g}
                              </button>
                            );
                          })}
                          {target && (
                            <span
                              style={{
                                fontSize: 11,
                                color: mu(D),
                                alignSelf: "center",
                                marginLeft: 4,
                              }}
                            >
                              click again to clear
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>

          {subj._politics && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: D ? "#134e4a22" : "#f0fdfa",
                border: "1.5px solid #0f766e",
                marginBottom: 20,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}> </span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{ fontWeight: 700, fontSize: 13, color: "#0f766e" }}
                  >
                    General Political Knowledge
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "#0f766e",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}
                  >
                    Updated Weekly
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: D ? "#9ca3af" : "#6b7280",
                    margin: 0,
                  }}
                >
                  This is <strong>not GCSE content</strong> — it's factual,
                  non-biased political awareness for well-rounded world
                  knowledge. Notes only. Use the AI Tutor to explore any topic
                  further.
                </p>
              </div>
            </div>
          )}
          
          {subjTab === "sections" &&
            (() => {
              const allSecsDue = curTopics
                .flatMap((t) => t.sections)
                .filter((s) =>
                  (s.flashcards || []).some((c) => isCardDue(fcHist, c.id)),
                );
              const allSecsNew = curTopics
                .flatMap((t) => t.sections)
                .filter(
                  (s) =>
                    (s.questions || []).length > 0 ||
                    (s.flashcards || []).length > 0,
                );
              const ctaSection = allSecsDue[0] || allSecsNew[0];
              const dueCount = curTopics
                .flatMap((t) => t.sections)
                .reduce(
                  (acc, s) =>
                    acc +
                    (s.flashcards || []).filter((c) => isCardDue(fcHist, c.id))
                      .length,
                  0,
                );
              if (!ctaSection) return null;
              const ti = curTopics.findIndex((t) =>
                t.sections.some((s) => s.id === ctaSection.id),
              );
              return (
                <div
                  style={{
                    marginBottom: 20,
                    padding: "16px 20px",
                    borderRadius: 14,
                    background: D ? "rgba(99,102,241,.08)" : "#f5f3ff",
                    border: "1.5px solid #7c3aed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#7c3aed",
                        marginBottom: 2,
                      }}
                    >
                      {dueCount > 0
                        ? `${dueCount} flashcard${dueCount !== 1 ? "s" : ""} due for review`
                        : "Continue revision"}
                    </div>
                    <div
                      style={{ fontSize: 12, color: D ? "#8896b3" : "#9ca3af" }}
                    >
                      {ctaSection.title}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navToSection(subIdx, ti >= 0 ? ti : 0, ctaSection.id)
                    }
                    style={{
                      padding: "10px 22px",
                      borderRadius: 10,
                      border: "none",
                      background: "#7c3aed",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dueCount > 0 ? "Review Now →" : "Continue →"}
                  </button>
                </div>
              );
            })()}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid" + bd2,
              marginBottom: 24,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            {(subj._politics
              ? [["sections", "Topics"]]
              : [
                  ["sections", "Topics"],
                  ["papers", "Papers"],
                  ["journal", "Journal"],
                ]
            ).map(function (pair) {
              var t = pair[0],
                label = pair[1];
              return (
                <button
                  key={t}
                  onClick={function () {
                    setSubjTab(t);
                  }}
                  style={{
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: subjTab === t ? 600 : 400,
                    color: subjTab === t ? subj.accent : mu(D),
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderBottom:
                      subjTab === t
                        ? "2px solid" + subj.accent
                        : "2px solid transparent",
                    marginBottom: -1,
                    transition: "color .15s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {}
          {subjTab === "sections" && !subj._politics && (
            <StrategyRecommendation
              D={D}
              subj={subj}
              allSections={allSections}
              fcHist={fcHist}
              calibData={calibrationData[subj.id]}
              timetableExams={timetableExams}
              stats={stats}
              onFlashcards={() => {
                const sec = allSections.filter(
                  (s) =>
                    s.subjectId === subj.id && (s.flashcards || []).length > 0,
                )[0];
                if (!sec) return;
                const ti = curTopics.findIndex((t) =>
                  t.sections.some((s) => s.id === sec.id),
                );
                if (ti >= 0) navToSection(subIdx, ti, sec.id);
              }}
              onBlurt={() => {
                setBlurtSubjId(subj.id);
                setBlurtSecId2(null);
                setScreen("blurting");
              }}
              onQuestions={() => {
                const sec = allSections.filter(
                  (s) =>
                    s.subjectId === subj.id && (s.questions || []).length > 0,
                )[0];
                if (!sec) return;

                const ti = curTopics.findIndex((t) =>
                  t.sections.some((s) => s.id === sec.id),
                );
                if (ti >= 0) {
                  navToSection(subIdx, ti, sec.id);
                  setTab("questions");
                }
              }}
              onWeak={() => {
                setTTSubj(subIdx);
                setScreen("target");
              }}
            />
          )}
          {subjTab === "sections" && (
            <div className="fade-in">
              {admin && (
                <AdminBar
                  D={D}
                  actions={[
                    {
                      label: `＋ New Topic
(${curBoard})`,
                      fn: () => setModal({ mode: "section" }),
                    },
                  ]}
                />
              )}
              {curTopics.length === 0 && (
                <div style={{ ...C(D), padding: 48, textAlign: "center" }}>
                  <p style={{ fontSize: 28, marginBottom: 10 }}>{subj.icon}</p>
                  <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {subj.name} · {curBoard}
                  </p>
                  <p style={{ fontSize: 13, color: mu(D) }}>
                    No topics yet.{admin ? " Add one above." : ""}
                  </p>
                </div>
              )}
              {curTopics.map((tp, ti) => {
                if (tp.id === "_admin" && tp._adminGroups) {
                  return tp._adminGroups.map((grp) => (
                    <div key={grp._adminTopicId} style={{ marginBottom: 22 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 12,
                          paddingBottom: 8,
                          borderBottom: "2px solid " + subj.accent + "44",
                          flexWrap: "wrap",
                        }}
                      >
                        {admin &&
                        editingTitle &&
                        editingTitle.id === grp._adminTopicId ? (
                          <input
                            autoFocus
                            value={editingTitle.value}
                            onChange={(e) =>
                              setEditingTitle((t) => ({
                                ...t,
                                value: e.target.value,
                              }))
                            }
                            onBlur={() => {
                              renameCustomTopic(
                                grp._adminTopicId,
                                editingTitle.value,
                              );
                              setEditingTitle(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                renameCustomTopic(
                                  grp._adminTopicId,
                                  editingTitle.value,
                                );
                                setEditingTitle(null);
                              }
                              if (e.key === "Escape") setEditingTitle(null);
                            }}
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              border: "1.5px solid #7c3aed",
                              borderRadius: 6,
                              padding: "2px 8px",
                              background: "transparent",
                              color: "inherit",
                              flex: 1,
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: 16,
                              color: subj.accent,
                            }}
                          >
                            {grp._adminTopicTitle}
                          </span>
                        )}
                        {admin && (
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                              flexShrink: 0,
                            }}
                          >
                            {!editingTitle && (
                              <button
                                onClick={() =>
                                  setEditingTitle({
                                    id: grp._adminTopicId,
                                    value: grp._adminTopicTitle,
                                  })
                                }
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 7,
                                  border: "1.5px solid #7c3aed",
                                  background: "transparent",
                                  cursor: "pointer",
                                  fontSize: 11,
                                  color: "#7c3aed",
                                  fontWeight: 600,
                                }}
                              >
                                Rename
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setModal({
                                  mode: "subtopic",
                                  _parentTopicId: grp._adminTopicId,
                                })
                              }
                              style={{
                                padding: "5px 10px",
                                borderRadius: 7,
                                border: "none",
                                background: "#7c3aed",
                                cursor: "pointer",
                                fontSize: 11,
                                color: "#fff",
                                fontWeight: 600,
                              }}
                            >
                              ＋ Sub-topic
                            </button>
                            <button
                              onClick={() => deleteCustomSec(grp._adminTopicId)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 7,
                                border: "1.5px solid #ef4444",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: 11,
                                color: "#ef4444",
                                fontWeight: 600,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {grp.sections.length === 0 && (
                        <p
                          style={{
                            fontSize: 12,
                            color: mu(D),
                            fontStyle: "italic",
                            marginTop: 4,
                          }}
                        >
                          No sub-topics yet — click "＋Sub-topic" to add one.
                        </p>
                      )}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(190px,1fr))",
                          gap: 10,
                        }}
                      >
                        {grp.sections.map((sec) => (
                          <div
                            key={sec.id}
                            style={{
                              border: `1.5px solid ${bd2}`,
                              borderRadius: 12,
                              overflow: "hidden",
                              transition: "border-color .15s",
                            }}
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => navToSection(subIdx, ti, sec.id)}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                navToSection(subIdx, ti, sec.id)
                              }
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "12px 14px",
                                background: "transparent",
                                cursor: "pointer",
                                color: tx(D),
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.closest(
                                  "div[style]",
                                ).style.borderColor = subj.accent;
                                e.currentTarget.style.background = subj.light;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.closest(
                                  "div[style]",
                                ).style.borderColor = bd2;
                                e.currentTarget.style.background =
                                  "transparent";
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "space-between",
                                  gap: 6,
                                  marginBottom: 5,
                                }}
                              >
                                {admin &&
                                editingTitle &&
                                editingTitle.id === sec.id ? (
                                  <input
                                    autoFocus
                                    value={editingTitle.value}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      setEditingTitle((t) => ({
                                        ...t,
                                        value: e.target.value,
                                      }))
                                    }
                                    onBlur={() => {
                                      if (sec._isSubtopic)
                                        renameCustomSubtopic(
                                          grp._adminTopicId,
                                          sec.id,
                                          editingTitle.value,
                                        );
                                      else
                                        renameCustomTopic(
                                          sec.id,
                                          editingTitle.value,
                                        );
                                      setEditingTitle(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        if (sec._isSubtopic)
                                          renameCustomSubtopic(
                                            grp._adminTopicId,
                                            sec.id,
                                            editingTitle.value,
                                          );
                                        else
                                          renameCustomTopic(
                                            sec.id,
                                            editingTitle.value,
                                          );
                                        setEditingTitle(null);
                                      }
                                      if (e.key === "Escape") setEditingTitle(null);
                                    }}
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      border: "1.5px solid #7c3aed",
                                      borderRadius: 6,
                                      padding: "2px 6px",
                                      background: "transparent",
                                      color: "inherit",
                                      width: "100%",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      flex: 1,
                                      minWidth: 0,
                                    }}
                                  >
                                    {sec.title}
                                  </div>
                                )}
                                {(() => {
                                  const cards = sec.flashcards || [];
                                  if (!cards.length) return null;
                                  const mastered = cards.filter((c) => {
                                    const s = getCardState(fcHist, c.id);
                                    return s && s.interval > 7;
                                  }).length;
                                  const pct = Math.round(
                                    (mastered / cards.length) * 100,
                                  );
                                  return (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 3,
                                        flexShrink: 0,
                                      }}
                                      title={pct + "% mastered(interval>7d)"}
                                    >
                                      <MasteryRing
                                        pct={pct}
                                        size={22}
                                        accent="#10b981"
                                      />
                                      <span
                                        style={{
                                          fontSize: 9,
                                          color: "#10b981",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {pct}%
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ fontSize: 11, color: mu(D) }}>
                                  🎴 {(sec.flashcards || []).length}
                                </span>
                                <span style={{ fontSize: 11, color: mu(D) }}>
                                  ✏️ {(sec.questions || []).length}
                                </span>
                              </div>
                            </div>
                            {admin && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 0,
                                  borderTop: `1px solid ${bd2}`,
                                  background: D
                                    ? "rgba(0,0,0,.2)"
                                    : "rgba(0,0,0,.03)",
                                }}
                              >
                                {!editingTitle && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTitle({
                                        id: sec.id,
                                        parentId: sec._isSubtopic
                                          ? grp._adminTopicId
                                          : null,
                                        value: sec.title,
                                      });
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: "5px 0",
                                      fontSize: 11,
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "#7c3aed",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Rename
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (sec._isSubtopic)
                                      deleteSubtopic(grp._adminTopicId, sec.id);
                                    else deleteCustomSec(sec.id);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: "5px 0",
                                    fontSize: 11,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#ef4444",
                                    fontWeight: 600,
                                    borderLeft: `1px solid ${bd2}`,
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                }
                return (
                  <div key={tp.id} style={{ marginBottom: 22 }}>
                    {}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 12,
                        paddingBottom: 8,
                        borderBottom: "2px solid " + subj.accent + "44",
                      }}
                    >
                      {tp.number && (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#fff",
                            background: subj.accent,
                            padding: "2px 9px",
                            borderRadius: 6,
                            flexShrink: 0,
                          }}
                        >
                          {tp.number}
                        </span>
                      )}
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 18,
                          color: subj.accent,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {tp.title}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: mu(D),
                          marginLeft: "auto",
                        }}
                      >
                        {tp.sections.length}
                        topic{tp.sections.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(190px,1fr))",
                        gap: 10,
                      }}
                    >
                      {tp.sections.map(function (sec) {
                        var cards = sec.flashcards || [];
                        var mastered = cards.filter(function (c) {
                          var s = getCardState(fcHist, c.id);
                          return s && s.interval > 7;
                        }).length;
                        var pct = cards.length
                          ? Math.round((mastered / cards.length) * 100)
                          : null;
                        return (
                          <div key={sec.id} style={{ position: "relative" }}>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={function () {
                                navToSection(subIdx, ti, sec.id);
                              }}
                              onKeyDown={function (e) {
                                if (e.key === "Enter")
                                  navToSection(subIdx, ti, sec.id);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "14px 16px",
                                borderRadius: 14,
                                border: "1.5px solid" + bd2,
                                background: D ? "rgba(255,255,255,.03)" : "#ffffff",
                                boxShadow: D ? "0 1px 3px rgba(0,0,0,.35)" : "0 2px 6px rgba(16,24,40,.06)",
                                cursor: "pointer",
                                transition: "all .15s",
                                color: tx(D),
                              }}
                              onMouseEnter={function (e) {
                                e.currentTarget.style.borderColor = subj.accent;
                                e.currentTarget.style.background = subj.light;
                              }}
                              onMouseLeave={function (e) {
                                e.currentTarget.style.borderColor = bd2;
                                e.currentTarget.style.background = D ? "rgba(255,255,255,.03)" : "#ffffff";
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "space-between",
                                  gap: 6,
                                  marginBottom: 5,
                                }}
                              >
                                <div style={{ fontSize: 13, fontWeight: 600 }}>
                                  {sec.title}
                                </div>

                                {pct !== null && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 3,
                                      flexShrink: 0,
                                    }}
                                    title={pct + "% mastered"}
                                  >
                                    <MasteryRing
                                      pct={pct}
                                      size={22}
                                      accent="#10b981"
                                    />
                                    <span
                                      style={{
                                        fontSize: 9,
                                        color: "#10b981",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <span style={{ fontSize: 11, color: mu(D) }}>
                                  🎴 {(sec.flashcards || []).length}
                                </span>
                                <span style={{ fontSize: 11, color: mu(D) }}>
                                  ✏️ {(sec.questions || []).length}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {subjTab === "papers" && (
            <PastPapersTab
              papers={curBData.papers}
              onAdd={() => setModal({ mode: "paper" })}
              onDelete={deletePaper}
              admin={admin}
              D={D}
              accent={subj.accent}
              board={curBoard}
              subjectName={subj.name}
            />
          )}
          {subjTab === "journal" && (
            <div className="fade-in">
              {}
              {!subj._politics &&
                (() => {
                  const mastery = calculateMastery(
                    subj.id,
                    allSections,
                    fcHist,
                    stats,
                  );
                  const readiness = calculateExamReadiness(
                    subj.id,
                    allSections,
                    fcHist,
                    stats,
                    calibrationData[subj.id],
                    timetableExams,
                  );
                  return (
                    <>
                      <MasteryPanel
                        D={D}
                        mastery={mastery}
                        subjectName={subj.name}
                      />
                      <ExamReadinessGauge
                        D={D}
                        readiness={readiness}
                        subjectName={subj.name}
                        accent={subj.accent}
                      />
                      {(calibrationData[subj.id] || []).length >= 3 && (
                        <CalibrationGauge
                          D={D}
                          calibData={calibrationData[subj.id]}
                          subjectName={subj.name}
                        />
                      )}
                    </>
                  );
                })()}
              {}
              {!subj._politics && (
                <button
                  onClick={() => setFocusMode(true)}
                  style={{
                    ...B("#7c3aed", true, {
                      width: "100%",
                      padding: "11px 0",
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 18,
                    }),
                  }}
                >
                  Start Focus Mode
                </button>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                    Study Journal
                  </h3>
                  <p style={{ fontSize: 12, color: mu(D), margin: "2px 0 0" }}>
                    Your post-session reflections for {subj.name}
                  </p>
                </div>
              </div>
              <StudyJournalTab
                D={D}
                entries={journalData[subj.id] || []}
                mu2={mu(D)}
                tx2={tx(D)}
              />
            </div>
          )}
        </div>
        {modal?.mode === "section" && (
          <CreateModal
            mode="section"
            D={D}
            subjects={subjects}
            onClose={() => setModal(null)}
            onSave={addCustomSection}
          />
        )}
        {modal?.mode === "subtopic" && modal._parentTopicId && (
          <CreateModal
            mode="subtopic"
            D={D}
            subjects={subjects}
            onClose={() => setModal(null)}
            onSave={(st) => addSubtopic(modal._parentTopicId, st)}
          />
        )}
        {modal?.mode === "paper" && (
          <CreateModal
            mode="paper"
            D={D}
            subjects={subjects}
            onClose={() => setModal(null)}
            onSave={addPaper}
          />
        )}
      </div>
    );
  
}
