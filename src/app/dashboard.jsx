import { DEFAULT_BOARD, SK_ERROR_PATTERNS, calcBrierScore } from "./coreHelpers.js";
import { LearningTimeline } from "./diagrams.jsx";
import { Header } from "./header.jsx";
import { CalibrationDial, MasteryConstellation, StatTile } from "./lumen.jsx";
import { ACHIEVEMENTS, calculateExamReadiness, calculateMastery } from "./mastery.jsx";
import { calcLongestStreak, todayStr } from "./scheduling.js";
import { CalibrationGauge } from "./studyWidgets.jsx";
import { ALL_SUBJECTS } from "./subjects.js";
import { B, C, gradeColor, mu, pctToGrade, tx } from "./ui.jsx";
import { Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DashboardScreen(props) {
  const { D, achievements, activityCounts, activityDates, allSections, bg, boardData, boardSels, calibrationData, ensureBoardLoaded, fcHist, gradeSnapshots, hProps, pedCtx, setScreen, setSubIdx, setSubjTab, setTTSubj, setTargetGrades, setTimelineSelected, stats, streak, subjects, targetGrades, timelineSelected, timetableExams, totalDaysStudied, user } = props;

    const planRow = { display: "flex", gap: 10, flexWrap: "wrap", margin: "4px 0 18px" };
    const planBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: "1px solid " + (D ? "rgba(255,255,255,.1)" : "rgba(16,24,40,.1)"), background: D ? "rgba(255,255,255,.05)" : "#fff", color: D ? "#eef1fb" : "#0f1729", fontSize: 13.5, fontWeight: 700, cursor: "pointer" };
    const fcPct = stats.fcT > 0 ? Math.round((stats.fcC / stats.fcT) * 100) : 0;
    const qPct = stats.qM > 0 ? Math.round((stats.qS / stats.qM) * 100) : 0;
    const totalCustom = Object.values(boardData).reduce(
      (a, b) => a + (b.custom?.length || 0),
      0,
    );
    const totalPapers = Object.values(boardData).reduce(
      (a, b) => a + (b.papers?.length || 0),
      0,
    );

    const longestStreak = calcLongestStreak(activityDates);

    const hmWeeks = [];
    const hmToday = new Date();
    hmToday.setHours(0, 0, 0, 0);
    const hmDow = hmToday.getDay() === 0 ? 6 : hmToday.getDay() - 1;
    const hmStart = new Date(hmToday);
    hmStart.setDate(hmStart.getDate() - hmDow - 15 * 7);
    for (var hw = 0; hw < 16; hw++) {
      const wk = [];
      for (var hd = 0; hd < 7; hd++) {
        const dt = new Date(hmStart);
        dt.setDate(dt.getDate() + hw * 7 + hd);
        const k = dt.toISOString().slice(0, 10);
        const cnt = activityCounts[k] || 0;
        wk.push({ k, cnt, isToday: k === todayStr() });
      }
      hmWeeks.push(wk);
    }
    function hmColor(cnt, D) {
      if (cnt === 0) return D ? "#191a2b" : "#f3f4f6";
      if (cnt === 1) return D ? "#7c3aed" : "#c4b5fd";
      if (cnt === 2) return D ? "#6d28d9" : "#a78bfa";
      if (cnt >= 3) return D ? "#4c1d95" : "#7c3aed";
      return D ? "#191a2b" : "#f3f4f6";
    }

    const hmMonthLabels = [];
    hmWeeks.forEach(function (wk, wi) {
      const mo = new Date(wk[0].k + "T12:00:00").toLocaleDateString("en-GB", {
        month: "short",
      });
      if (wi === 0 || mo !== hmMonthLabels[hmMonthLabels.length - 1].label) {
        hmMonthLabels.push({ wi, label: mo });
      }
    });

    const estSecsFc = stats.fcT * 30;
    const estSecsQ = stats.qM * 180;
    const estTotalMins = Math.round((estSecsFc + estSecsQ) / 60);
    const estHrs = Math.floor(estTotalMins / 60);
    const estMin = estTotalMins % 60;
    const estLabel =
      estHrs > 0
        ? estHrs + "h " + (estMin > 0 ? estMin + "m" : "")
        : estMin + "m";

    const subjsWithData = ALL_SUBJECTS.filter(function (s) {
      return gradeSnapshots.some(function (snap) {
        return snap.grades && snap.grades[s.id] != null;
      });
    });

    const trajSubjs = subjsWithData.slice(0, 6);
    const trajData = gradeSnapshots.map(function (snap) {
      const pt = { date: snap.date.slice(5) };
      trajSubjs.forEach(function (s) {
        if (snap.grades && snap.grades[s.id] != null) {
          var g = pctToGrade(snap.grades[s.id]);
          var gNum = g === "U" ? 0 : isNaN(parseInt(g)) ? 0 : parseInt(g);
          pt[s.id] = gNum;
        }
      });
      return pt;
    });

    const radarData = ALL_SUBJECTS.map(function (s) {
      const ss = stats.subjStats && stats.subjStats[s.id];
      const pct = ss && ss.qM > 0 ? Math.round((ss.qS / ss.qM) * 100) : 0;
      return {
        subject: s.icon + " " + s.name.split(" ")[0],
        pct: pct,
        fullName: s.name,
      };
    });
    const hasRadarData = radarData.some(function (r) {
      return r.pct > 0;
    });
    const dominantErrorSummary = (function () {
      if (typeof window === "undefined" || !user) return null;
      var all = {
        "Knowledge Gap": 0,
        "Application Error": 0,
        "Command Word Error": 0,
        CommunicationError: 0,
      };
      ALL_SUBJECTS.forEach(function (s) {
        try {
          var obj = JSON.parse(
            localStorage.getItem(SK_ERROR_PATTERNS(user, s.id)) || "{}",
          );
          Object.keys(all).forEach(function (k) {
            all[k] += Number(obj[k] || 0);
          });
        } catch (_) {}
      });
      var total = Object.values(all).reduce((a, b) => a + b, 0);
      if (total < 10) return null;
      var top = Object.entries(all).sort((a, b) => b[1] - a[1])[0];
      return { type: top[0], pct: Math.round((top[1] / total) * 100) };
    })();
    return (
      <div
        style={{ minHeight: "100vh", background: bg, color: tx(D) }}
        className="fade-in"
      >
        <Header {...hProps} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <button
            onClick={() => setScreen("home")}
            style={{
              fontSize: 13,
              color: mu(D),
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: 24,
            }}
          >
            {" "}
            Home
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 22 }}>
            Progress Dashboard
          </h2>
          {(function () {
            const _preds = Object.values(calibrationData || {}).flat();
            const _brier = _preds.length >= 3 ? calcBrierScore(_preds) : null;
            const _calVal = _brier != null ? Math.max(0, Math.min(1, 1 - _brier / 0.35)) : 0.5;
            const _mp = _preds.length ? _preds.reduce(function (a, d) { return a + Number((d && d.pred) || 0); }, 0) / _preds.length : 0;
            const _mo = _preds.length ? _preds.reduce(function (a, d) { return a + Number((d && d.outcome) || 0); }, 0) / _preds.length : 0;
            const _bias = _mp - _mo;
            const _rd = subjects.map(function (s) { try { return calculateExamReadiness(s.id, allSections, fcHist, stats, calibrationData[s.id], timetableExams)?.score ?? 0; } catch (e) { return 0; } });
            const _readiness = _rd.length ? Math.round(_rd.reduce(function (a, b) { return a + b; }, 0) / _rd.length) : 0;
            const _topics = subjects.map(function (s) { let sc = 50, tt = 0; try { sc = calculateExamReadiness(s.id, allSections, fcHist, stats, calibrationData[s.id], timetableExams)?.score ?? 50; } catch (e) {} try { tt = (calculateMastery(s.id, allSections, fcHist, stats) || {}).totalTopics || 0; } catch (e) {} return { id: s.id, name: (s.name || "").split(" ")[0], retention: sc / 100, size: Math.min(1, tt / 12) }; });
            const wrapSt = { margin: "24px 0 8px" };
            const kicker = { fontSize: 12.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: D ? "#98a2bd" : "#5b6478", marginBottom: 12 };
            const tileGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 };
            const panelGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 14 };
            const panelCard = { padding: 20, borderRadius: 22, background: D ? "rgba(255,255,255,.04)" : "#fff", border: "1px solid " + (D ? "rgba(255,255,255,.07)" : "rgba(16,24,40,.06)"), display: "flex", flexDirection: "column", gap: 10, alignItems: "center" };
            const panelTitle = { alignSelf: "flex-start", fontSize: 13, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: D ? "#98a2bd" : "#5b6478" };
            const emptyP = { fontSize: 13, color: D ? "#98a2bd" : "#5b6478", lineHeight: 1.5, textAlign: "center", margin: "20px 0" };
            return (
              <section style={wrapSt}>
                <div style={planRow}>
                  <button style={planBtn} onClick={() => setScreen("timetable")}>📅 Exam timetable</button>
                  <button style={planBtn} onClick={() => setScreen("target")}>🎯 Target grades</button>
                </div>
                <div style={kicker}>Your signal</div>
                <div style={tileGrid}>
                  <StatTile icon="🔥" figure={streak} caption="Day streak" accent="#f59e0b" D={D} />
                  <StatTile icon="🎯" figure={qPct + "%"} caption="Question accuracy" accent="#5b54f0" D={D} />
                  <StatTile icon="🃏" figure={fcPct + "%"} caption="Flashcard recall" accent="#8b5cf6" D={D} />
                  <StatTile icon="🚀" figure={_readiness + "%"} caption="Exam readiness" accent="#d946ef" D={D} />
                </div>
                <div style={panelGrid}>
                  <div style={panelCard}>
                    <div style={panelTitle}>Calibration</div>
                    {_preds.length >= 3 ? (
                      <CalibrationDial value={_calVal} bias={_bias} size={220} D={D} />
                    ) : (
                      <p style={emptyP}>Rate your confidence on a few flashcards to see how well it predicts your actual performance.</p>
                    )}
                  </div>
                  <div style={panelCard}>
                    <div style={panelTitle}>Mastery constellation</div>
                    {_topics.length ? (
                      <MasteryConstellation topics={_topics} width={520} height={300} D={D} onSelect={function (n) { const idx = subjects.findIndex(function (s) { return s.id === n.id; }); if (idx >= 0) { setSubIdx(idx); setScreen("subject"); } }} />
                    ) : (
                      <p style={emptyP}>Add subjects to map your topic mastery as a living constellation.</p>
                    )}
                  </div>
                </div>
              </section>
            );
          })()}
          <LearningTimeline
            D={D}
            sessions={Object.keys(activityCounts || {})
              .map(function (k) {
                return {
                  date: k,
                  subject: "Mixed",
                  duration: (activityCounts[k] || 0) * 25,
                  topics: ["Revision"],
                };
              })
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(-80)}
            exams={timetableExams || []}
            subjects={subjects}
            onSelect={setTimelineSelected}
          />
          {timelineSelected && (
            <div
              style={{
                ...C(D),
                padding: 10,
                marginTop: 8,
                marginBottom: 12,
                fontSize: 12,
              }}
            >
              Session:
              {timelineSelected.date} · {timelineSelected.duration} min ·{" "}
              {timelineSelected.subject}
            </div>
          )}
          {dominantErrorSummary && (
            <div
              style={{
                ...C(D),
                padding: 14,
                marginBottom: 14,
                background: D ? "rgba(245,158,11,.08)" : "#fffbeb",
                borderColor: "#f59e0b",
              }}
            >
              <p style={{ fontSize: 13, color: D ? "#fcd34d" : "#92400e" }}>
                Your main error type is{" "}
                <strong>{dominantErrorSummary.type}</strong>(
                {dominantErrorSummary.pct}%) — focus on improving this.
              </p>
            </div>
          )}

          {}
          <div
            style={{
              ...C(D),
              padding: 22,
              marginBottom: 18,
              background:
                streak > 0 ? (D ? "rgba(249,115,22,0.05)" : "") : undefined,
              borderColor: streak >= 7 ? "#f97316" : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                  Study Streak
                </h3>
                <p style={{ fontSize: 12, color: mu(D) }}>
                  Study every day to build your streak!
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 900,
                    color:
                      streak >= 7 ? "#f97316" : streak > 0 ? "#f59e0b" : mu(D),
                    lineHeight: 1,
                  }}
                >
                  {streak}
                </div>
                <div style={{ fontSize: 11, color: mu(D) }}>day streak</div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 20,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              {[
                { icon: "🏆", val: longestStreak, label: "Longest streak" },
                { icon: "📅", val: activityDates.size, label: "Days studied" },
                { icon: "🔥", val: streak, label: "Current streak" },
                { icon: "📚", val: estLabel || "0m", label: "Study time est." },
              ].map(function (s) {
                return (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 2 }}>
                      {s.icon}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: mu(D) }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {}
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: mu(D),
                  marginBottom: 5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                Activity heatmap — 16 weeks
              </p>
              <div style={{ overflowX: "auto", paddingBottom: 4 }}>
                {}
                <div
                  style={{
                    display: "inline-flex",
                    gap: 3,
                    minWidth: "max-content",
                    marginBottom: 3,
                    paddingLeft: 0,
                  }}
                >
                  {hmWeeks.map(function (wk, wi) {
                    const mo = new Date(
                      wk[0].k + "T12:00:00",
                    ).toLocaleDateString("en-GB", { month: "short" });
                    const showLabel =
                      wi === 0 ||
                      (wi > 0 &&
                        new Date(
                          hmWeeks[wi - 1][0].k + "T12:00:00",
                        ).toLocaleDateString("en-GB", { month: "short" }) !==
                          mo);
                    return (
                      <div
                        key={wi}
                        style={{
                          width: 16,
                          fontSize: 8,
                          color: mu(D),
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {showLabel ? mo : ""}
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    gap: 3,
                    minWidth: "max-content",
                  }}
                >
                  {hmWeeks.map(function (wk, wi) {
                    return (
                      <div
                        key={wi}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                        }}
                      >
                        {wk.map(function (cell) {
                          return (
                            <div
                              key={cell.k}
                              title={
                                cell.k +
                                (cell.cnt > 0
                                  ? " · " +
                                    cell.cnt +
                                    " session" +
                                    (cell.cnt !== 1 ? "s" : "")
                                  : "")
                              }
                              style={{
                                width: 13,
                                height: 13,
                                borderRadius: 2,
                                background: hmColor(cell.cnt, D),
                                border: cell.isToday
                                  ? "2px solid #7c3aed"
                                  : "2px solid transparent",
                                transition: "background .2s",
                                cursor: "default",
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                  <div
                    style={{
                      marginLeft: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      paddingTop: 1,
                      paddingBottom: 1,
                    }}
                  >
                    {["M", "W", "F", "S"].map(function (d) {
                      return (
                        <span
                          key={d}
                          style={{
                            fontSize: 8,
                            color: mu(D),
                            lineHeight: "13px",
                          }}
                        >
                          {d}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              {}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 6,
                }}
              >
                <span style={{ fontSize: 10, color: mu(D) }}>Less</span>
                {[0, 1, 2, 3].map(function (n) {
                  return (
                    <div
                      key={n}
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 2,
                        background: hmColor(n, D),
                      }}
                    />
                  );
                })}
                <span style={{ fontSize: 10, color: mu(D) }}>More</span>
              </div>
            </div>
          </div>
          {}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
            {[
              { icon: "📚", val: ALL_SUBJECTS.length, label: "Subjects" },
              { icon: "🗂️", val: stats.fcT, label: "Cards reviewed" },
              { icon: "➕", val: totalCustom, label: "Topics added" },
              { icon: "➕", val: totalPapers, label: "Past papers" },
            ].map(function (s, i) {
              return (
                <div
                  key={i}
                  style={{ ...C(D), padding: 18, textAlign: "center" }}
                >
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{s.icon}</div>
                  <div
                    style={{ fontSize: 26, fontWeight: 800, marginBottom: 2 }}
                  >
                    {s.val}
                  </div>
                  <div style={{ fontSize: 11, color: mu(D) }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {}
          {trajData.length >= 2 && trajSubjs.length > 0 && (
            <div style={{ ...C(D), padding: 22, marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
                Grade Trajectory
              </h3>
              <p style={{ fontSize: 12, color: mu(D), marginBottom: 14 }}>
                Predicted grade per subject over time (1=low, 9=high).
              </p>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={trajData}
                  margin={{ top: 4, right: 12, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: mu(D) }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 9]}
                    ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                    tick={{ fontSize: 10, fill: mu(D) }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: D ? "#191a2b" : "#fff",
                      border: "1px solid" + (D ? "#374151" : "#e5e7eb"),
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={function (val, name) {
                      var s = ALL_SUBJECTS.find(function (s) {
                        return s.id === name;
                      });
                      return [val ? "Grade " + val : "—", s ? s.name : name];
                    }}
                  />
                  {trajSubjs.map(function (s) {
                    return (
                      <Line
                        key={s.id}
                        type="monotone"
                        dataKey={s.id}
                        stroke={s.accent}
                        strokeWidth={2}
                        dot={{ r: 3, fill: s.accent }}
                        connectNulls
                        activeDot={{ r: 5 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 8,
                }}
              >
                {trajSubjs.map(function (s) {
                  return (
                    <span
                      key={s.id}
                      style={{
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: s.accent,
                          display: "inline-block",
                        }}
                      />
                      {s.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {trajData.length < 2 && (
            <div
              style={{
                ...C(D),
                padding: 22,
                marginBottom: 18,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, color: mu(D) }}>
                <strong>Grade Trajectory</strong> — answer questions across
                multiple sessions to see your progress over time.
              </p>
            </div>
          )}

          {}
          <div style={{ ...C(D), padding: 22, marginBottom: 18 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
              Subject Strength Radar
            </h3>
            <p style={{ fontSize: 12, color: mu(D), marginBottom: 14 }}>
              Relative strength across all subjects (question score %).
            </p>
            {hasRadarData ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart
                  data={radarData}
                  margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
                >
                  <PolarGrid stroke={D ? "#374151" : "#e5e7eb"} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: tx(D) }}
                  />
                  <Radar
                    name="Score"
                    dataKey="pct"
                    stroke="#7c3aed"
                    fill="#7c3aed"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: D ? "#191a2b" : "#fff",
                      border: "1px solid" + (D ? "#374151" : "#e5e7eb"),
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={function (val, _, props) {
                      return [
                        val + "%",
                        (props && props.payload && props.payload.fullName) ||
                          "Score",
                      ];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: mu(D),
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                Answer some questions to see your radar chart.
              </p>
            )}
          </div>
          {}
          <div style={{ ...C(D), padding: 24, marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
              Grades by Subject
            </h3>
            <p style={{ fontSize: 13, color: mu(D), marginBottom: 16 }}>
              Based on your question scores. Set target grades below.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: 10,
              }}
            >
              {ALL_SUBJECTS.map(function (s, si) {
                const ss = stats.subjStats && stats.subjStats[s.id];
                const qPct2 =
                  ss && ss.qM > 0 ? Math.round((ss.qS / ss.qM) * 100) : null;
                const predicted = qPct2 != null ? pctToGrade(qPct2) : null;
                const target = targetGrades[s.id] || null;
                const atOrAbove =
                  predicted &&
                  target &&
                  (parseInt(predicted) >= parseInt(target) ||
                    predicted === target);
                const gradeOpts = [
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
                  <div key={s.id} style={{ ...C(D), padding: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                        cursor: "pointer",
                      }}
                      onClick={async function () {
                        setSubIdx(si);
                        setSubjTab("sections");
                        const b = boardSels[s.id] || DEFAULT_BOARD;
                        await ensureBoardLoaded(s.id, b);
                        setScreen("subject");
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{s.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {s.name}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          alignItems: "center",
                        }}
                      >
                        {target && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#fff",
                              background: gradeColor(target),
                              padding: "2px 7px",
                              borderRadius: 7,
                            }}
                          >
                            {" "}
                            {target}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: predicted ? gradeColor(predicted) : mu(D),
                            background: predicted
                              ? gradeColor(predicted) + "22"
                              : "transparent",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {predicted || "—"}
                        </span>
                      </div>
                    </div>
                    {qPct2 != null ? (
                      <div>
                        <div
                          style={{
                            height: 5,
                            borderRadius: 5,
                            background: D ? "#262844" : "#e5e7eb",
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 5,
                              background: gradeColor(predicted || "U"),
                              width: qPct2 + "%",
                              transition: "width .6s",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <span style={{ fontSize: 11, color: mu(D) }}>
                            {qPct2}% · {ss.qM} marks
                          </span>
                          {target && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: atOrAbove ? "#16a34a" : "#d97706",
                              }}
                            >
                              {atOrAbove ? "✓On track" : "Keep going"}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p
                        style={{ fontSize: 11, color: mu(D), marginBottom: 8 }}
                      >
                        No questions answered yet
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {gradeOpts.map(function (g) {
                        const sel = target === g;
                        const gc = gradeColor(g);
                        return (
                          <button
                            key={g}
                            onClick={function () {
                              setTargetGrades(function (p) {
                                return Object.assign({}, p, {
                                  [s.id]: sel ? undefined : g,
                                });
                              });
                            }}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              border: "2px solid" + (sel ? gc : "transparent"),
                              background: sel ? gc : D ? "#191a2b" : "#f3f4f6",
                              color: sel ? "#fff" : D ? "#9ca3af" : "#6b7280",
                              fontWeight: sel ? 800 : 500,
                              fontSize: 11,
                              cursor: "pointer",
                              transition: "all .15s",
                            }}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {}
          {(Object.keys(stats.weakQ || {}).length > 0 ||
            Object.keys(stats.weakFC || {}).length > 0) &&
            (function () {
              const sIds = [
                ...new Set([
                  ...Object.keys(stats.weakQ || {}),
                  ...Object.keys(stats.weakFC || {}),
                ]),
              ];
              const scored = sIds
                .map(function (sid) {
                  const wq = (stats.weakQ && stats.weakQ[sid]) || {
                    wrong: 0,
                    total: 0,
                  };
                  const wf = (stats.weakFC && stats.weakFC[sid]) || {
                    wrong: 0,
                    total: 0,
                  };
                  const score =
                    (wq.wrong * 2 + wf.wrong) /
                    Math.max(wq.total + wf.total, 1);
                  return { sid, score, wq, wf };
                })
                .filter(function (x) {
                  return x.wq.total + x.wf.total > 0;
                })
                .sort(function (a, b) {
                  return b.score - a.score;
                })
                .slice(0, 5);
              if (!scored.length) return null;
              return (
                <div style={{ ...C(D), padding: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <h3 style={{ fontWeight: 700 }}>Weakest Areas</h3>
                    <button
                      onClick={function () {
                        setTTSubj(null);
                        setScreen("target");
                      }}
                      style={{
                        ...B("#ef4444", false, {
                          fontSize: 12,
                          padding: "7px 14px",
                        }),
                      }}
                    >
                      Start Target Test
                    </button>
                  </div>
                  {scored.map(function (x) {
                    return (
                      <div
                        key={x.sid}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "7px 12px",
                          borderRadius: 10,
                          background: D ? "#191a2b" : "#fef2f2",
                          marginBottom: 5,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{x.sid}</span>
                        <div style={{ display: "flex", gap: 12 }}>
                          {x.wq.total > 0 && (
                            <span style={{ fontSize: 11, color: "#dc2626" }}>
                              Q:
                              {x.wq.wrong}/{x.wq.total}
                            </span>
                          )}
                          {x.wf.total > 0 && (
                            <span style={{ fontSize: 11, color: "#d97706" }}>
                              FC:
                              {x.wf.wrong}/{x.wf.total}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          {}
          {(() => {
            const allPreds = Object.values(calibrationData).flat();
            if (!allPreds.length) return null;

            return (
              <CalibrationGauge
                D={D}
                calibData={allPreds}
                subjectName="All Subjects"
              />
            );
          })()}
          {}
          {pedCtx?.crossSubjectInsight && (
            <div
              style={{
                ...C(D),
                padding: 18,
                marginBottom: 16,
                borderColor: "#7c3aed",
                borderWidth: 1.5,
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
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "#7c3aed22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                ></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#7c3aed",
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    Cross-Subject Pattern Detected
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: tx(D),
                      lineHeight: 1.6,
                      marginBottom: 6,
                    }}
                  >
                    {pedCtx.crossSubjectInsight.insight}
                  </p>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: D ? "rgba(99,102,241,.08)" : "#f5f3ff",
                      fontSize: 12,
                      color: D ? "#ddd6fe" : "#4c1d95",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>What to do:</strong>{" "}
                    {pedCtx.crossSubjectInsight.recommendation}
                  </div>
                  {pedCtx.crossSubjectInsight.affectedSubjects?.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 11, color: mu(D) }}>
                      Affects:{" "}
                      {pedCtx.crossSubjectInsight.affectedSubjects.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {}
          {totalDaysStudied > 0 && (
            <div
              style={{
                ...C(D),
                padding: 18,
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 32 }}> </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {totalDaysStudied} total days studied
                </div>

                <div style={{ fontSize: 12, color: mu(D) }}>
                  This never resets. Every study session counts.
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: mu(D) }}>Achievements</div>
                <div
                  style={{ fontWeight: 700, fontSize: 20, color: "#7c3aed" }}
                >
                  {achievements.length}/{ACHIEVEMENTS.length}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  
}
