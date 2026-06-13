import React, { useState, useEffect, useRef } from "react";
import { AnnotatedImage } from "./annotation.jsx";
import { generateMockQuestions, generatePartedPaper, generateStructuredPaper, getMockSpec } from "./papers.js";
import { mergeTopics } from "./social.jsx";
import { B, C, I, gradeColor, mu, pctToGrade, stripHtml, trackEvent, tx } from "./ui.jsx";

export function MockImage({ query, D }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    const term = query.trim().replace(/\s+/g, "_");
    fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.thumbnail?.source) setImgSrc(d.thumbnail.source);
      })
      .catch(() => {})
      .finally(() => setTried(true));
  }, [query]);
  if (!tried)
    return (
      <div
        style={{
          fontSize: 11,
          color: mu(D),
          fontStyle: "italic",
          padding: "4px 0",
        }}
      >
        Loading diagram: {query}…
      </div>
    );
  if (!imgSrc)
    return (
      <div
        style={{
          padding: "10px14px",
          borderRadius: 8,
          background: D ? "rgba(99,102,241,.08)" : "#f5f3ff",
          border: `1px dashed
${D ? "#4f46e5" : "#a5b4fc"}`,
          fontSize: 12,
          color: D ? "#a5b4fc" : "#4f46e5",
          fontStyle: "italic",
          margin: "8px 0",
        }}
      >
        [Diagram: {query}]
      </div>
    );
  return (
    <div style={{ margin: "10px 0" }}>
      <img
        src={imgSrc}
        alt={query}
        style={{
          maxWidth: "100%",
          maxHeight: 300,
          borderRadius: 8,
          display: "block",
          border: `1px solid
${D ? "#374151" : "#e5e7eb"}`,
        }}
      />
      <div
        style={{
          fontSize: 10,
          color: mu(D),
          marginTop: 3,
          fontStyle: "italic",
        }}
      >
        {query}
      </div>
    </div>
  );
}

export function parseQuestionText(text, D, fontSize = 14) {
  if (!text) return null;

  const imgParts = text.split(/\[IMG:\s*([^\]]+)\]/g);

  if (imgParts.length === 1) {
    return (
      <div
        style={{
          fontSize,
          lineHeight: 1.8,
          color: tx(D),
          whiteSpace: "pre-line",
        }}
      >
        {text}
      </div>
    );
  }
  const out = [];
  for (let i = 0; i < imgParts.length; i++) {
    if (i % 2 === 0) {
      if (imgParts[i].trim())
        out.push(
          <div
            key={i}
            style={{
              fontSize,
              lineHeight: 1.8,
              color: tx(D),
              whiteSpace: "pre-line",
            }}
          >
            {imgParts[i]}
          </div>,
        );
    } else {
      out.push(<MockImage key={i} query={imgParts[i].trim()} D={D} />);
    }
  }
  return <>{out}</>;
}

export function NumberedExtract({ text, D }) {
  if (!text) return null;
  var lines = text.split("\n");
  var lineNum = 0;
  return (
    <div
      style={{
        fontFamily: "Georgia,serif",
        fontSize: 13,
        lineHeight: 1.9,
        color: D ? "#e5e7eb" : "#1f2937",
      }}
    >
      {lines.map(function (line, i) {
        var isBlank = !line.trim();
        if (!isBlank) lineNum++;
        var num = isBlank ? null : lineNum;
        return (
          <div key={i} style={{ display: "flex", gap: 0, minHeight: "1.9em" }}>
            <span
              style={{
                width: 32,
                flexShrink: 0,
                fontSize: 10,
                color: D ? "#8896b3" : "#9ca3af",
                userSelect: "none",
                paddingTop: 2,
                textAlign: "right",
                paddingRight: 8,
                fontFamily: "monospace",
              }}
            >
              {num || ""}
            </span>
            <span style={{ flex: 1 }}>{line || " "}</span>
          </div>
        );
      })}
    </div>
  );
}

