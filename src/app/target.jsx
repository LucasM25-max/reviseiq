import { markAnswer } from "./aiService.js";
import { AnnotatedImage } from "./annotation.jsx";
import { DEFAULT_BOARD } from "./coreHelpers.js";
import { Header } from "./header.jsx";
import { ContentBlock } from "./richText.jsx";
import { mergeTopics } from "./social.jsx";
import { B, C, I, mu, tx } from "./ui.jsx";

export function TargetScreen(props) {
  const { D, bd2, bg, boardSels, getBD, hProps, markTodayActive, setScreen, setStats, setTTI, setTTIdx, setTTMk, setTTRes, setTTSO, setTTSubj, setTTTA, stats, subjects, ttIdx, ttItems, ttMarking, ttRes, ttSelOpt, ttSubj, ttTextAns } = props;

    const allSecs = subjects.flatMap((s, si) => {
      const b = boardSels[s.id] || DEFAULT_BOARD;
      const bdata = getBD(s.id, b);
      const merged = mergeTopics(s.topics || [], bdata.custom, bdata.extras);
      return merged.flatMap((t, ti) =>
        t.sections.map((sec) => ({ sec, si, ti, subj: s })),
      );
    });
    const scoredSecs = allSecs
      .map(function (item) {
        const sec = item.sec,
          si = item.si,
          ti = item.ti,
          subj = item.subj;
        const wq = stats.weakQ?.[sec.id] || { wrong: 0, total: 0 };
        const wf = stats.weakFC?.[sec.id] || { wrong: 0, total: 0 };
        const attempts = wq.total + wf.total;
        const score = attempts > 0 ? (wq.wrong * 2 + wf.wrong) / attempts : 0;
        return { sec, si, ti, subj, score, attempts, wq, wf };
      })
      .filter((x) => x.sec.questions?.length > 0);
    const filtered =
      ttSubj != null ? scoredSecs.filter((x) => x.si === ttSubj) : scoredSecs;
    const sorted = [...filtered].sort(
      (a, b) => b.score - a.score || b.attempts - a.attempts,
    );
    const buildQueue = () => {
      const items = [];
      for (var _si = 0; _si < sorted.length; _si++) {
        const _it = sorted[_si];
        const sec = _it.sec,
          subj = _it.subj;
        const qs = (sec.questions || []).slice(0, 2);
        qs.forEach(function (q) {
          items.push({ q, secId: sec.id, secTitle: sec.title, subj });
        });
      }
      return items.slice(0, 15);
    };
    if (ttItems.length > 0) {
      const item = ttItems[ttIdx];

      const q = item?.q;
      const isLast = ttIdx >= ttItems.length - 1;
      if (!item) return null;
      const finishTT = () => {
        setTTI([]);
        setTTIdx(0);
        setTTRes(null);
        setTTSO(null);
        setTTTA("");
      };
      const nextTT = () => {
        setTTIdx((i) => i + 1);
        setTTRes(null);
        setTTSO(null);
        setTTTA("");
      };
      return (
        <div
          style={{ minHeight: "100vh", background: bg, color: tx(D) }}
          className="fade-in"
        >
          <Header {...hProps} />
          <div
            style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                  Target Test
                </h2>
                <p style={{ fontSize: 12, color: mu(D) }}>
                  Question {ttIdx + 1} of {ttItems.length} ·{item.secTitle}
                </p>
              </div>
              <button
                onClick={finishTT}
                style={{
                  fontSize: 12,
                  color: mu(D),
                  background: "none",
                  border: `1px solid ${bd2}`,
                  borderRadius: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                End Test
              </button>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 4,
                background: D ? "#262844" : "#e5e7eb",
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 4,
                  background: "#ef4444",
                  width: `${(ttIdx / ttItems.length) * 100}
%`,
                  transition: "width .4s",
                }}
              />
            </div>
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
                    color: mu(D),
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {q.type === "mcq"
                    ? "MCQ"
                    : q.type === "short"
                      ? "Short Answer"
                      : "Extended"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: item.subj.mid,
                    color: item.subj.dk,
                  }}
                >
                  {q.marks}
                  mark{q.marks !== 1 ? "s" : ""}
                </span>
              </div>
              {(q.images || []).map((img, ii) => (
                <AnnotatedImage key={ii} img={img} D={D} />
              ))}
              <ContentBlock
                content={q.text}
                D={D}
                fontSize={15}
                style={{ marginBottom: 16 }}
              />
              {q.type === "mcq" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {q.options.map((opt, oi) => {
                    const sel = ttSelOpt === oi,
                      correct = oi === q.answer,
                      rev = ttRes != null;
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
                    }

                    return (
                      <button
                        key={oi}
                        onClick={() => {
                          if (!ttRes) {
                            const isCorrect = oi === q.answer;
                            setTTSO(oi);
                            setTTRes(isCorrect ? "correct" : "wrong");
                            markTodayActive();
                            setStats((s) => {
                              const wq = { ...s.weakQ };
                              wq[item.secId] = {
                                wrong:
                                  (wq[item.secId]?.wrong || 0) +
                                  (isCorrect ? 0 : 1),
                                total: (wq[item.secId]?.total || 0) + 1,
                              };
                              return {
                                ...s,
                                qS: s.qS + (isCorrect ? 1 : 0),
                                qM: s.qM + 1,
                                weakQ: wq,
                              };
                            });
                          }
                        }}
                        style={{
                          textAlign: "left",
                          padding: "11px 16px",
                          borderRadius: 10,
                          border: `1.5px solid ${br2}`,
                          background: bg2,
                          cursor: ttRes ? "default" : "pointer",
                          color: co2,
                          fontSize: 13,
                          transition: "all .15s",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            marginRight: 10,
                            fontSize: 11,
                          }}
                        >
                          {"ABCD"[oi]}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                  {ttRes && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 14,
                        borderRadius: 12,
                        background: ttRes === "correct" ? "#dcfce7" : "#fee2e2",
                        border: `1px solid ${ttRes === "correct" ? "#22c55e" : "#ef4444"}`,
                        color: ttRes === "correct" ? "#15803d" : "#b91c1c",
                        fontSize: 13,
                      }}
                    >
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>
                        {ttRes === "correct" ? "✓ Correct!" : "✗Incorrect"}
                      </p>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              )}
              {(q.type === "short" || q.type === "extended") && (
                <div>
                  <textarea
                    value={ttTextAns}
                    onChange={(e) => setTTTA(e.target.value)}
                    disabled={!!ttRes}
                    rows={q.type === "extended" ? 6 : 3}
                    placeholder={`Write your answer… [${q.marks} mark${q.marks !== 1 ? "s" : ""}]`}
                    style={{
                      ...I(D, { resize: "vertical", lineHeight: 1.65 }),
                    }}
                  />
                  {!ttRes && (
                    <button
                      onClick={async () => {
                        if (!ttTextAns.trim()) return;
                        setTTMk(true);
                        markTodayActive();
                        try {
                          const r = await markAnswer(q, ttTextAns);
                          setTTRes(r);
                          const pct = q.marks > 0 ? r.score / q.marks : 0;
                          setStats((s) => {
                            const wq = { ...s.weakQ };
                            wq[item.secId] = {
                              wrong:
                                (wq[item.secId]?.wrong || 0) +
                                (pct < 0.5 ? 1 : 0),
                              total: (wq[item.secId]?.total || 0) + 1,
                            };
                            return {
                              ...s,
                              qS: s.qS + (r.score || 0),
                              qM: s.qM + q.marks,
                              weakQ: wq,
                            };
                          });
                        } catch (e) {
                          setTTRes({
                            score: "?",
                            feedback:
                              "ReviseIQ AI unavailable — please try again.",
                            missedPoints: [],
                            modelAnswer: q.sampleAnswer || "",
                            examTip: "",
                          });
                        }
                        setTTMk(false);
                      }}
                      disabled={!ttTextAns.trim() || ttMarking}
                      style={{
                        marginTop: 10,
                        width: "100%",
                        background:
                          ttTextAns.trim() && !ttMarking
                            ? "var(--riq-accent)"
                            : "#9ca3af",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        padding: "11px 0",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor:
                          ttTextAns.trim() && !ttMarking
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      {ttMarking ? "Marking…" : "Submit →"}
                    </button>
                  )}
                  {ttRes && typeof ttRes === "object" && ttRes.feedback && (
                    <div
                      style={{
                        marginTop: 12,
                        ...C(D),
                        padding: 18,
                        background: D ? "#1a1a2e" : "#f8f7ff",
                        borderColor: "var(--riq-accent)",
                      }}
                      className="fade-in"
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                          ReviseIQ AI Marking
                        </span>
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color:
                              ttRes.score >= q.marks * 0.7
                                ? "#16a34a"
                                : ttRes.score >= q.marks * 0.4
                                  ? "#d97706"
                                  : "#dc2626",
                          }}
                        >
                          {ttRes.score}/{q.marks}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.65,
                          marginBottom: 8,
                        }}
                      >
                        {ttRes.feedback}
                      </p>
                      {ttRes.missedPoints?.map((pt, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: 12,
                            color: "#dc2626",
                            display: "flex",
                            gap: 6,
                            marginBottom: 2,
                          }}
                        >
                          <span>•</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                      {ttRes.examTip && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: D ? "#1e2f4a" : "#eff6ff",
                            border: "1px solid #bfdbfe",
                            fontSize: 12,
                            color: "#1d4ed8",
                          }}
                        >
                          {ttRes.examTip}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {ttRes && (
              <button
                onClick={isLast ? finishTT : nextTT}
                style={{
                  width: "100%",
                  ...B(isLast ? "#10b981" : "#ef4444", false, {
                    padding: "12px 0",
                    borderRadius: 12,
                    fontSize: 14,
                  }),
                }}
              >
                {isLast ? "✓ Complete Test" : "Next Question →"}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        style={{ minHeight: "100vh", background: bg, color: tx(D) }}
        className="fade-in"
      >
        <Header {...hProps} />
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
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
            Home
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                Target Test
              </h2>
              <p style={{ fontSize: 14, color: mu(D) }}>
                Targets your weakest areas — adapts as you improve
              </p>
            </div>
            <button
              onClick={() => {
                const q = buildQueue();
                setTTI(q);
                setTTIdx(0);
                setTTRes(null);
                setTTSO(null);
                setTTTA("");
              }}
              disabled={sorted.length === 0}
              style={{
                ...B("#ef4444", false, {
                  fontSize: 14,
                  padding: "11px 22px",
                  opacity: sorted.length === 0 ? 0.4 : 1,
                }),
              }}
            >
              Start Test{ttSubj != null ? ` · ${subjects[ttSubj]?.name}` : ""}
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 22,
            }}
          >
            <button
              onClick={() => setTTSubj(null)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1.5px solid ${ttSubj === null ? "#ef4444" : bd2}`,
                background: ttSubj === null ? "#ef4444" : "transparent",
                color: ttSubj === null ? "#fff" : mu(D),
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              All subjects
            </button>
            {subjects.map((s, si) => (
              <button
                key={s.id}
                onClick={() => setTTSubj(si === ttSubj ? null : si)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1.5px solid ${ttSubj === si ? s.accent : bd2}`,
                  background: ttSubj === si ? s.accent : "transparent",
                  color: ttSubj === si ? "#fff" : mu(D),
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
          {sorted.length === 0 ? (
            <div style={{ ...C(D), padding: 48, textAlign: "center" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}> </p>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                No data yet
              </p>
              <p style={{ fontSize: 13, color: mu(D) }}>
                Answer questions first — Target Test will identify your weak
                spots.
              </p>
            </div>
          ) : (
            <div style={{ ...C(D), padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
                Weakness Analysis
              </h3>
              <p style={{ fontSize: 13, color: mu(D), marginBottom: 16 }}>
                Ranked by weakness · Questions weight 2×, flashcards 1×
              </p>
              {sorted.slice(0, 12).map(function (itm, i) {
                const sec = itm.sec,
                  subj = itm.subj,
                  score = itm.score,
                  wq = itm.wq,
                  wf = itm.wf;
                const pct = Math.round(score * 100);
                const col =
                  pct > 60 ? "#dc2626" : pct > 30 ? "#d97706" : "#16a34a";
                return (
                  <div
                    key={sec.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: `1px solid ${bd2}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: col,
                        width: 28,
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sec.title}
                      </div>
                      <div style={{ fontSize: 11, color: mu(D) }}>
                        {subj.icon} {subj.name}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
                      {wq.total > 0 && (
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#dc2626",
                            }}
                          >
                            {wq.wrong}/{wq.total}
                          </div>
                          <div style={{ fontSize: 10, color: mu(D) }}>
                            Q wrong
                          </div>
                        </div>
                      )}
                      {wf.total > 0 && (
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#d97706",
                            }}
                          >
                            {wf.wrong}/{wf.total}
                          </div>
                          <div style={{ fontSize: 10, color: mu(D) }}>
                            FC wrong
                          </div>
                        </div>
                      )}
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{ fontSize: 13, fontWeight: 700, color: col }}
                        >
                          {pct}%
                        </div>
                        <div style={{ fontSize: 10, color: mu(D) }}>weak</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  
}
