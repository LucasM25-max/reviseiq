import React, { useState, useEffect, useRef } from "react";
import { SK } from "./coreHelpers.js";
import { ACT_DEFS } from "./blurtingScreen.jsx";
import { B, C, I, mu, tx, uid } from "./ui.jsx";

export function TimetableScreen({
  D,
  subjects,
  allSections,
  user,
  stats,
  onNav,
  onBack,
}) {
  const [tab, setTab] = useState("exams");
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [goalMet, setGoalMet] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [eSubj, setESubj] = useState(subjects[0]?.id || "");
  const [eSec, setESec] = useState("");
  const [eDate, setEDate] = useState("");
  const [eLabel, setELabel] = useState("");

  const [schoolTT, setSchoolTT] = useState({
    startTime: "08:30",
    endTime: "15:30",
    days: [1, 2, 3, 4, 5],
    events: [],
  });
  const [showSchoolTT, setShowSchoolTT] = useState(false);
  const [newEvTitle, setNewEvTitle] = useState("");
  const [newEvDay, setNewEvDay] = useState(1);
  const [newEvStart, setNewEvStart] = useState("09:00");
  const [newEvEnd, setNewEvEnd] = useState("10:00");
  const saveRef = useRef(null);

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
  const bd2 = D ? "#2a3347" : "#e5e7eb";
  const today = new Date().toISOString().slice(0, 10);
  const secList = allSections.filter((s) => s.subjectId === eSubj);
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(SK.TIMETABLE(user));
        if (r?.value) {
          const d = JSON.parse(r.value);
          if (d.exams) setExams(d.exams);
          if (d.sessions) setSessions(d.sessions);
          if (d.goalMet) setGoalMet(d.goalMet);
          if (d.schoolTT) setSchoolTT(d.schoolTT);
        }
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      window.storage
        .set(
          SK.TIMETABLE(user),
          JSON.stringify({ exams, sessions, goalMet, schoolTT }),
        )
        .catch(() => {});
    }, 500);
    return () => clearTimeout(saveRef.current);
  }, [exams, sessions, goalMet, schoolTT, loaded]);
  const addExam = () => {
    if (!eDate || !eSubj) return;
    const subj = subjects.find((s) => s.id === eSubj);
    const sec = allSections.find((s) => s.id === eSec);
    const label =
      eLabel ||
      (sec ? `${subj?.icon} ${sec.title}` : `${subj?.icon} ${subj?.name}`);
    setExams((p) => [
      ...p,
      {
        id: uid(),
        subjectId: eSubj,
        sectionId: eSec || null,
        date: eDate,
        label,
      },
    ]);
    setEDate("");
    setELabel("");
    setESec("");
    setSessions([]);
  };
  const removeExam = (id) => {
    setExams((p) => p.filter((e) => e.id !== id));
    setSessions([]);
    setGoalMet({});
  };
  const toggleGoal = (k) => setGoalMet((p) => ({ ...p, [k]: !p[k] }));
  const toggleExp = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const sessionDone = (s) =>
    s.activities.every((_, ai) => goalMet[`${s.id}_${ai}`]);

  const fmtD = (d) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const fromMins = (m) => {
    const h = Math.floor(m / 60);
    const mn = m % 60;
    return `${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
  };

  const getFreeSlots = (date, existingOnDay) => {
    const dow = date.getDay();
    const isSchoolDay = schoolTT.days.includes(dow);
    const schoolStart = toMins(schoolTT.startTime);
    const schoolEnd = toMins(schoolTT.endTime);

    const candidates = [];

    for (
      let m = 7 * 60;
      m + 45 <= schoolStart && m + 45 <= 8 * 60 + 30;
      m += 30
    )
      candidates.push(m);

    if (isSchoolDay && schoolEnd > 13 * 60 + 15) candidates.push(12 * 60 + 30);

    const afterStart = isSchoolDay ? schoolEnd : 15 * 60;
    for (let m = afterStart; m + 45 <= 21 * 60; m += 45) candidates.push(m);

    if (!isSchoolDay) {
      for (let m = 9 * 60; m + 45 <= 12 * 60; m += 45) candidates.push(m);
    }

    const blockedRanges = isSchoolDay
      ? [
          { s: schoolStart, e: schoolEnd },
          ...(schoolTT.events || [])
            .filter((ev) => ev.day === dow)
            .map((ev) => ({ s: toMins(ev.startTime), e: toMins(ev.endTime) })),
        ]
      : [];

    const occupiedRanges = (existingOnDay || []).map((s) => ({
      s: toMins(s.startTime),
      e: toMins(s.endTime) + 45,
    }));
    return candidates
      .filter((m) => {
        const end = m + 45;

        for (const r of [...blockedRanges, ...occupiedRanges]) {
          if (m < r.e && end > r.s) return false;
        }
        return true;
      })
      .map((m) => ({ start: fromMins(m), end: fromMins(m + 45) }));
  };

  const getWeakSections = (subjectId, sectionPool) => {
    const weakQ = stats?.weakQ || {};
    const scored = sectionPool.map((sec) => {
      const qs = weakQ[sec.id];
      const pct = qs && qs.t > 0 ? qs.s / qs.t : null;
      return { sec, pct };
    });
    const withData = scored
      .filter((x) => x.pct !== null)
      .sort((a, b) => a.pct - b.pct);
    const withoutData = scored.filter((x) => x.pct === null);
    return [...withData, ...withoutData].map((x) => x.sec);
  };
  const generate = () => {
    if (!exams.length) return;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sorted = [...exams]
      .filter((e) => new Date(e.date + "T00:00:00") > now)
      .sort((a, b) => a.date.localeCompare(b.date));
    const allSess = [];

    const sessPerDay = {};
    sorted.forEach((exam) => {
      const examDt = new Date(exam.date + "T00:00:00");
      examDt.setHours(0, 0, 0, 0);
      const daysLeft = Math.round((examDt - now) / 86400000);
      if (daysLeft <= 0) return;
      const subj = subjects.find((s) => s.id === exam.subjectId);
      if (!subj) return;
      const pool = exam.sectionId
        ? allSections.filter((s) => s.id === exam.sectionId)
        : allSections.filter((s) => s.subjectId === exam.subjectId);
      const fallback = [
        {
          id: null,
          title: subj.name,
          flashcards: [],
          questions: [],
          notes: [],
          subjectId: exam.subjectId,
        },
      ];
      const rawPool = pool.length ? pool : fallback;

      const secs = getWeakSections(exam.subjectId, rawPool);

      const gap =
        daysLeft <= 7 ? 1 : daysLeft <= 14 ? 2 : daysLeft <= 30 ? 3 : 5;
      const dates = [];
      for (let d = 0; d < daysLeft && dates.length < 35; d += gap) {
        const dt = new Date(now);
        dt.setDate(dt.getDate() + d);
        dates.push(dt);
      }
      const db = new Date(examDt);
      db.setDate(db.getDate() - 1);
      if (
        db > now &&
        !dates.find(
          (d) => d.toISOString().slice(0, 10) === db.toISOString().slice(0, 10),
        )
      )
        dates.push(db);
      dates.sort((a, b) => a - b);
      dates.forEach((date, di) => {
        const dateStr = date.toISOString().slice(0, 10);
        const existing = sessPerDay[dateStr] || [];
        const slots = getFreeSlots(date, existing);
        if (!slots.length) return;
        const slot = slots[0];
        const sec = secs[di % secs.length];
        const hasFC = (sec.flashcards || []).length > 0;
        const hasQ = (sec.questions || []).length > 0;
        const hasN = (sec.notes || []).length > 0;
        const isLast = di >= dates.length - 2;

        const weakQ = stats?.weakQ || {};
        const qs = weakQ[sec.id];
        const pct = qs && qs.t > 0 ? Math.round((qs.s / qs.t) * 100) : null;
        const weakWarning =
          pct !== null && pct < 60
            ? `
You scored ${pct}% on this topic — prioritise
it!`
            : "";

        const acts = [];
        if (hasFC)
          acts.push({
            ...ACT_DEFS.flashcards,
            navType: "section",
            sectionId: sec.id,
            subjectId: exam.subjectId,
            tip: `Review flashcards for "${sec.title}".${weakWarning} Try to recall each answer before
flipping.`,
            goal: `Complete all flashcards for "${sec.title}" — aim for 80%+ confidence`,
          });
        else
          acts.push({
            ...ACT_DEFS.blurting,
            navType: "blurt",
            sectionId: sec.id,
            subjectId: exam.subjectId,
            tip: `Blurting for "${sec.title}".${weakWarning} Write down everything you know from
memory, then check your notes.`,
            goal: `Fill at least one page blurting "${sec.title}" from memory`,
          });
        if (di % 3 === 0 && hasQ)
          acts.push({
            ...ACT_DEFS.questions,
            navType: "section",
            sectionId: sec.id,
            subjectId: exam.subjectId,

            tip: `Practice questions on "${sec.title}".${weakWarning} Focus on past-paper style
questions.`,
            goal: `Score 70%+ on practice questions for "${sec.title}"`,
          });
        else if (di % 3 === 1)
          acts.push({
            ...ACT_DEFS.blurting,
            navType: "blurt",
            sectionId: sec.id,
            subjectId: exam.subjectId,
            tip: `Second blurting pass for "${sec.title}".${weakWarning} Compare with your first
attempt.`,
            goal: `Identify 3+ things you missed in your first blurting session for "${sec.title}"`,
          });
        else if (hasN)
          acts.push({
            ...ACT_DEFS.notes,
            navType: "section",
            sectionId: sec.id,
            subjectId: exam.subjectId,
            tip: `Review revision notes for "${sec.title}".${weakWarning} Annotate key terms and
definitions.`,
            goal: `Read and annotate all notes for "${sec.title}"`,
          });
        else if (hasQ)
          acts.push({
            ...ACT_DEFS.questions,
            navType: "section",
            sectionId: sec.id,
            subjectId: exam.subjectId,
            tip: `Practice questions on "${sec.title}".${weakWarning}`,
            goal: `Score 70%+ on questions for "${sec.title}"`,
          });
        if (isLast)
          acts.push({
            ...ACT_DEFS.target,
            navType: "target",
            subjectId: exam.subjectId,
            sectionId: null,
            tip: `Final exam-style test on ${subj.name}. Test yourself under timed conditions.`,
            goal: `Complete a full Target Test for ${subj.name} — treat it like the real exam`,
          });
        const sess = {
          id: `s${uid()}`,
          examId: exam.id,
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          subjectId: exam.subjectId,
          sectionId: sec.id,
          topicLabel: sec.title,
          activities: acts,
        };
        allSess.push(sess);
        sessPerDay[dateStr] = [...(sessPerDay[dateStr] || []), sess];
      });
    });
    allSess.sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    );
    setSessions(allSess);
    setGoalMet({});
  };
  const grouped = {};
  sessions.forEach((s) => {
    (grouped[s.date] || (grouped[s.date] = [])).push(s);
  });
  const days = Object.keys(grouped).sort();
  const totalS = sessions.length,
    doneS = sessions.filter((s) => sessionDone(s)).length;
  return (
    <div
      style={{
        minHeight: "100vh",
        background: D ? "#0f1117" : "#f9fafb",
        color: tx(D),
      }}
      className="fade-in"
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              Revision Timetable
            </h2>
            <p style={{ fontSize: 13, color: mu(D) }}>
              Add your exam dates — we'll build a spaced revision plan around
              your school day.
            </p>
          </div>
          {totalS > 0 && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: doneS === totalS ? "#16a34a" : "#6366f1",
                padding: "6px 14px",
                borderRadius: 20,
                background:
                  doneS === totalS
                    ? D
                      ? "rgba(22,163,74,0.15)"
                      : "#dcfce7"
                    : D
                      ? "rgba(99,102,241,0.15)"
                      : "#eef2ff",
              }}
            >
              {doneS}/{totalS} sessions done
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${bd2}`,
            marginBottom: 22,
            gap: 2,
          }}
        >
          {[
            ["exams", "My Exams"],
            ["school", "School Day"],
            ["schedule", "Schedule"],
          ].map(([t, lbl]) => (
            <button
              key={t}
              onClick={() => {
                if (t === "schedule" && !sessions.length && exams.length)
                  generate();
                setTab(t);
              }}
              style={{
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? "#6366f1" : mu(D),
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom:
                  tab === t ? "2px solid #6366f1" : "2px solidtransparent",
                marginBottom: -1,
              }}
            >
              {lbl}
              {t === "schedule" && exams.length > 0 && !sessions.length ? (
                <span style={{ marginLeft: 5, fontSize: 10, color: "#f59e0b" }}>
                  {" "}
                  not generated
                </span>
              ) : (
                ""
              )}
            </button>
          ))}
        </div>
        {tab === "school" && (
          <div className="fade-in">
            <div style={{ ...C(D), padding: 22, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                School Day Settings
              </h3>
              <p style={{ fontSize: 12, color: mu(D), marginBottom: 16 }}>
                Set your school hours so revision sessions are only placed
                outside them.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  {Lbl("School Start")}
                  <input
                    type="time"
                    style={I(D)}
                    value={schoolTT.startTime}
                    onChange={(e) =>
                      setSchoolTT((p) => ({ ...p, startTime: e.target.value }))
                    }
                  />
                </div>
                <div>
                  {Lbl("School End")}
                  <input
                    type="time"
                    style={I(D)}
                    value={schoolTT.endTime}
                    onChange={(e) =>
                      setSchoolTT((p) => ({ ...p, endTime: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                {Lbl("School Days")}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                    const on = schoolTT.days.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() =>
                          setSchoolTT((p) => ({
                            ...p,
                            days: on
                              ? p.days.filter((x) => x !== d)
                              : [...p.days, d].sort(),
                          }))
                        }
                        style={{
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: `1.5px solid ${on ? "#6366f1" : bd2}`,
                          background: on ? "#6366f1" : "transparent",
                          color: on ? "#fff" : mu(D),
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: on ? 600 : 400,
                        }}
                      >
                        {DAY_NAMES[d]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p style={{ fontSize: 11, color: mu(D), marginBottom: 12 }}>
                Optionally add specific lessons or activities that should be
                kept free (e.g. sports, clubs, lessons with extra study):
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                  marginBottom: 12,
                }}
              >
                <div style={{ flex: 2, minWidth: 120 }}>
                  {Lbl("Event name")}
                  <input
                    style={I(D)}
                    placeholder="e.g. Football training"
                    value={newEvTitle}
                    onChange={(e) => setNewEvTitle(e.target.value)}
                  />
                </div>
                <div>
                  {Lbl("Day")}
                  <select
                    style={I(D)}
                    value={newEvDay}
                    onChange={(e) => setNewEvDay(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <option key={d} value={d}>
                        {DAY_NAMES[d]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {Lbl("Start")}
                  <input
                    type="time"
                    style={I(D)}
                    value={newEvStart}
                    onChange={(e) => setNewEvStart(e.target.value)}
                  />
                </div>
                <div>
                  {Lbl("End")}
                  <input
                    type="time"
                    style={I(D)}
                    value={newEvEnd}
                    onChange={(e) => setNewEvEnd(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {
                    if (!newEvTitle.trim()) return;
                    setSchoolTT((p) => ({
                      ...p,
                      events: [
                        ...p.events,
                        {
                          id: uid(),
                          title: newEvTitle.trim(),
                          day: newEvDay,
                          startTime: newEvStart,
                          endTime: newEvEnd,
                        },
                      ],
                    }));
                    setNewEvTitle("");
                  }}
                  style={{
                    ...B("#6366f1", false, {
                      padding: "9px 16px",
                      fontSize: 12,
                      fontWeight: 700,
                      alignSelf: "flex-end",
                    }),
                  }}
                >
                  + Add
                </button>
              </div>
              {(schoolTT.events || []).length > 0 && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {schoolTT.events.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: D ? "#1e2537" : "#f3f4f6",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: tx(D),
                          flex: 1,
                        }}
                      >
                        {ev.title}
                      </span>

                      <span style={{ fontSize: 11, color: mu(D) }}>
                        {DAY_NAMES[ev.day]}
                        {ev.startTime}–{ev.endTime}
                      </span>
                      <button
                        onClick={() =>
                          setSchoolTT((p) => ({
                            ...p,
                            events: p.events.filter((e) => e.id !== ev.id),
                          }))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                          fontSize: 14,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setTab("exams")}
              style={{
                ...B("#6366f1", false, {
                  width: "100%",
                  padding: "11px 0",
                  fontSize: 13,
                  fontWeight: 700,
                }),
              }}
            >
              Back to Exams
            </button>
          </div>
        )}
        {tab === "exams" && (
          <div className="fade-in">
            <div style={{ ...C(D), padding: 22, marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
                Add an Exam Date
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  {Lbl("Subject")}
                  <select
                    style={I(D)}
                    value={eSubj}
                    onChange={(e) => {
                      setESubj(e.target.value);
                      setESec("");
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
                  {Lbl("Exam Date")}
                  <input
                    type="date"
                    style={I(D)}
                    value={eDate}
                    min={today}
                    onChange={(e) => setEDate(e.target.value)}
                  />
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
                <div>
                  {Lbl("Topic / Section (optional)")}
                  <select
                    style={I(D)}
                    value={eSec}
                    onChange={(e) => setESec(e.target.value)}
                  >
                    <option value="">— All sections —</option>
                    {secList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {Lbl("Label (optional)")}
                  <input
                    style={I(D)}
                    placeholder="e.g. Biology Paper 1"
                    value={eLabel}
                    onChange={(e) => setELabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addExam()}
                  />
                </div>
              </div>
              <button
                onClick={addExam}
                disabled={!eDate || !eSubj}
                style={{
                  ...B("#6366f1", false, {
                    width: "100%",
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    opacity: !eDate || !eSubj ? 0.4 : 1,
                    cursor: !eDate || !eSubj ? "not-allowed" : "pointer",
                  }),
                }}
              >
                + Add Exam Date
              </button>
            </div>
            {!exams.length ? (
              <div
                style={{
                  ...C(D),
                  padding: 40,
                  textAlign: "center",
                  color: mu(D),
                }}
              >
                <p style={{ fontSize: 28, marginBottom: 8 }}> </p>
                <p style={{ fontSize: 14 }}>
                  No exams added yet. Add your first exam date above.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  Your Exams ({exams.length})
                </h3>
                {[...exams]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((ex) => {
                    const subj = subjects.find((s) => s.id === ex.subjectId);
                    const dDiff = Math.ceil(
                      (new Date(ex.date + "T12:00:00") - new Date()) / 86400000,
                    );
                    const col =
                      dDiff < 7
                        ? "#ef4444"
                        : dDiff < 21
                          ? "#f59e0b"
                          : "#16a34a";
                    return (
                      <div
                        key={ex.id}
                        style={{
                          ...C(D),
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{subj?.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ex.label}
                          </div>
                          <div style={{ fontSize: 12, color: mu(D) }}>
                            {new Date(ex.date + "T12:00:00").toLocaleDateString(
                              "en-GB",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: col,
                            background: col + "22",
                            padding: "3px 9px",
                            borderRadius: 20,
                            flexShrink: 0,
                          }}
                        >
                          {dDiff <= 0
                            ? "Today"
                            : dDiff === 1
                              ? "Tomorrow"
                              : `${dDiff} days`}
                        </span>
                        <button
                          onClick={() => removeExam(ex.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontSize: 18,
                            lineHeight: 1,
                            flexShrink: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    onClick={() => setTab("school")}
                    style={{
                      ...B("transparent", true, {
                        flex: 1,
                        padding: "11px 0",
                        fontSize: 13,
                        fontWeight: 600,
                        borderColor: bd2,
                        color: mu(D),
                      }),
                    }}
                  >
                    School Day Settings
                  </button>
                  <button
                    onClick={() => {
                      generate();
                      setTab("schedule");
                    }}
                    style={{
                      ...B("#6366f1", false, {
                        flex: 2,
                        padding: "12px 0",
                        fontSize: 14,
                        fontWeight: 700,
                      }),
                    }}
                  >
                    Generate Timetable{" "}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "schedule" && (
          <div className="fade-in">
            {!sessions.length ? (
              <div style={{ ...C(D), padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}> </p>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                  No schedule generated yet
                </p>
                <p style={{ fontSize: 13, color: mu(D), marginBottom: 16 }}>
                  {exams.length
                    ? "Click below togenerate your personalised timetable."
                    : 'Add exam dates first in the "My Exams" tab.'}
                </p>
                {exams.length > 0 && (
                  <button
                    onClick={generate}
                    style={{
                      ...B("#6366f1", false, {
                        fontSize: 13,
                        padding: "10px 22px",
                      }),
                    }}
                  >
                    Generate Timetable
                  </button>
                )}
                {!exams.length && (
                  <button
                    onClick={() => setTab("exams")}
                    style={{
                      ...B("#6366f1", true, {
                        fontSize: 13,
                        padding: "10px 22px",
                      }),
                    }}
                  >
                    Add Exams{" "}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 16,
                    alignItems: "center",
                  }}
                >
                  {exams.map((ex) => {
                    const subj = subjects.find((s) => s.id === ex.subjectId);
                    const eSessions = sessions.filter(
                      (s) => s.examId === ex.id,
                    );
                    const eDone = eSessions.filter((s) =>
                      sessionDone(s),
                    ).length;
                    const dDiff = Math.ceil(
                      (new Date(ex.date + "T12:00:00") - new Date()) / 86400000,
                    );
                    return (
                      <div
                        key={ex.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          borderRadius: 20,
                          background: D ? "#1e2537" : "#f3f4f6",
                          border: `1.5px solid ${subj?.accent || "#6366f1"}`,
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{subj?.icon}</span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: subj?.accent,
                          }}
                        >
                          {ex.label}
                        </span>
                        <span style={{ fontSize: 10, color: mu(D) }}>
                          {eDone}/{eSessions.length}
                        </span>
                        {dDiff > 0 && (
                          <span style={{ fontSize: 10, color: mu(D) }}>
                            · {dDiff}d
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => {
                      generate();
                    }}
                    style={{
                      ...B("transparent", true, {
                        fontSize: 11,
                        padding: "4px 10px",
                        borderColor: D ? "#374151" : "#d1d5db",
                        color: mu(D),
                        marginLeft: "auto",
                      }),
                    }}
                  >
                    Regenerate
                  </button>
                </div>

                {days.map((day) => {
                  const daySess = grouped[day];
                  const isToday = day === today;
                  const isPast = day < today;

                  return (
                    <div
                      key={day}
                      style={{ marginBottom: 14, opacity: isPast ? 0.6 : 1 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: isToday ? "#6366f1" : tx(D),
                          }}
                        >
                          {fmtD(day)}
                        </span>
                        {isToday && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#fff",
                              background: "#6366f1",
                              padding: "1px 7px",
                              borderRadius: 10,
                            }}
                          >
                            TODAY
                          </span>
                        )}
                        {isPast && (
                          <span
                            style={{
                              fontSize: 10,
                              color: mu(D),
                              fontStyle: "italic",
                            }}
                          >
                            past
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {daySess.map((sess) => {
                          const subj = subjects.find(
                            (s) => s.id === sess.subjectId,
                          );
                          const done = sessionDone(sess);
                          const actsDone = sess.activities.filter(
                            (_, ai) => goalMet[`${sess.id}_${ai}`],
                          ).length;
                          const isExp = !!expanded[sess.id];
                          return (
                            <div
                              key={sess.id}
                              style={{
                                ...C(D),
                                overflow: "hidden",
                                borderLeft: `4px solid ${subj?.accent || "#6366f1"}`,
                                opacity: done ? 0.7 : 1,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "11px 14px",
                                  cursor: "pointer",
                                }}
                                onClick={() => toggleExp(sess.id)}
                              >
                                <div
                                  style={{
                                    textAlign: "center",
                                    minWidth: 50,
                                    flexShrink: 0,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: subj?.accent || "#6366f1",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {sess.startTime}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: mu(D),
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    –{sess.endTime}
                                  </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      fontSize: 13,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {sess.topicLabel}
                                  </div>
                                  <div style={{ fontSize: 11, color: mu(D) }}>
                                    {subj?.icon} {subj?.name} ·{actsDone}/
                                    {sess.activities.length} goal
                                    {sess.activities.length !== 1 ? "s" : ""}{" "}
                                    met
                                  </div>
                                </div>
                                {done ? (
                                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                                    {" "}
                                  </span>
                                ) : (
                                  <div
                                    style={{
                                      width: 32,
                                      height: 6,
                                      borderRadius: 3,
                                      background: D ? "#374151" : "#e5e7eb",
                                      flexShrink: 0,
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: "100%",
                                        borderRadius: 3,
                                        background: subj?.accent || "#6366f1",
                                        width: `${(actsDone / sess.activities.length) * 100}%`,
                                        transition: "width .3s",
                                      }}
                                    />
                                  </div>
                                )}
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: mu(D),
                                    flexShrink: 0,
                                  }}
                                >
                                  {isExp ? "▲" : "▼"}
                                </span>
                              </div>

                              {isExp && (
                                <div
                                  style={{
                                    padding: "0 14px 14px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                  }}
                                >
                                  {sess.activities.map((act, ai) => {
                                    const gKey = `${sess.id}_${ai}`;
                                    const gDone = !!goalMet[gKey];
                                    return (
                                      <div
                                        key={ai}
                                        style={{
                                          padding: "12px 14px",
                                          borderRadius: 10,
                                          background: D ? "#1e2537" : "#f9fafb",
                                          border: `1.5px solid ${gDone ? "#16a34a" : D ? "#374151" : "#e5e7eb"}`,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 10,
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 20,
                                              flexShrink: 0,
                                              marginTop: 1,
                                            }}
                                          >
                                            {act.icon}
                                          </span>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                              style={{
                                                fontWeight: 700,
                                                fontSize: 13,
                                                marginBottom: 3,
                                              }}
                                            >
                                              {act.label}
                                            </div>
                                            <div
                                              style={{
                                                fontSize: 11,
                                                color: mu(D),
                                                lineHeight: 1.55,
                                                marginBottom: 8,
                                              }}
                                            >
                                              {act.tip}
                                            </div>
                                            <label
                                              style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 7,
                                                cursor: "pointer",
                                                userSelect: "none",
                                              }}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={gDone}
                                                onChange={() =>
                                                  toggleGoal(gKey)
                                                }
                                                style={{
                                                  accentColor: "#16a34a",
                                                  width: 14,
                                                  height: 14,
                                                  marginTop: 1,
                                                  flexShrink: 0,
                                                }}
                                              />
                                              <span
                                                style={{
                                                  fontSize: 12,
                                                  color: gDone
                                                    ? "#16a34a"
                                                    : tx(D),
                                                  fontWeight: gDone ? 600 : 400,
                                                  textDecoration: gDone
                                                    ? "line-through"
                                                    : "none",
                                                  lineHeight: 1.5,
                                                }}
                                              >
                                                {act.goal}
                                              </span>
                                            </label>
                                          </div>
                                          {(act.navType === "section" &&
                                            act.sectionId) ||
                                          act.navType === "target" ||
                                          act.navType === "blurt" ? (
                                            <button
                                              onClick={() => onNav(act)}
                                              style={{
                                                ...B(
                                                  subj?.accent || "#6366f1",
                                                  true,
                                                  {
                                                    fontSize: 11,
                                                    padding: "5px 10px",
                                                    flexShrink: 0,
                                                    whiteSpace: "nowrap",
                                                  },
                                                ),
                                              }}
                                            >
                                              Go{" "}
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div
                  style={{
                    marginTop: 8,
                    padding: "11px 16px",
                    borderRadius: 12,
                    background: D ? "#1e2537" : "#f3f4f6",
                    fontSize: 12,
                    color: mu(D),
                  }}
                >
                  Sessions use spaced intervals and prioritise your weakest
                  topics. Times are placed outside your school day
                  automatically.
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
