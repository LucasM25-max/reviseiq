import { DEFAULT_BOARD, getDisplayName } from "./coreHelpers.js";
import { MasteryTreemap } from "./diagrams.jsx";
import { Header } from "./header.jsx";
import { buildTodaySessionPlan, getNextGoal } from "./learningEngine.js";
import { Figure, Ring } from "./lumen.jsx";
import { MasteryRings, calculateExamReadiness, calculateMastery } from "./mastery.jsx";
import { TodayWidget } from "./practice.jsx";
import { calcLongestStreak, todayStr } from "./scheduling.js";
import { mergeTopics } from "./social.jsx";
import { pctToGrade, showToast } from "./ui.jsx";

export function HomeScreen(props) {
  const { D, activityDates, allSections, boardData, boardSels, calibrationData, engineEvents, ensureBoardLoaded, fcHist, getBD, goToGoal, hProps, setBlurtSecId2, setBlurtSubjId, setFcIdx, setFlip, setQIdx, setQRes, setScreen, setSecId, setSelOpt, setShowTreemap, setSubIdx, setSubjTab, setTA, setTab, setTopIdx, showTreemap, stats, streak, subjects, targetGrades, timetableExams, totalDaysStudied, user, userDisplayName, weeklyPlan } = props;

    const _dn = userDisplayName || getDisplayName(user);
    const _hh = new Date().getHours();
    const _greet = _hh < 12 ? "Good morning" : _hh < 18 ? "Good afternoon" : "Good evening";
    const _nowMs = Date.now();
    const _upExams = (timetableExams || []).filter((e) => e && e.date && new Date(e.date + "T00:00:00").getTime() >= _nowMs - 86400000).sort((a, b) => a.date.localeCompare(b.date));
    const _nextExam = _upExams[0] || null;
    const _nextExamSubj = _nextExam ? (subjects.find((s) => s.id === _nextExam.subjectId) || null) : null;
    const _nextExamDays = _nextExam ? Math.max(0, Math.round((new Date(_nextExam.date + "T00:00:00").getTime() - _nowMs) / 86400000)) : null;
    const guidedPlan = buildTodaySessionPlan({ subjects, allSections, stats, fcHist, timetableExams });
    const gb = guidedPlan.primaryBlock || {};
    const nextGoal = getNextGoal({ subjects, allSections, stats, fcHist, calibrationData, timetableExams, streak, events: engineEvents });
    const sid0 = subjects[0] ? subjects[0].id : null;

    const ink = D ? "#eef1fb" : "#0f1729";
    const sub = D ? "#9aa3c2" : "#5b6478";
    const glassBg = D ? "rgba(255,255,255,.045)" : "rgba(255,255,255,.72)";
    const line = D ? "rgba(255,255,255,.09)" : "rgba(16,24,40,.08)";
    const examChip = { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, border: "1px solid " + line, background: glassBg, color: ink, fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 12 };
    const cardSh = D ? "0 20px 50px -34px rgba(0,0,0,.85)" : "0 20px 50px -34px rgba(76,29,149,.35)";
    const auroraBg = D
      ? "radial-gradient(1200px 820px at 12% -12%, rgba(124,58,237,.20), transparent 60%), radial-gradient(1000px 720px at 102% 4%, rgba(217,70,239,.14), transparent 55%), radial-gradient(900px 700px at 50% 120%, rgba(59,130,246,.10), transparent 55%), #0a0a14"
      : "radial-gradient(1100px 780px at 10% -10%, rgba(124,58,237,.10), transparent 60%), radial-gradient(940px 660px at 104% 2%, rgba(217,70,239,.08), transparent 55%), radial-gradient(820px 640px at 50% 116%, rgba(59,130,246,.06), transparent 55%), #f6f6fc";

    const pageShell = { minHeight: "100vh", background: auroraBg, color: ink, paddingBottom: 64 };
    const container = { maxWidth: 1080, margin: "0 auto", padding: "0 22px", display: "flex", flexDirection: "column", gap: 22, boxSizing: "border-box" };
    const greetRow = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginTop: 28 };
    const greetH = { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.08, color: ink, fontFamily: "var(--riq-display, inherit)" };
    const greetSub = { margin: "7px 0 0", fontSize: 14.5, color: sub, fontWeight: 500 };
    const ghostBtn = { fontSize: 13, fontWeight: 700, color: D ? "#c4b5fd" : "#6d28d9", padding: "9px 15px", borderRadius: 11, border: "1px solid " + (D ? "rgba(167,139,250,.3)" : "rgba(124,58,237,.25)"), background: D ? "rgba(124,58,237,.08)" : "rgba(124,58,237,.05)", cursor: "pointer", whiteSpace: "nowrap" };

    const hero = { position: "relative", overflow: "hidden", borderRadius: 26, padding: "30px 30px", background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 42%, #c026d3 100%)", boxShadow: "0 30px 70px -34px rgba(124,58,237,.75)", color: "#fff" };
    const heroGlow = { position: "absolute", top: -120, right: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.22), transparent 70%)", pointerEvents: "none" };
    const heroCol = { flex: 1, minWidth: 0 };
    const heroInner = { position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" };
    const heroKicker = { fontSize: 11.5, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.8)" };
    const heroTitle = { margin: "8px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.12, fontFamily: "var(--riq-display, inherit)", maxWidth: 560 };
    const heroSub = { margin: "8px 0 0", fontSize: 14.5, color: "rgba(255,255,255,.86)", maxWidth: 540, lineHeight: 1.5 };
    const heroRow = { display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" };
    const startWith = { fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.95)", padding: "7px 13px", borderRadius: 999, background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.25)" };
    const heroBadge = { fontSize: 11, fontWeight: 800, letterSpacing: ".06em", padding: "5px 10px", borderRadius: 999, background: "rgba(255,255,255,.92)", color: "#6d28d9" };
    const startBtn = { flexShrink: 0, fontSize: 15, fontWeight: 800, color: "#5b21b6", padding: "14px 24px", borderRadius: 14, border: "none", background: "#fff", cursor: "pointer", boxShadow: "0 14px 30px -12px rgba(0,0,0,.4)", whiteSpace: "nowrap" };

    const statStrip = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 };
    const statTile = { background: glassBg, border: "1px solid " + line, borderRadius: 18, padding: "16px 18px", boxShadow: cardSh, backdropFilter: "blur(12px)" };
    const statNum = { fontSize: 26, fontWeight: 800, color: ink, fontFamily: "var(--riq-display, inherit)", lineHeight: 1 };
    const statLbl = { fontSize: 12, fontWeight: 600, color: sub, marginTop: 6, textTransform: "uppercase", letterSpacing: ".04em" };
    const heatTile = { background: glassBg, border: "1px solid " + line, borderRadius: 18, padding: "16px 18px", boxShadow: cardSh, backdropFilter: "blur(12px)", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" };
    const weekCol = { display: "flex", flexDirection: "column", gap: 4 };
    const cellStyle = function (c) { return { width: 13, height: 13, borderRadius: 4, background: c.a ? "linear-gradient(135deg,#7c3aed,#c026d3)" : (D ? "rgba(255,255,255,.08)" : "rgba(16,24,40,.06)"), outline: c.t ? "2px solid " + (D ? "#c4b5fd" : "#7c3aed") : "none", outlineOffset: 1 }; };

    const sectionLbl = { fontSize: 12.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: sub, margin: "6px 0 -6px" };
    const card = { background: glassBg, border: "1px solid " + line, borderRadius: 22, padding: 22, boxShadow: cardSh, backdropFilter: "blur(12px)" };
    const choiceGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 14 };
    const choiceCard = { textAlign: "left", padding: "15px 16px", borderRadius: 15, border: "1px solid " + line, background: D ? "rgba(255,255,255,.03)" : "#fff", cursor: "pointer", transition: "transform .16s cubic-bezier(.22,1,.36,1), border-color .16s ease" };
    const choiceTitle = { fontSize: 14.5, fontWeight: 800, color: ink };
    const choiceDesc = { fontSize: 12.5, color: sub, marginTop: 4, lineHeight: 1.45 };
    const h3s = { margin: 0, fontSize: 17, fontWeight: 800, color: ink, fontFamily: "var(--riq-display, inherit)" };
    const dayRow = { display: "flex", gap: 10, marginTop: 14, overflowX: "auto", paddingBottom: 4 };
    const dayChip = { flexShrink: 0, minWidth: 124, textAlign: "left", padding: "12px 14px", borderRadius: 14, border: "1px solid " + line, background: D ? "rgba(255,255,255,.03)" : "#fff", cursor: "pointer" };
    const dayName = { fontSize: 12, fontWeight: 800, color: D ? "#c4b5fd" : "#7c3aed", textTransform: "uppercase", letterSpacing: ".05em" };
    const dayTask = { fontSize: 12.5, color: sub, marginTop: 5, lineHeight: 1.4 };
    const toggleRow = { display: "flex", justifyContent: "flex-end" };
    const toggleBtn = { fontSize: 12.5, fontWeight: 700, color: D ? "#c4b5fd" : "#6d28d9", padding: "8px 14px", borderRadius: 11, border: "1px solid " + (D ? "rgba(167,139,250,.3)" : "rgba(124,58,237,.25)"), background: "transparent", cursor: "pointer" };

    const subjGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(216px, 1fr))", gap: 14 };
    const subjCard = { position: "relative", textAlign: "left", padding: 18, borderRadius: 20, border: "1px solid " + line, background: glassBg, boxShadow: cardSh, backdropFilter: "blur(12px)", cursor: "pointer", transition: "transform .18s cubic-bezier(.22,1,.36,1), box-shadow .18s ease", display: "flex", flexDirection: "column" };
    const subjTopRow = { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, minHeight: 56 };
    const gradeBadge = { fontSize: 13, fontWeight: 800, color: ink };
    const targetBadge = { fontSize: 11.5, fontWeight: 700, color: sub };
    const subjIcon = function (accent) { return { width: 46, height: 46, borderRadius: 13, background: "linear-gradient(135deg," + accent + "," + accent + "99)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, marginBottom: 12, boxShadow: "0 8px 18px -8px " + accent }; };
    const subjName = { fontSize: 15.5, fontWeight: 800, color: ink };
    const subjMeta = { display: "flex", alignItems: "center", gap: 7, marginTop: 6, flexWrap: "wrap" };
    const boardBadge = { fontSize: 11, fontWeight: 700, color: sub, padding: "3px 8px", borderRadius: 7, background: D ? "rgba(255,255,255,.06)" : "rgba(16,24,40,.05)" };
    const metaSmall = { fontSize: 11.5, color: sub, fontWeight: 600 };

    const personalWrap = { ...card, marginTop: 4 };
    const personalHead = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" };
    const personalGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginTop: 16 };
    const personalCard = { textAlign: "left", padding: 16, borderRadius: 16, border: "1px solid " + line, background: D ? "rgba(255,255,255,.03)" : "#fff", cursor: "pointer", transition: "transform .16s ease" };
    const emptyNote = { fontSize: 13, color: sub, marginTop: 14, lineHeight: 1.5 };
    const adminBar = { borderRadius: 16, border: "1px solid " + (D ? "rgba(167,139,250,.3)" : "#ddd6fe"), background: D ? "rgba(124,58,237,.08)" : "rgba(124,58,237,.05)", overflow: "hidden" };
    const adminHead = { padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: "1px solid " + (D ? "rgba(167,139,250,.25)" : "#ddd6fe") };
    const adminTag = { fontSize: 12, fontWeight: 800, color: D ? "#c4b5fd" : "#6d28d9", textTransform: "uppercase", letterSpacing: ".06em" };
    const adminHint = { fontSize: 12.5, color: sub };
    const adminBtns = { padding: "12px 16px", display: "flex", gap: 10, flexWrap: "wrap" };
    const adminBtn = { fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 9, border: "1.5px solid " + (D ? "#a78bfa" : "#7c3aed"), background: "transparent", color: D ? "#c4b5fd" : "#6d28d9", cursor: "pointer" };

    const liftIn = function (e) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 26px 56px -30px rgba(124,58,237,.5)"; };
    const liftOut = function (e) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = cardSh; };
    const choiceIn = function (e) { e.currentTarget.style.borderColor = D ? "#a78bfa" : "#7c3aed"; e.currentTarget.style.transform = "translateY(-2px)"; };
    const choiceOut = function (e) { e.currentTarget.style.borderColor = line; e.currentTarget.style.transform = ""; };

    const _subjReadiness = subjects.map(function (s) { try { return calculateExamReadiness(s.id, allSections, fcHist, stats, calibrationData[s.id], timetableExams)?.score ?? 0; } catch (e) { return 0; } });
    const overallReadiness = _subjReadiness.length ? Math.round(_subjReadiness.reduce(function (a, b) { return a + b; }, 0) / _subjReadiness.length) : 0;
    const readyCardWrap = { display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", padding: 22, borderRadius: 22, background: glassBg, border: "1px solid " + line, boxShadow: cardSh, backdropFilter: "blur(12px)" };
    const readyLbl = { fontSize: 12.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: sub };
    const readyTextWrap = { minWidth: 0, flex: 1 };
    const readyFigWrap = { marginTop: 8 };
    const readyP = { margin: "8px 0 0", fontSize: 13.5, color: sub, lineHeight: 1.5, maxWidth: 480 };

    return (
      <div style={pageShell} className="fade-in">
        <Header {...hProps} />
        <div style={container}>
          <div style={greetRow}>
            <div>
              <h2 style={greetH}>{_greet}, {_dn}</h2>
              {_nextExam && (
                <button style={examChip} onClick={() => setScreen("timetable")}>
                  📅 {_nextExamDays === 0 ? "Exam today" : _nextExamDays + (_nextExamDays === 1 ? " day to " : " days to ") + (_nextExamSubj && _nextExamSubj.name ? _nextExamSubj.name.split(" ")[0] : "next exam")}
                </button>
              )}
              <p style={greetSub}>Here’s your focused plan for today — one clear step at a time.</p>
            </div>
          </div>

          <div style={hero}>
            <div style={heroGlow} />
            <div style={heroInner}>
              <div style={heroCol}>
                <div style={heroKicker}>Your next goal {nextGoal.icon}</div>
                <h3 style={heroTitle}>{nextGoal.title}</h3>
                <p style={heroSub}>{nextGoal.instruction}</p>
                <div style={heroRow}>
                  <span style={startWith}>Why now: {nextGoal.reason}</span>
                  <span style={heroBadge}>≈ {nextGoal.etaMin} min</span>
                </div>
              </div>
              <button
                onClick={() => goToGoal(nextGoal)}
                style={startBtn}
              >
                Start →
              </button>
            </div>
          </div>

          {subjects.length > 0 ? (
            <div style={readyCardWrap}>
              <Ring value={overallReadiness / 100} size={104} stroke={11} label={overallReadiness + "%"} sub="ready" D={D} />
              <div style={readyTextWrap}>
                <div style={readyLbl}>Exam readiness</div>
                <div style={readyFigWrap}>
                  <Figure size={28} D={D} gradient>{overallReadiness >= 70 ? "On track" : overallReadiness >= 50 ? "Building momentum" : "Getting started"}</Figure>
                </div>
                <p style={readyP}>A blended signal across {subjects.length} subject{subjects.length === 1 ? "" : "s"} — retention, accuracy, coverage, calibration and spacing combined.</p>
              </div>
            </div>
          ) : null}

          {streak > 0 ? (
            <div style={statStrip}>
              <div style={statTile}>
                <div style={statNum}>{streak}🔥</div>
                <div style={statLbl}>Day streak</div>
              </div>
              <div style={statTile}>
                <div style={statNum}>{calcLongestStreak(activityDates)}d</div>
                <div style={statLbl}>Longest streak</div>
              </div>
              {totalDaysStudied > 0 ? (
                <div style={statTile}>
                  <div style={statNum}>{totalDaysStudied}</div>
                  <div style={statLbl}>Total days</div>
                </div>
              ) : null}
              <div style={heatTile}>
                {(() => {
                  const weeks = [];
                  const t = new Date();
                  t.setHours(0, 0, 0, 0);
                  const dow = t.getDay() === 0 ? 6 : t.getDay() - 1;
                  const startD = new Date(t);
                  startD.setDate(startD.getDate() - dow - 14);
                  for (let w = 0; w < 3; w++) {
                    const week = [];
                    for (let d = 0; d < 7; d++) {
                      const dt = new Date(startD);
                      dt.setDate(dt.getDate() + w * 7 + d);
                      const k = dt.toISOString().slice(0, 10);
                      week.push({ k, a: activityDates.has(k), t: k === todayStr() });
                    }
                    weeks.push(week);
                  }
                  return weeks.map((wk, wi) => (
                    <div key={wi} style={weekCol}>
                      {wk.map((c) => (<div key={c.k} title={c.k} style={cellStyle(c)} />))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : null}

          {null}

          <TodayWidget
            D={D}
            subjects={subjects}
            allSections={allSections}
            fcHist={fcHist}
            stats={stats}
            timetableExams={timetableExams}
            boardSels={boardSels}
            onNavigateSection={function (sec, toTab) {
              const si = subjects.findIndex(function (s) { return s.id === sec.subjectId; });
              if (si < 0) return;
              setSubIdx(si);
              const b = boardSels[subjects[si].id] || DEFAULT_BOARD;
              ensureBoardLoaded(subjects[si].id, b).then(function () {
                const bd = boardData[subjects[si].id + ":" + b] || { custom: [], extras: {}, papers: [] };
                const merged = mergeTopics(subjects[si].topics || [], bd.custom, bd.extras);
                const ti = merged.findIndex(function (t) { return t.sections.some(function (s) { return s.id === sec.id; }); });
                if (ti < 0) return;
                setTopIdx(ti);
                setSecId(sec.id);
                setTab(toTab || "flashcards");
                setFcIdx(0);
                setFlip(false);
                setQIdx(0);
                setQRes(null);
                setSelOpt(null);
                setTA("");
                setSubjTab("sections");
                setScreen("section");
              });
            }}
            onNavigateBlurt={function (subjId, secId2) {
              setBlurtSubjId(subjId);
              setBlurtSecId2(secId2);
              setScreen("blurting");
            }}
            onMock={function () { setScreen("mock"); }}
          />

          {weeklyPlan && weeklyPlan.length > 0 ? (
            <div style={card}>
              <h3 style={h3s}>Weekly AI learning plan</h3>
              <div style={dayRow}>
                {weeklyPlan.slice(0, 7).map((d, idx) => (
                  <button key={idx} onClick={() => setScreen("target")} style={dayChip}>
                    <div style={dayName}>{d.day}</div>
                    <div style={dayTask}>{d.tasks ? d.tasks[0] : null}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div style={sectionLbl}>Explore</div>
          <div style={subjGrid}>
            {[
              { icon: "📚", label: "Study", desc: "Subjects, flashcards & questions", on: () => setScreen("study") },
              { icon: "🧠", label: "Sage · AI Coach", desc: "Tutor & homework help", on: () => setScreen("coach") },
              { icon: "📈", label: "Progress", desc: "Mastery, calibration & journal", on: () => setScreen("dashboard") },
              { icon: "📅", label: "Timetable", desc: "Exam dates & countdown", on: () => setScreen("timetable") },
              { icon: "📝", label: "Mock exam", desc: "Sit a full timed paper", on: () => setScreen("mock") },
            ].map((it) => (
              <button key={it.label} style={subjCard} onClick={it.on} onMouseEnter={liftIn} onMouseLeave={liftOut}>
                <div style={subjIcon("#7c3aed")}>{it.icon}</div>
                <div style={subjName}>{it.label}</div>
                <div style={choiceDesc}>{it.desc}</div>
              </button>
            ))}
          </div>
        </div>


      </div>
    );
  
}