export function HistoryInterpBlock({ text, title, D }) {
  return (
    <div
      style={{
        border: "2px solid" + (D ? "#92400e" : "#78350f"),
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          background: D ? "#451a03" : "#92400e",
          color: "#fef3c7",
          padding: "6px14px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        {title || "SOURCE A"}
      </div>
      <div
        style={{
          background: D ? "#1c1008" : "#fffbeb",
          padding: "14px16px",
          fontSize: 13,
          lineHeight: 1.85,
          color: D ? "#fef3c7" : "#1c1917",
          fontFamily: "Georgia,serif",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function GradeBoundaryBar({ pct, D }) {
  var boundaries = [
    { grade: "U", min: 0, max: 19, color: "#6b7280" },
    { grade: "1", min: 20, max: 29, color: "#ef4444" },
    { grade: "2", min: 30, max: 39, color: "#f97316" },
    { grade: "3", min: 40, max: 49, color: "#f59e0b" },
    { grade: "4", min: 50, max: 59, color: "#eab308" },
    { grade: "5", min: 60, max: 69, color: "#84cc16" },
    { grade: "6", min: 70, max: 77, color: "#22c55e" },
    { grade: "7", min: 78, max: 85, color: "#06b6d4" },
    { grade: "8", min: 86, max: 93, color: "#6366f1" },
    { grade: "9", min: 94, max: 100, color: "#a855f7" },
  ];
  var clampedPct = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 11,
          color: D ? "#9ca3af" : "#6b7280",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        Grade Boundaries (estimated)
      </div>
      <div
        style={{
          position: "relative",
          height: 28,
          borderRadius: 8,
          overflow: "hidden",
          display: "flex",
        }}
      >
        {boundaries.map(function (b) {
          var width = b.max - b.min + 1;
          return (
            <div
              key={b.grade}
              title={"Grade " + b.grade + ": " + b.min + "%-" + b.max + "%"}
              style={{
                flex: width,
                background: b.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>
                {b.grade}
              </span>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: clampedPct + "%",
            transform: "translateX(-50%)",
            width: 3,
            background: "#fff",
            borderRadius: 2,
            boxShadow: "0 0 0 2px #000",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 10,
          color: D ? "#9ca3af" : "#6b7280",
          marginTop: 4,
          textAlign: "left",
        }}
      >
        Your score: {pct}% — approx{" "}
        {boundaries.find(function (b) {
          return;
          clampedPct >= b.min && clampedPct <= b.max;
        })
          ? boundaries.find(function (b) {
              return;
              clampedPct >= b.min && clampedPct <= b.max;
            }).grade
          : "U"}
      </div>
    </div>
  );
}

export function MockExamScreen({
  D,
  subjects,
  allSections,
  boardSels,
  boardData,
  user,
  onBack,
  onMarkActivity,
}) {
  const [phase, setPhase] = useState("setup");
  const [selSubj, setSS] = useState(subjects[0]?.id || "");
  const [selBoard, setSB] = useState("AQA");
  const [selPaper, setSP] = useState(0);
  const [config, setConfig] = useState({});
  const [questions, setQuestions] = useState([]);
  const [extract, setExtract] = useState(null);
  const [extract2, setExtract2] = useState(null);
  const [showExtract, setShowExtract] = useState(false);
  const [showExtract2, setShowExtract2] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTL] = useState(0);
  const [qIdx, setQI] = useState(0);
  const [genErr, setGE] = useState("");
  const [results, setResults] = useState(null);
  const [tier, setTier] = useState("");
  const [paused, setPaused] = useState(false);
  const [pausesLeft, setPausesLeft] = useState(2);
  const [warn5shown, setWarn5shown] = useState(false);
  const [warn5modal, setWarn5modal] = useState(false);
  const [splitScreen, setSplitScreen] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [examHistory, setExamHistory] = useState([]);
  const timerRef = useRef(null);
  const doSubmitRef = useRef(null);

  const ansFileRef = useRef(null);
  const subj = subjects.find((s) => s.id === selSubj);
  const _allSpec = getMockSpec(selSubj, selBoard);

  const spec =
    ["maths", "bio", "chem", "phys"].includes(selSubj) && tier
      ? _allSpec.filter((p) => !p.tier || p.tier === tier)
      : _allSpec;
  const paper = spec[Math.min(selPaper, spec.length - 1)] || _allSpec[0];
  const fmtTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const pctTime =
    paper?.d > 0 ? Math.round((timeLeft / (paper.d * 60)) * 100) : 0;
  const timeCritical = timeLeft > 0 && timeLeft < 300;
  const bd2 = D ? "#2a3347" : "#e5e7eb";
  useEffect(() => {
    if (phase !== "exam") return;
    let isMounted = true;
    timerRef.current = setInterval(() => {
      if (!isMounted) return;
      if (paused) return;
      setTL(function (t) {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setTimeout(function () {
            if (isMounted && doSubmitRef.current) doSubmitRef.current();
          }, 50);
          return 0;
        }
        if (t === 301 && !warn5shown) {
          setWarn5shown(true);
          setWarn5modal(true);
        }
        return t - 1;
      });
    }, 1000);
    return function () {
      isMounted = false;
      clearInterval(timerRef.current);
    };
  }, [phase, paused, warn5shown]);

  useEffect(
    function () {
      if (phase !== "results") return;
      try {
        var histKey =
          "gcse:exam-hist:" +
          (user || "anon") +
          ":" +
          (selSubj || "") +
          "-" +
          (selBoard || "") +
          "-" +
          selPaper;
        window.storage
          .get(histKey)
          .then(function (r) {
            try {
              if (r && r.value) {
                var h = JSON.parse(r.value);
                if (Array.isArray(h)) setExamHistory(h);
              }
            } catch (e) {}
          })
          .catch(function () {});
      } catch (e) {}
    },
    [phase],
  );
  const prepare = async (cfg = config) => {
    setPhase("generating");
    setGE("");
    try {
      const bd3 = boardData[`${selSubj}:${selBoard}`] || {
        custom: [],
        extras: {},
        papers: [],
      };
      const merged = mergeTopics(subj?.topics || [], bd3.custom, bd3.extras);
      if (paper.paperType === "structured") {
        var result;
        for (var structAttempt = 0; structAttempt < 3; structAttempt++) {
          try {
            result = await generateStructuredPaper(
              subj && subj.name,
              selBoard,
              paper,
              cfg,
              merged,
            );
            if (result && result.questions && result.questions.length) break;
            if (structAttempt < 2)
              await new Promise(function (res) {
                setTimeout(res, 800 * (structAttempt + 1));
              });
          } catch (structErr) {
            if (structAttempt === 2) throw structErr;
            await new Promise(function (res) {
              setTimeout(res, 800 * (structAttempt + 1));
            });
          }
        }
        if (!result || !result.questions || !result.questions.length)
          throw new Error("No questionsgenerated.");
        setExtract(result.extract || null);
        setExtract2(result.extract2 || null);
        setQuestions(result.questions);
        setAnswers({});
        setQI(0);
        setTL(paper.d * 60);
        onMarkActivity?.();
        setPhase("exam");
        return;
      }
      if (paper.paperType === "parted") {
        var partedGroups;
        for (var pAttempt = 0; pAttempt < 3; pAttempt++) {
          try {
            partedGroups = await generatePartedPaper(
              subj && subj.name,
              selBoard,
              paper,
              merged,
            );
            if (partedGroups && partedGroups.length) break;
            if (pAttempt < 2)
              await new Promise(function (res) {
                setTimeout(res, 1000 * (pAttempt + 1));
              });
          } catch (pErr) {
            if (pAttempt === 2) throw pErr;
            await new Promise(function (res) {
              setTimeout(res, 1000 * (pAttempt + 1));
            });
          }
        }
        if (!partedGroups || !partedGroups.length)
          throw new Error("No question groups generated.");
        setExtract(null);
        setExtract2(null);
        setQuestions(partedGroups);
        setAnswers({});
        setQI(0);
        setTL(paper.d * 60);
        onMarkActivity?.();
        setPhase("exam");

        return;
      }

      const allQ = merged
        .flatMap((t) => t.sections.flatMap((s) => s.questions || []))
        .sort(() => Math.random() - 0.5);
      const mcqs = allQ.filter((q) => q.type === "mcq");
      const shorts = allQ.filter(
        (q) =>
          q.type === "short" || (q.type === "extended" && Number(q.marks) <= 4),
      );
      const exts = allQ.filter(
        (q) => q.type === "extended" && Number(q.marks) > 4,
      );
      const picked = [];
      const needed = [];
      const grab = (pool, count, type, marks) => {
        const take = pool.slice(0, count);
        picked.push(...take);
        const rem = count - take.length;
        if (rem > 0) needed.push({ count: rem, type, marks });
      };
      if ((paper.mcq || 0) > 0) grab(mcqs, paper.mcq, "mcq", 1);
      if ((paper.sh || 0) > 0) grab(shorts, paper.sh, "short", 3);
      if ((paper.ex || 0) > 0) grab(exts, paper.ex, "extended", 6);
      if ((paper.free || 0) > 0) {
        const fp = allQ.filter((q) => !picked.find((p) => p.id === q.id));
        picked.push(...fp.slice(0, paper.free));
        const rem = paper.free - fp.length;
        if (rem > 0)
          needed.push({ count: Math.min(rem, 10), type: "short", marks: 3 });
      }
      if (needed.length > 0) {
        try {
          const notesCtx = merged
            .flatMap((t) =>
              t.sections.flatMap((s) =>
                (s.notes || []).map((n) => n.heading + ":" + stripHtml(n.body)),
              ),
            )
            .slice(0, 15)
            .join("\n");
          const gen = await generateMockQuestions(
            subj?.name,
            selBoard,
            paper.n,
            needed,
            notesCtx,
            paper.markDist,
          );
          picked.push(...gen);
        } catch (genErr) {
          if (!picked.length)
            throw new Error(
              "AI question generation failed: " +
                genErr.message +
                ".Please check your internet connection and try again.",
            );
          console.warn(
            "AI fill-in failed, using bank questions only:",
            genErr.message,
          );
        }
      } else if (!picked.length) {
        try {
          const notesCtx = merged
            .flatMap((t) =>
              t.sections.flatMap((s) =>
                (s.notes || []).map((n) => n.heading + ":" + stripHtml(n.body)),
              ),
            )
            .slice(0, 15)
            .join("\n");

          const fallbackNeeded = [
            { count: 5, type: "mcq", marks: 1 },
            { count: 4, type: "short", marks: 3 },
            { count: 1, type: "extended", marks: 6 },
          ];
          const gen = await generateMockQuestions(
            subj?.name,
            selBoard,
            paper.n,
            fallbackNeeded,
            notesCtx,
            paper.markDist,
          );
          picked.push(...gen);
        } catch (genErr) {
          throw new Error(
            "No questions available and AI generation failed: " +
              genErr.message,
          );
        }
      }
      const final = picked.filter(Boolean).sort(() => Math.random() - 0.5);
      if (!final.length) {
        setGE(
          "No questions available for this paper yet. Add questions in thesubject's Flashcards & Questions section, or try a different paper.",
        );
        setPhase("setup");
        return;
      }
      setExtract(null);
      setExtract2(null);
      setQuestions(final);
      setAnswers({});
      setQI(0);
      setTL(paper.d * 60);
      onMarkActivity?.();
      setPhase("exam");
    } catch (e) {
      setGE("Error: " + e.message);
      setPhase("setup");
    }
  };

  const isParted = (q) =>
    q &&
    q.type === "structured" &&
    Array.isArray(q.parts) &&
    q.parts.length > 0;
  const setAns = (qId, patch) =>
    setAnswers((p) => ({ ...p, [qId]: { ...(p[qId] || {}), ...patch } }));

  const setPartAns = (gId, pi, patch) =>
    setAnswers((p) => {
      var cur = p[gId] || {};
      var parts = [...(cur.parts || [])];
      parts[pi] = { ...(parts[pi] || {}), ...patch };
      return { ...p, [gId]: { ...cur, parts } };
    });
  const getPartAns = (gId, pi) => (answers[gId]?.parts || [])[pi] || {};
  const answeredCount =
    questions.length > 0
      ? questions.filter(function (q) {
          var a = answers[q.id];
          if (isParted(q)) {
            return (a?.parts || []).some(function (pa) {
              return;
              pa && (pa.selOpt != null || pa.textAns?.trim() || pa.fileAns);
            });
          }
          return a?.selOpt != null || a?.textAns?.trim() || a?.fileAns;
        }).length
      : 0;
  const doSubmit = async () => {
    clearInterval(timerRef.current);
    setPhase("marking");
    trackEvent("mock_exam_submitted", {
      subjectId: selSubj,
      value: answeredCount,
    });

    var fa = { ...answers };

    var writtenQs = questions.filter(function (q) {
      return !isParted(q) && q.type !== "mcq";
    });
    for (var wi = 0; wi < writtenQs.length; wi++) {
      var wq = writtenQs[wi];
      var wa = fa[wq.id];
      var ansText = (wa?.textAns || "").trim();
      var hasFile = !!wa?.fileAns;
      if (ansText || hasFile) {
        try {
          var wr = await markAnswer(
            wq,
            ansText || "[student uploaded image — see markscheme]",
          );
          fa[wq.id] = { ...wa, result: wr };
        } catch (e) {
          fa[wq.id] = {
            ...(wa || {}),
            result: {
              score: 0,
              feedback:
                "AI marking unavailable — self-markusing the mark scheme.",
            },
          };
        }
      } else {
        fa[wq.id] = {
          ...(wa || {}),
          result: { score: 0, feedback: "Not attempted." },
        };
      }
    }

    var partedQs = questions.filter(isParted);
    for (var gi = 0; gi < partedQs.length; gi++) {
      var grp = partedQs[gi];
      var gAns = fa[grp.id] || {};
      var newParts = [...(gAns.parts || [])];
      for (var pi = 0; pi < grp.parts.length; pi++) {
        var part = grp.parts[pi];
        var pAns = newParts[pi] || {};
        if (part.type === "mcq") {
          newParts[pi] = { ...pAns };
        } else {
          var pText = (pAns.textAns || "").trim();
          var pFile = !!pAns.fileAns;
          if (pText || pFile) {
            try {
              var fakeQ = {
                id: part.id,
                text: part.text,
                marks: part.marks,
                markScheme: part.markScheme,
              };
              var pr = await markAnswer(
                fakeQ,
                pText || "[student uploaded image — see markscheme]",
              );
              newParts[pi] = { ...pAns, result: pr };
            } catch (e) {
              newParts[pi] = {
                ...pAns,
                result: {
                  score: 0,
                  feedback:
                    "AI marking unavailable —self-mark using mark scheme.",
                },
              };
            }
          } else {
            newParts[pi] = {
              ...pAns,
              result: { score: 0, feedback: "Not attempted." },
            };
          }
        }
      }
      fa[grp.id] = { ...gAns, parts: newParts };
    }
    var scored = 0,
      total = 0;
    for (var si = 0; si < questions.length; si++) {
      var sq = questions[si];
      var sa = fa[sq.id];
      if (isParted(sq)) {
        var sParts = sa?.parts || [];
        for (var spi = 0; spi < sq.parts.length; spi++) {
          var sp = sq.parts[spi];
          var spa = sParts[spi] || {};
          var m = Number(sp.marks) || 0;
          total += m;
          if (sp.type === "mcq" && spa.selOpt === sp.answer) scored += 1;
          else if (
            spa.result?.score != null &&
            !isNaN(Number(spa.result.score))
          )
            scored += Number(spa.result.score);
        }
      } else {
        var m2 = Number(sq.marks) || 0;
        total += m2;
        if (sq.type === "mcq" && sa?.selOpt === sq.answer) scored += 1;
        else if (sa?.result?.score != null && !isNaN(Number(sa.result.score)))
          scored += Number(sa.result.score);
      }
    }
    setAnswers(fa);
    var finalPct = total > 0 ? Math.round((scored / total) * 100) : 0;
    var finalGrade = pctToGrade(finalPct);
    var finalResults = {
      scored: scored,
      total: total,
      pct: finalPct,
      grade: finalGrade,
    };
    setResults(finalResults);
    try {
      var histKey =
        "gcse:exam-hist:" +
        (user || "anon") +
        ":" +
        (selSubj || "") +
        "-" +
        (selBoard || "") +
        "-" +
        selPaper;
      window.storage
        .get(histKey)
        .then(function (r) {
          var hist = [];
          try {
            if (r && r.value) hist = JSON.parse(r.value);
          } catch (e2) {}
          if (!Array.isArray(hist)) hist = [];
          hist.push({
            date: new Date().toLocaleDateString("en-GB"),
            scored: scored,
            total: total,
            pct: finalPct,
            grade: finalGrade,
            paperName: paper && paper.n,
          });
          if (hist.length > 5) hist = hist.slice(hist.length - 5);
          window.storage.set(histKey, JSON.stringify(hist));
          setExamHistory(hist);
        })
        .catch(function () {});
    } catch (histErr) {}
    setPhase("results");
  };

  doSubmitRef.current = doSubmit;

  if (phase === "setup")
    return (
      <div
        style={{ minHeight: "100vh", background: D ? "#0f1117" : "#f9fafb" }}
        className="fade-in"
      >
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
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
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 4,
              color: tx(D),
            }}
          >
            Mock Exam
          </h2>
          <p style={{ fontSize: 13, color: mu(D), marginBottom: 24 }}>
            Board-specific timed mock exams using your question bank + ReviseIQ
            AI
          </p>
          <div style={{ ...C(D), padding: 24, marginBottom: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 16,
              }}
            >
              <div>
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
                  Subject
                </label>
                <select
                  style={I(D)}
                  value={selSubj}
                  onChange={(e) => {
                    setSS(e.target.value);
                    setSP(0);
                    setConfig({});
                    setTier("");
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
                  Exam Board
                </label>
                <select
                  style={I(D)}
                  value={selBoard}
                  onChange={(e) => {
                    setSB(e.target.value);
                    setSP(0);
                    setConfig({});
                  }}
                >
                  {["AQA", "Edexcel", "OCR", "Eduqas", "WJEC"].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {["maths", "bio", "chem", "phys"].includes(selSubj) && (
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Tier
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    ["H", "Higher Tier", "Grade 4–9 • Full content"],
                    ["F", "Foundation Tier", "Grade 1–5 •Core content"],
                  ].map(([t, label, sub]) => (
                    <button
                      key={t}
                      onClick={() => setTier(t)}
                      style={{
                        padding: "12px16px",
                        borderRadius: 10,
                        border: `1.5px solid
${tier === t ? "#6366f1" : bd2}`,
                        background:
                          tier === t
                            ? D
                              ? "rgba(99,102,241,.1)"
                              : "#eef2ff"
                            : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: tier === t ? "#6366f1" : tx(D),
                        }}
                      >
                        {label}
                      </div>

                      <div style={{ fontSize: 11, color: mu(D), marginTop: 2 }}>
                        {sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: mu(D),
                  display: "block",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Select Paper
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {spec.map((p, i) => {
                  const isCS = p.paperType === "comingSoon";
                  return (
                    <div
                      key={i}
                      onClick={() => !isCS && setSP(i)}
                      style={{
                        ...C(D),
                        padding: "14px 16px",
                        cursor: isCS ? "default" : "pointer",
                        borderColor: selPaper === i && !isCS ? "#6366f1" : bd2,
                        borderWidth: selPaper === i && !isCS ? 2 : 1,
                        background:
                          selPaper === i && !isCS
                            ? D
                              ? "rgba(99,102,241,.1)"
                              : "#eef2ff"
                            : "transparent",
                        opacity: isCS ? 0.55 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color:
                                selPaper === i && !isCS ? "#6366f1" : tx(D),
                            }}
                          >
                            {p.n}
                          </span>
                          {isCS && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: D ? "#374151" : "#f3f4f6",
                                color: mu(D),
                                padding: "2px 7px",
                                borderRadius: 10,
                              }}
                            >
                              Coming Soon
                            </span>
                          )}
                        </div>
                        {!isCS && (
                          <div
                            style={{ display: "flex", gap: 8, flexShrink: 0 }}
                          >
                            <span style={{ fontSize: 11, color: mu(D) }}>
                              {p.d} min
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: subj?.accent || "#6366f1",
                              }}
                            >
                              {p.m}
                              marks
                            </span>
                          </div>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: mu(D),
                          marginBottom: p.skills?.length ? 6 : 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {p.desc}
                      </p>
                      {p.skills?.length > 0 && !isCS && (
                        <div
                          style={{ display: "flex", gap: 5, flexWrap: "wrap" }}
                        >
                          {p.skills.map((s, si) => (
                            <span
                              key={si}
                              style={{
                                fontSize: 10,
                                color: D ? "#c7d2fe" : "#1e40af",
                                background: D
                                  ? "rgba(99,102,241,.15)"
                                  : "#eef2ff",
                                padding: "2px 7px",
                                borderRadius: 10,
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {genErr && (
              <div
                style={{
                  padding: "10px14px",
                  borderRadius: 8,
                  background: "#fee2e2",
                  border: "1px solid#ef4444",
                  fontSize: 12,
                  color: "#b91c1c",
                  marginBottom: 12,
                }}
              >
                {genErr}
              </div>
            )}
            {paper.paperType === "comingSoon" ? (
              <div
                style={{
                  padding: "14px16px",
                  borderRadius: 10,
                  background: D ? "#1e2537" : "#f3f4f6",
                  textAlign: "center",
                  fontSize: 13,
                  color: mu(D),
                }}
              >
                This paper is coming soon to ReviseIQ
              </div>
            ) : ["maths", "bio", "chem", "phys"].includes(selSubj) && !tier ? (
              <div
                style={{
                  padding: "12px14px",
                  borderRadius: 10,
                  background: D ? "#1e2537" : "#f3f4f6",
                  textAlign: "center",
                  fontSize: 13,
                  color: mu(D),
                }}
              >
                {" "}
                Please select a tier above to continue
              </div>
            ) : (
              <button
                onClick={() => {
                  const cfg = { tier };
                  if (paper.configFields?.length) {
                    paper.configFields.forEach((f) => {
                      cfg[f.id] = f.options[0];
                    });
                    setConfig(cfg);
                    setPhase("configure");
                  } else {
                    prepare(cfg);
                  }
                }}
                style={{
                  ...B("#6366f1", false, {
                    width: "100%",
                    padding: "13px0",
                    fontSize: 14,
                    fontWeight: 700,
                  }),
                }}
              >
                Start {paper.n} (
                {tier === "H" ? "Higher" : tier === "F" ? "Foundation" : ""})
              </button>
            )}
            <p
              style={{
                fontSize: 11,
                color: mu(D),
                textAlign: "center",
                marginTop: 8,
              }}
            >
              AI will generate extra questions if needed to fill the paper
            </p>
          </div>
        </div>
      </div>
    );

  if (phase === "configure")
    return (
      <div
        style={{ minHeight: "100vh", background: D ? "#0f1117" : "#f9fafb" }}
        className="fade-in"
      >
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px" }}>
          <button
            onClick={() => setPhase("setup")}
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
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 4,
              color: tx(D),
            }}
          >
            Configure Paper
          </h2>
          <p style={{ fontSize: 13, color: mu(D), marginBottom: 20 }}>
            {paper.n}
          </p>
          <div style={{ ...C(D), padding: 24 }}>
            {paper.configFields.map((field) => (
              <div key={field.id} style={{ marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {field.label}
                </label>
                {field.note && (
                  <p
                    style={{
                      fontSize: 11,
                      color: mu(D),
                      marginBottom: 6,
                      fontStyle: "italic",
                    }}
                  >
                    {field.note}
                  </p>
                )}
                {field.type === "select" && (
                  <select
                    style={I(D)}
                    value={config[field.id] || field.options[0]}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, [field.id]: e.target.value }))
                    }
                  >
                    {field.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            <button
              onClick={() => prepare(config)}
              style={{
                ...B("#6366f1", false, {
                  width: "100%",
                  padding: "13px0",
                  fontSize: 14,
                  fontWeight: 700,
                  marginTop: 8,
                }),
              }}
            >
              Generate Paper
            </button>
          </div>
        </div>
      </div>
    );

  if (phase === "generating")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: D ? "#0f1117" : "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}> </div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
              color: tx(D),
            }}
          >
            Generating your mock exam…
          </h3>
          <p style={{ fontSize: 13, color: mu(D) }}>
            ReviseIQ AI is building {paper.n}. This may take up to 30 seconds.
          </p>
        </div>
      </div>
    );

  if (phase === "marking")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: D ? "#0f1117" : "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}> </div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
              color: tx(D),
            }}
          >
            Marking your answers…
          </h3>
          <p style={{ fontSize: 13, color: mu(D) }}>
            ReviseIQ AI is evaluating your written responses
          </p>
        </div>
      </div>
    );

  var downloadResults = function () {
    var lines = [];
    lines.push("ReviseIQ Mock Exam Results");
    lines.push(
      "Subject: " + (subj && subj.name) + " (" + selBoard + ") — " + paper.n,
    );
    lines.push("Date: " + new Date().toLocaleDateString("en-GB"));
    lines.push(
      "Score: " +
        results.scored +
        "/" +
        results.total +
        " (" +
        results.pct +
        "%) — Grade" +
        results.grade,
    );
    lines.push("", "=".repeat(50), "");
    questions.forEach(function (q, qi) {
      var a = answers[q.id];
      var sc =
        q.type === "mcq"
          ? a && a.selOpt === q.answer
            ? 1
            : 0
          : a && a.result && a.result.score;
      lines.push(
        "Q" +
          (qi + 1) +
          " (" +
          q.marks +
          " marks) — Score: " +
          (sc != null ? sc : "?") +
          "/" +
          q.marks,
      );
      lines.push("Question: " + q.text);
      if (q.type === "mcq") {
        lines.push(
          "Your answer: " +
            (a && a.selOpt != null ? q.options[a.selOpt] : "(notanswered)"),
        );
        lines.push("Correct: " + q.options[q.answer]);
      } else {
        lines.push("Your answer: " + ((a && a.textAns) || "(not answered)"));
      }
      if (a && a.result && a.result.feedback)
        lines.push("Feedback: " + a.result.feedback);
      if (q.markScheme) lines.push("Mark Scheme: " + q.markScheme);
      lines.push("");
    });
    var blob = new Blob([lines.join("\n")], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download =
      "ReviseIQ_" + selBoard + "_" + paper.n.replace(/\s/g, "_") + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  if (phase === "results" && results)
    return (
      <div
        style={{ minHeight: "100vh", background: D ? "#0f1117" : "#f9fafb" }}
        className="fade-in"
      >
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 20,
              color: tx(D),
            }}
          >
            Results
          </h2>
          <div
            style={{
              ...C(D),
              padding: 28,
              textAlign: "center",
              marginBottom: 16,
              border: "2px solid" + gradeColor(results.grade),
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: gradeColor(results.grade),
                marginBottom: 4,
                lineHeight: 1,
              }}
            >
              {results.grade}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 6,
                color: tx(D),
              }}
            >
              {results.scored}/{results.total}
              marks ({results.pct}%)
            </div>
            <div style={{ fontSize: 13, color: mu(D) }}>
              {subj && subj.icon} {subj && subj.name} · {selBoard}· {paper.n}
            </div>
          </div>
          <GradeBoundaryBar pct={results.pct} D={D} />
          {}
          {examHistory.length > 1 && (
            <div style={{ ...C(D), padding: 16, marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: tx(D),
                  marginBottom: 10,
                }}
              >
                Your Progress ({examHistory.length} attempts)
              </div>
              {examHistory.map(function (h, hi) {
                return (
                  <div
                    key={hi}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: mu(D),
                        width: 60,
                        flexShrink: 0,
                      }}
                    >
                      {h.date}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 14,
                        borderRadius: 4,
                        background: D ? "#2a3347" : "#e5e7eb",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: h.pct + "%",
                          background: gradeColor(h.grade),
                          borderRadius: 4,
                          transition: "width .4s",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: gradeColor(h.grade),
                        width: 32,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {h.grade}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: mu(D),
                        width: 36,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {h.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={function () {
                setReviewMode(function (p) {
                  return !p;
                });
              }}
              style={{
                ...B(reviewMode ? "#6366f1" : "transparent", !reviewMode, {
                  fontSize: 12,
                  padding: "8px14px",
                  borderColor: reviewMode ? "#6366f1" : bd2,
                  color: reviewMode ? "#fff" : mu(D),
                }),
              }}
            >
              {reviewMode ? "Close Review" : "Review Answers"}
            </button>
            <button
              onClick={downloadResults}
              style={{
                ...B("transparent", true, {
                  fontSize: 12,
                  padding: "8px14px",
                  borderColor: bd2,
                  color: mu(D),
                }),
              }}
            >
              Download Results
            </button>
          </div>
          {}
          {reviewMode && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {questions.map(function (q, qi) {
                var a = answers[q.id];
                if (isParted(q)) {
                  var sParts = a?.parts || [];
                  var totalQ = 0,
                    scoredQ = 0;
                  (q.parts || []).forEach(function (pt, pi) {
                    var pa = sParts[pi] || {};
                    totalQ += Number(pt.marks || 0);
                    if (pt.type === "mcq" && pa.selOpt === pt.answer)
                      scoredQ += 1;
                    else if (
                      pa.result?.score != null &&
                      !isNaN(Number(pa.result.score))
                    )
                      scoredQ += Number(pa.result.score);
                  });
                  var qScCol =
                    scoredQ === 0
                      ? "#ef4444"
                      : scoredQ >= totalQ * 0.7
                        ? "#16a34a"
                        : "#d97706";
                  return (
                    <div key={q.id} style={{ ...C(D), padding: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "#6366f1",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {q.number}
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: tx(D),
                            }}
                          >
                            Question {q.number} — Structured ({q.totalMarks}{" "}
                            marks)
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: qScCol,
                          }}
                        >
                          {scoredQ}/{totalQ}
                        </span>
                      </div>

                      {q.context && q.context.trim() && (
                        <div
                          style={{
                            padding: "10px12px",
                            borderRadius: 8,
                            background: D ? "#1e2537" : "#fffbeb",
                            fontSize: 12,
                            color: tx(D),
                            lineHeight: 1.7,
                            marginBottom: 10,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {q.context}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {(q.parts || []).map(function (part, pi) {
                          var pAns = sParts[pi] || {};
                          var pSc =
                            part.type === "mcq"
                              ? pAns.selOpt === part.answer
                                ? 1
                                : 0
                              : (pAns.result?.score ?? null);
                          var pCol =
                            pSc == null
                              ? "#9ca3af"
                              : pSc === 0
                                ? "#ef4444"
                                : Number(pSc) >= Number(part.marks) * 0.7
                                  ? "#16a34a"
                                  : "#d97706";
                          return (
                            <div
                              key={pi}
                              style={{
                                padding: "12px14px",
                                borderRadius: 8,
                                background: D
                                  ? "rgba(99,102,241,.06)"
                                  : "#f8f9ff",
                                borderLeft: "2px solid#6366f1",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: 8,
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: "#6366f1",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {part.label}{" "}
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 400,
                                      color: mu(D),
                                      fontFamily: "sans-serif",
                                    }}
                                  >
                                    ({part.marks}
                                    marks)
                                  </span>
                                </span>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: pCol,
                                  }}
                                >
                                  {pSc != null
                                    ? pSc + "/" + part.marks
                                    : "—/" + part.marks}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: tx(D),
                                  marginBottom: 8,
                                  lineHeight: 1.6,
                                }}
                              >
                                {parseQuestionText(part.text, D, 12)}
                              </div>
                              {part.type === "mcq" ? (
                                <div
                                  style={{
                                    padding: "7px10px",
                                    borderRadius: 7,
                                    background:
                                      pAns.selOpt === part.answer
                                        ? "#dcfce7"
                                        : "#fee2e2",
                                    fontSize: 11,
                                    color:
                                      pAns.selOpt === part.answer
                                        ? "#15803d"
                                        : "#b91c1c",
                                  }}
                                >
                                  {pAns.selOpt === part.answer
                                    ? "✓ Correct"
                                    : "✗ Incorrect"}{" "}
                                  — correct:
                                  {part.options && part.options[part.answer]}
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 10,
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: mu(D),
                                        marginBottom: 3,
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      Yo ur Answer
                                    </div>
                                    <div
                                      style={{
                                        padding: "8px10px",
                                        borderRadius: 7,
                                        background: D ? "#1e2537" : "#f3f4f6",
                                        fontSize: 11,
                                        color: tx(D),
                                        lineHeight: 1.6,
                                        whiteSpace: "pre-line",
                                        minHeight: 40,
                                      }}
                                    >
                                      {pAns.textAns || "Not attempted"}
                                    </div>

                                    {pAns.result?.feedback && (
                                      <div
                                        style={{
                                          marginTop: 5,
                                          padding: "6px9px",
                                          borderRadius: 7,
                                          background: D
                                            ? "rgba(99,102,241,.1)"
                                            : "#eef2ff",
                                          fontSize: 10,
                                          color: tx(D),
                                          lineHeight: 1.5,
                                        }}
                                      >
                                        {pAns.result.feedback}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: mu(D),
                                        marginBottom: 3,
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      Ma rk Scheme
                                    </div>
                                    <div
                                      style={{
                                        padding: "8px10px",
                                        borderRadius: 7,
                                        background: D
                                          ? "rgba(16,185,129,.08)"
                                          : "#f0fdf4",
                                        border:
                                          "1px solid" +
                                          (D ? "#065f46" : "#86efac"),
                                        fontSize: 10,
                                        color: tx(D),
                                        lineHeight: 1.7,
                                        whiteSpace: "pre-line",
                                        minHeight: 40,
                                      }}
                                    >
                                      {part.markScheme || "See teacher"}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                var isCorr =
                  q.type === "mcq" ? a && a.selOpt === q.answer : null;
                var sc =
                  q.type === "mcq"
                    ? isCorr
                      ? 1
                      : 0
                    : a && a.result && a.result.score;
                var scCol =
                  sc == null || isNaN(sc)
                    ? "#9ca3af"
                    : sc === 0
                      ? "#ef4444"
                      : Number(sc) >= Number(q.marks) * 0.7
                        ? "#16a34a"
                        : "#d97706";
                return (
                  <div key={q.id} style={{ ...C(D), padding: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{ fontSize: 12, fontWeight: 700, color: tx(D) }}
                      >
                        Q{qi + 1} —
                        {q.type === "mcq"
                          ? "MCQ"
                          : q.type === "short"
                            ? "Short"
                            : "Extended"}{" "}
                        ({q.marks} marks)
                      </span>
                      <span
                        style={{ fontSize: 14, fontWeight: 800, color: scCol }}
                      >
                        {sc != null && !isNaN(Number(sc))
                          ? sc + "/" + q.marks
                          : "—/" + q.marks}
                      </span>
                    </div>
                    <div style={{ marginBottom: 10, fontSize: 13 }}>
                      {parseQuestionText(q.text, D, 13)}
                    </div>
                    {q.type === "mcq" ? (
                      <div
                        style={{
                          padding: "8px12px",
                          borderRadius: 8,
                          background: isCorr ? "#dcfce7" : "#fee2e2",
                          fontSize: 12,
                          color: isCorr ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {isCorr ? "Correct" : "Incorrect"} — correct:{" "}
                        {q.options && q.options[q.answer]}
                        {q.explanation && (
                          <div
                            style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}
                          >
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: mu(D),
                              marginBottom: 4,
                              textTransform: "uppercase",
                            }}
                          >
                            Y our Answer
                          </div>
                          <div
                            style={{
                              padding: "10px12px",
                              borderRadius: 8,
                              background: D ? "#1e2537" : "#f3f4f6",
                              fontSize: 12,
                              color: tx(D),
                              lineHeight: 1.65,
                              whiteSpace: "pre-line",
                              minHeight: 60,
                            }}
                          >
                            {(a && a.textAns) || "Not attempted"}
                          </div>
                          {a && a.result && a.result.feedback && (
                            <div
                              style={{
                                marginTop: 6,
                                padding: "8px10px",
                                borderRadius: 8,
                                background: D
                                  ? "rgba(99,102,241,.1)"
                                  : "#eef2ff",
                                fontSize: 11,
                                color: tx(D),
                                lineHeight: 1.6,
                              }}
                            >
                              {a.result.feedback}
                            </div>
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: mu(D),
                              marginBottom: 4,
                              textTransform: "uppercase",
                            }}
                          >
                            M ark Scheme
                          </div>
                          <div
                            style={{
                              padding: "10px12px",
                              borderRadius: 8,
                              background: D
                                ? "rgba(16,185,129,.08)"
                                : "#f0fdf4",
                              border: "1px solid" + (D ? "#065f46" : "#86efac"),
                              fontSize: 11,
                              color: tx(D),
                              lineHeight: 1.75,
                              whiteSpace: "pre-line",
                              minHeight: 60,
                            }}
                          >
                            {q.markScheme || q.sampleAnswer || "See teacher"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {}
          {!reviewMode && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {questions.map(function (q, qi) {
                var a = answers[q.id];
                if (isParted(q)) {
                  var sParts = a?.parts || [];
                  var totalQ = 0,
                    scoredQ = 0;
                  (q.parts || []).forEach(function (pt, pi) {
                    var pa = sParts[pi] || {};
                    totalQ += Number(pt.marks || 0);
                    if (pt.type === "mcq" && pa.selOpt === pt.answer) sco;

                    if (
                      pa.result?.score != null &&
                      !isNaN(Number(pa.result.score))
                    )
                      scoredQ += Number(pa.result.score);
                  });
                  var qScCol =
                    scoredQ === 0
                      ? "#ef4444"
                      : scoredQ >= totalQ * 0.7
                        ? "#16a34a"
                        : "#d97706";
                  var attempted = (a?.parts || []).some(function (pa) {
                    return;
                    pa && (pa.selOpt != null || pa.textAns?.trim());
                  });
                  return (
                    <div key={q.id} style={{ ...C(D), padding: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 12, color: mu(D) }}>
                          Q{q.number} · Structured · {q.totalMarks}
                          marks
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: qScCol,
                          }}
                        >
                          {scoredQ}/{totalQ}
                        </span>
                      </div>
                      {!attempted && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginTop: 3,
                          }}
                        >
                          Not attempted
                        </div>
                      )}
                    </div>
                  );
                }
                var isCorr =
                  q.type === "mcq" ? a && a.selOpt === q.answer : null;
                var sc =
                  q.type === "mcq"
                    ? isCorr
                      ? 1
                      : 0
                    : a && a.result && a.result.score;
                var scCol =
                  sc == null || isNaN(sc)
                    ? "#9ca3af"
                    : sc === 0
                      ? "#ef4444"
                      : Number(sc) >= Number(q.marks) * 0.7
                        ? "#16a34a"
                        : "#d97706";
                return (
                  <div key={q.id} style={{ ...C(D), padding: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 12, color: mu(D) }}>
                        Q{qi + 1} ·
                        {q.type === "mcq"
                          ? "MCQ"
                          : q.type === "short"
                            ? "Short"
                            : "Extended"}
                      </span>
                      <span
                        style={{ fontSize: 13, fontWeight: 800, color: scCol }}
                      >
                        {sc != null && !isNaN(Number(sc))
                          ? sc + "/" + q.marks
                          : "—/" + q.marks}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: tx(D),
                        marginTop: 4,
                        marginBottom: 4,
                      }}
                    >
                      {parseQuestionText(q.text, D, 12)}
                    </div>
                    {q.type === "mcq" && a && a.selOpt != null && (
                      <div
                        style={{
                          fontSize: 11,
                          color: isCorr ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {isCorr
                          ? "✓Correct"
                          : "✗ Incorrect — correct: " +
                            (q.options && q.options[q.answer])}
                      </div>
                    )}

                    {q.type !== "mcq" && a && a.result && a.result.feedback && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: "6px10px",
                          borderRadius: 6,
                          background: D ? "#1e2537" : "#f3f4f6",
                          fontSize: 11,
                          color: tx(D),
                          lineHeight: 1.6,
                        }}
                      >
                        {a.result.feedback}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={function () {
                setPhase("setup");
                setQuestions([]);
                setAnswers({});
                setResults(null);
                setExtrac;
                t(null);
                setExtract2(null);
                setExamHistory([]);
                setReviewMode(false);
                setPaused(false);
                setPausesLe;
                ft(2);
                setWarn5shown(false);
                setWarn5modal(false);
                setSplitScreen(false);
              }}
              style={{
                flex: 1,
                ...B("#6366f1", false, { padding: "12px 0", fontSize: 14 }),
              }}
            >
              Try Another Paper
            </button>
            <button
              onClick={onBack}
              style={{
                flex: 1,
                ...B("transparent", true, {
                  padding: "12px0",
                  fontSize: 14,
                  borderColor: bd2,
                  color: mu(D),
                }),
              }}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );

  const q = questions[qIdx];
  if (!q) return null;
  const curAns = answers[q.id] || {};
  const hasExtract = (extract || extract2) && paper.paperType === "structured";
  const qIsParted = isParted(q);
  return (
    <div
      style={{
        minHeight: "100vh",
        background: D ? "#0f1117" : "#f9fafb",
        color: tx(D),
      }}
      className="fade-in"
    >
      {}
      {warn5modal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
            background: "rgba(0,0,0,.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              ...C(D),
              padding: 28,
              maxWidth: 320,
              textAlign: "center",
              border: "2px solid#f59e0b",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}> </div>

            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: tx(D),
                marginBottom: 8,
              }}
            >
              5 minutes remaining!
            </h3>
            <p style={{ fontSize: 13, color: mu(D), marginBottom: 16 }}>
              Check your answers and make sure you have attempted all questions.
            </p>
            <button
              onClick={function () {
                setWarn5modal(false);
              }}
              style={{
                ...B("#f59e0b", false, {
                  width: "100%",
                  padding: "10px0",
                  fontSize: 14,
                  fontWeight: 700,
                }),
              }}
            >
              Keep Going
            </button>
          </div>
        </div>
      )}
      {}
      {paused && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            background: "rgba(0,0,0,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}> </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Timer Paused
            </h3>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>
              Pauses remaining:
              {pausesLeft}
            </p>
            <button
              onClick={function () {
                setPaused(false);
              }}
              style={{
                ...B("#6366f1", false, {
                  fontSize: 14,
                  padding: "10px28px",
                  fontWeight: 700,
                }),
              }}
            >
              Resume
            </button>
          </div>
        </div>
      )}
      {}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: D ? "#0d1117" : "#fff",
          borderBottom: "1px solid" + bd2,
          padding: "8px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: mu(D),
                marginBottom: 3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subj && subj.icon} {subj && subj.name} · {paper.n}
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 4,
                background: D ? "#2a3347" : "#e5e7eb",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 4,
                  background: timeCritical ? "#ef4444" : "#6366f1",
                  width: pctTime + "%",
                  transition: "width 1s linear",
                }}
              />
            </div>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "monospace",
                color: timeCritical ? "#ef4444" : "#6366f1",
              }}
            >
              {fmtTime(timeLeft)}
            </div>
            <div style={{ fontSize: 9, color: mu(D) }}>remaining</div>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tx(D) }}>
              {answeredCount}/{questions.length}
            </div>
            <div style={{ fontSize: 9, color: mu(D) }}>answered</div>
          </div>
          {pausesLeft > 0 && !paused && (
            <button
              onClick={function () {
                if (pausesLeft > 0) {
                  setPaused(true);
                  setPausesLeft(function (p) {
                    return p - 1;
                  });
                }
              }}
              style={{
                ...B("transparent", true, {
                  fontSize: 11,
                  padding: "5px10px",
                  flexShrink: 0,
                  borderColor: bd2,
                  color: mu(D),
                }),
              }}
            >
              Pause
            </button>
          )}
          {hasExtract && !splitScreen && (
            <button
              onClick={function () {
                setShowExtract(function (p) {
                  return !p;
                });
              }}
              style={{
                ...B(showExtract ? "#6366f1" : "transparent", !showExtract, {
                  fontSize: 11,
                  padding: "5px10px",
                  flexShrink: 0,
                  borderColor: showExtract ? "#6366f1" : bd2,
                  color: showExtract ? "#fff" : mu(D),
                }),
              }}
            >
              {showExtract ? "Hide" : "Extract"}
            </button>
          )}
          {hasExtract && extract && (
            <button
              onClick={function () {
                setSplitScreen(function (p) {
                  return;
                  !p;
                });
              }}
              style={{
                ...B(splitScreen ? "#6366f1" : "transparent", !splitScreen, {
                  fontSize: 11,
                  padding: "5px10px",
                  flexShrink: 0,
                  borderColor: splitScreen ? "#6366f1" : bd2,
                  color: splitScreen ? "#fff" : mu(D),
                }),
              }}
            >
              {splitScreen ? "Single" : "Split"}
            </button>
          )}
          {extract2 && (
            <button
              onClick={function () {
                setShowExtract2(function (p) {
                  return !p;
                });
              }}
              style={{
                ...B(showExtract2 ? "#ec4899" : "transparent", !showExtract2, {
                  fontSize: 11,
                  padding: "5px10px",
                  flexShrink: 0,
                  borderColor: showExtract2 ? "#ec4899" : bd2,
                  color: showExtract2 ? "#fff" : mu(D),
                }),
              }}
            >
              {showExtract2 ? "Hide" : "Extract 2"}
            </button>
          )}
          <button
            onClick={doSubmit}
            style={{
              ...B("#ef4444", true, {
                fontSize: 11,
                padding: "5px10px",
                flexShrink: 0,
              }),
            }}
          >
            Submit
          </button>
        </div>
      </div>
      {}
      {showExtract && extract && (
        <div
          style={{
            background: D ? "#1e2537" : "#fffbeb",
            borderBottom: `1px solid
${D ? "#374151" : "#fde68a"}`,
            padding: "14px 20px",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: D ? "#fcd34d" : "#92400e",
                  }}
                >
                  {extract.title}
                </span>
                {extract.source && (
                  <span style={{ fontSize: 11, color: mu(D), marginLeft: 8 }}>
                    {extract.source}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowExtract(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: mu(D),
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
            {paper && paper.paperPrompt === "history-p2-elizabethan" ? (
              <HistoryInterpBlock
                text={extract.text}
                title={extract.title}
                D={D}
              />
            ) : (
              <NumberedExtract text={extract.text} D={D} />
            )}
          </div>
        </div>
      )}
      {showExtract2 && extract2 && (
        <div
          style={{
            background: D ? "#1e2537" : "#fdf2f8",
            borderBottom: `1px solid
${D ? "#374151" : "#fbcfe8"}`,
            padding: "14px 20px",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#ec4899" }}
                >
                  {extract2.title}
                </span>
                {extract2.source && (
                  <span style={{ fontSize: 11, color: mu(D), marginLeft: 8 }}>
                    {extract2.source}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowExtract2(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: mu(D),
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
            <NumberedExtract text={extract2.text} D={D} />
          </div>
        </div>
      )}
      <div
        style={{
          display: splitScreen ? "flex" : "block",
          maxWidth: splitScreen ? "100%" : 760,
          margin: "0auto",
          padding: splitScreen ? 0 : "18px 24px",
          gap: 0,
        }}
      >
        {}
        {splitScreen && extract && (
          <div
            style={{
              width: "42%",
              flexShrink: 0,
              borderRight: "1px solid" + bd2,
              overflowY: "auto",
              maxHeight: "calc(100vh - 80px)",
              position: "sticky",
              top: 80,
              padding: "18px20px",
              background: D ? "#0d1117" : "#fffbeb",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: D ? "#fcd34d" : "#92400e",
                marginBottom: 10,
              }}
            >
              {extract.title}
              {extract.source ? " — " + extract.source : ""}
            </div>
            {paper && paper.paperPrompt === "history-p2-elizabethan" ? (
              <HistoryInterpBlock
                text={extract.text}
                title={extract.title}
                D={D}
              />
            ) : (
              <NumberedExtract text={extract.text} D={D} />
            )}
          </div>
        )}
        <div style={{ flex: 1, padding: "18px 24px", minWidth: 0 }}>
          {}
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {questions.map((qq, i) => {
              const a = answers[qq.id];
              var done;
              if (isParted(qq)) {
                done = (a?.parts || []).some(function (pa) {
                  return;
                  pa && (pa.selOpt != null || pa.textAns?.trim() || pa.fileAns);
                });
              } else {
                done = a?.selOpt != null || a?.textAns?.trim() || a?.fileAns;
              }
              const qMarks = isParted(qq) ? qq.totalMarks : qq.marks;
              return (
                <div
                  key={qq.id}
                  onClick={() => setQI(i)}
                  title={`Q${i + 1} (${qMarks}mk)`}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    cursor: "pointer",
                    transition: "background.15s",
                    flexShrink: 0,
                    background:
                      i === qIdx
                        ? "#6366f1"
                        : done
                          ? "#16a34a"
                          : D
                            ? "#374151"
                            : "#d1d5db",
                  }}
                />
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 13, color: mu(D) }}>
              Question {qIdx + 1} of {questions.length}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {q.section && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#6366f1",
                    background: D ? "rgba(99,102,241,.15)" : "#eef2ff",
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}
                >
                  {q.section}
                </span>
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px10px",
                  borderRadius: 20,
                  background: (subj && subj.mid) || "#e0e7ff",
                  color: (subj && subj.dk) || "#312e81",
                }}
              >
                {qIsParted ? q.totalMarks : q.marks}
                mark{(qIsParted ? q.totalMarks : q.marks) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {(() => {
            var totalMarks = questions.reduce(function (s, qq) {
              return;
              s +
                (isParted(qq)
                  ? Number(qq.totalMarks || 0)
                  : Number(qq.marks || 0));
            }, 0);
            var qMk = qIsParted
              ? Number(q.totalMarks || 0)
              : Number(q.marks || 0);
            var recSecs =
              totalMarks > 0
                ? Math.round(((paper.d * 60) / totalMarks) * qMk)
                : 0;
            var recMins = Math.floor(recSecs / 60);
            var recSec = recSecs % 60;
            return totalMarks > 0 ? (
              <div style={{ fontSize: 10, color: mu(D), marginBottom: 10 }}>
                Suggested time: ~{recMins > 0 ? recMins + "m" : ""}
                {recSec > 0 ? recSec + "s" : ""}
              </div>
            ) : null;
          })()}
          {}
          {qIsParted ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#6366f1",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {q.number}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx(D) }}>
                  {q.year === "AI Generated" && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: mu(D),
                        marginRight: 6,
                      }}
                    >
                      AI Generated
                    </span>
                  )}
                  {q.totalMarks} marks total
                </div>
              </div>
              {}
              {q.context && q.context.trim() && (
                <div
                  style={{
                    padding: "14px16px",
                    borderRadius: 10,
                    background: D ? "#1e2537" : "#fffbeb",
                    border: `1px solid
${D ? "#374151" : "#fde68a"}`,
                    fontSize: 13,
                    color: tx(D),
                    lineHeight: 1.75,
                    whiteSpace: "pre-line",
                  }}
                >
                  {parseQuestionText(q.context, D, 13)}
                </div>
              )}
              {}
              {(q.parts || []).map(function (part, pi) {
                var pAns = getPartAns(q.id, pi);
                return (
                  <div
                    key={part.id || pi}
                    style={{
                      ...C(D),
                      padding: 20,
                      borderLeft: "3px solid #6366f1",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 15,
                            color: "#6366f1",
                            fontFamily: "monospace",
                            minWidth: 28,
                          }}
                        >
                          {part.label}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: mu(D),
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {part.type === "mcq"
                            ? "Multiple Choice"
                            : part.type === "extended"
                              ? "ExtendedResponse"
                              : "Short Answer"}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px9px",
                          borderRadius: 20,
                          background: (subj && subj.mid) || "#e0e7ff",
                          color: (subj && subj.dk) || "#312e81",
                          flexShrink: 0,
                        }}
                      >
                        {part.marks} mark{part.marks !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: tx(D),
                        marginBottom: 12,
                        lineHeight: 1.7,
                      }}
                    >
                      {parseQuestionText(part.text, D, 13)}
                    </div>
                    {part.type === "mcq" ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 7,
                        }}
                      >
                        {(part.options || []).map(function (opt, oi) {
                          var sel = pAns.selOpt === oi;
                          return (
                            <button
                              key={oi}
                              onClick={function () {
                                setPartAns(q.id, pi, { selOpt: oi });
                              }}
                              style={{
                                textAlign: "left",
                                padding: "9px 13px",
                                borderRadius: 9,
                                border: `1.5px solid
${sel ? "#6366f1" : bd2}`,
                                background: sel
                                  ? D
                                    ? "rgba(99,102,241,.15)"
                                    : "#eef2ff"
                                  : "transparent",
                                cursor: "pointer",
                                fontSize: 13,
                                color: sel ? "#6366f1" : tx(D),
                                transition: "border-color.15s,background .15s",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  marginRight: 9,
                                  fontSize: 11,
                                  opacity: 0.7,
                                }}
                              >
                                {"ABCD"[oi]}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <textarea
                          value={pAns.textAns || ""}
                          onChange={function (e) {
                            setPartAns(q.id, pi, { textAns: e.target.value });
                          }}
                          rows={
                            part.type === "extended"
                              ? part.marks >= 6
                                ? 10
                                : 7
                              : 4
                          }
                          placeholder="Write your answer here…"
                          style={{
                            ...I(D, {
                              resize: "vertical",
                              lineHeight: 1.7,
                              width: "100%",
                            }),
                          }}
                        />
                        <p style={{ fontSize: 10, color: mu(D), marginTop: 3 }}>
                          Writing on paper? Submit first then self-mark using
                          the mark scheme.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ ...C(D), padding: 24, marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: mu(D),
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span>
                  {q.type === "mcq"
                    ? "Multiple Choice"
                    : q.type === "short"
                      ? "Short Answer"
                      : "ExtendedResponse"}
                </span>
                {q.year === "AI Generated" && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 400,
                      fontStyle: "italic",
                      color: mu(D),
                    }}
                  >
                    AI Generated
                  </span>
                )}
              </div>
              {(q.images || []).map((img, ii) => (
                <AnnotatedImage key={ii} img={img} D={D} />
              ))}
              {parseQuestionText(q.text, D, 14)}
              {q.type === "mcq" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  {(q.options || []).map((opt, oi) => {
                    const sel = curAns.selOpt === oi;
                    return (
                      <button
                        key={oi}
                        onClick={() => setAns(q.id, { selOpt: oi })}
                        style={{
                          textAlign: "left",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: `1.5px solid
${sel ? "#6366f1" : bd2}`,
                          background: sel
                            ? D
                              ? "rgba(99,102,241,.15)"
                              : "#eef2ff"
                            : "transparent",
                          cursor: "pointer",
                          fontSize: 13,
                          color: sel ? "#6366f1" : tx(D),
                          transition: "border-color.15s,background .15s",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            marginRight: 10,
                            fontSize: 11,
                            opacity: 0.7,
                          }}
                        >
                          {"ABCD"[oi]}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {(q.type === "short" || q.type === "extended") && (
                <div style={{ marginTop: 12 }}>
                  <input
                    ref={ansFileRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setAns(q.id, {
                          fileAns: {
                            name: file.name,
                            preview: ev.target.result,
                            type: file.type,
                          },
                        });

                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                  {curAns.fileAns ? (
                    <div
                      style={{
                        marginBottom: 10,
                        padding: "10px12px",
                        borderRadius: 10,
                        background: D ? "#1e2537" : "#f0fdf4",
                        border: `1px solid
${D ? "#374151" : "#86efac"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      {curAns.fileAns.type?.startsWith("image/") ? (
                        <img
                          src={curAns.fileAns.preview}
                          alt=""
                          style={{
                            height: 60,
                            width: 60,
                            objectFit: "cover",
                            borderRadius: 6,
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 20 }}> </span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: D ? "#86efac" : "#15803d",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {curAns.fileAns.name}
                        </div>
                        <div style={{ fontSize: 10, color: mu(D) }}>
                          Answer uploaded
                        </div>
                      </div>
                      <button
                        onClick={() => setAns(q.id, { fileAns: null })}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          fontSize: 11,
                          cursor: "pointer",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <textarea
                      value={curAns.textAns || ""}
                      onChange={(e) =>
                        setAns(q.id, { textAns: e.target.value })
                      }
                      rows={q.type === "extended" ? 10 : 5}
                      placeholder={
                        curAns.fileAns
                          ? "Optional: add typed notes alongside your uploadedanswer"
                          : "Write your answer here…"
                      }
                      style={{
                        ...I(D, {
                          resize: "vertical",
                          lineHeight: 1.7,
                          flex: 1,
                        }),
                      }}
                    />
                    <button
                      onClick={() => ansFileRef.current?.click()}
                      title="Upload photo of handwrittenanswer"
                      style={{
                        ...B("transparent", true, {
                          fontSize: 14,
                          padding: "8px10px",
                          borderColor: bd2,
                          color: mu(D),
                          flexShrink: 0,
                          marginTop: 0,
                        }),
                      }}
                    >
                      {" "}
                    </button>
                  </div>
                  <p style={{ fontSize: 10, color: mu(D), marginTop: 4 }}>
                    Tip: you can upload a photo of a handwritten answer instead
                    of typing
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setQI((i) => Math.max(0, i - 1))}
              disabled={qIdx === 0}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: `1px solid
${bd2}`,
                background: "transparent",
                color: qIdx === 0 ? mu(D) : tx(D),
                cursor: qIdx === 0 ? "not-allowed" : "pointer",
                fontSize: 13,
              }}
            >
              Prev
            </button>
            <button
              onClick={() =>
                qIdx < questions.length - 1 ? setQI((i) => i + 1) : doSubmit()
              }
              style={{
                flex: 2,
                ...B(
                  qIdx < questions.length - 1 ? "#6366f1" : "#16a34a",
                  false,
                  { fontSize: 13, padding: "10px 0" },
                ),
              }}
            >
              {qIdx < questions.length - 1 ? "Next →" : "Submit Exam ✓"}
            </button>
          </div>
        </div>
        {/* end inner flex child */}
      </div>
    </div>
  );
}
