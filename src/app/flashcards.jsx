import React from "react";
import {
  fsrsNext,
  getCardState,
  isCardDue,
  previewIntervals,
  getRetrievability,
} from "./fsrs.js";

function qText(card) {
  if (!card) return "";
  return card.q || card.front || card.question || card.text || "";
}

function aText(card) {
  if (!card) return "";
  return card.a || card.back || card.answer || card.explanation || "";
}

function RichText({ value, color }) {
  const text = value == null ? "" : String(value);
  const isHtml = text.trimStart().startsWith("<");
  if (isHtml) {
    const htmlObj = { __html: text };
    const hStyle = { width: "100%", color: color };
    return (
      <div
        className="rich-display"
        style={hStyle}
        dangerouslySetInnerHTML={htmlObj}
      />
    );
  }
  const lines = text.split("\n");
  const pStyle = { margin: "0 0 8px" };
  return (
    <div>
      {lines.map((ln, i) => (
        <p key={i} style={pStyle}>
          {ln}
        </p>
      ))}
    </div>
  );
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function buildQueue(cards, fcHist, all) {
  const valid = (cards || []).filter((c) => c && c.id != null);
  if (all) return shuffle(valid);
  const due = valid.filter((c) => isCardDue(fcHist || {}, c.id));
  return shuffle(due);
}

const RATINGS = [
  { g: 1, label: "Again", grad: "linear-gradient(135deg,#ef4444,#dc2626)" },
  { g: 2, label: "Hard", grad: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { g: 3, label: "Good", grad: "linear-gradient(135deg,#10b981,#059669)" },
  { g: 4, label: "Easy", grad: "linear-gradient(135deg,#3b82f6,#2563eb)" },
];

export function Flashcards({
  cards = [],
  fcHist = {},
  setFCH,
  D = false,
  accent = "#7c3aed",
  markTodayActive,
  sectionTitle = "",
}) {
  const valid = React.useMemo(
    () =>
      Array.isArray(cards) ? cards.filter((c) => c && c.id != null) : [],
    [cards],
  );
  const [all, setAll] = React.useState(false);
  const [session, setSession] = React.useState(() => ({
    queue: buildQueue(cards, fcHist, false),
    pos: 0,
  }));
  const [flipped, setFlipped] = React.useState(false);
  const [stats, setStats] = React.useState({
    reviewed: 0,
    correct: 0,
    again: 0,
  });

  const start = (allMode) => {
    setAll(allMode);
    setSession({ queue: buildQueue(cards, fcHist, allMode), pos: 0 });
    setFlipped(false);
    setStats({ reviewed: 0, correct: 0, again: 0 });
  };

  const cardBg = D ? "#13131f" : "#ffffff";
  const cardBorder = "1px solid " + (D ? "#262844" : "#ece9f7");
  const textColor = D ? "#e8ecf4" : "#1f2937";
  const muted = D ? "#8896b3" : "#9ca3af";
  const accentGrad = "linear-gradient(135deg," + accent + ",#8b5cf6)";

  const rootStyle = { maxWidth: "640px", margin: "0 auto", color: textColor };
  const wrapStyle = {
    textAlign: "center",
    padding: "46px 26px",
    background: cardBg,
    border: cardBorder,
    borderRadius: "22px",
    boxShadow: "0 14px 40px -22px rgba(31,28,72,.3)",
  };
  const emojiStyle = { fontSize: "46px", marginBottom: "12px" };
  const titleStyle = { fontSize: "19px", fontWeight: 800, marginBottom: "8px" };
  const subStyle = {
    fontSize: "14px",
    lineHeight: 1.6,
    color: D ? "#9aa3b2" : "#6b7280",
    maxWidth: "380px",
    margin: "0 auto 18px",
  };
  const primaryStyle = {
    padding: "12px 26px",
    border: "none",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "14.5px",
    color: "#fff",
    background: accentGrad,
    boxShadow: "0 10px 24px -10px rgba(124,58,237,.6)",
  };

  if (valid.length === 0) {
    return (
      <div style={rootStyle}>
        <div style={wrapStyle}>
          <div style={emojiStyle}>🗂️</div>
          <div style={titleStyle}>No flashcards yet</div>
          <div style={subStyle}>
            Flashcards for this section will appear here once they are added.
          </div>
        </div>
      </div>
    );
  }

  const queue = session.queue;
  const pos = session.pos;
  const finished = pos >= queue.length;

  if (queue.length === 0) {
    return (
      <div style={rootStyle}>
        <div style={wrapStyle}>
          <div style={emojiStyle}>✅</div>
          <div style={titleStyle}>All caught up</div>
          <div style={subStyle}>
            No cards are due right now. Spaced repetition will resurface them
            exactly when reviewing gives the biggest memory boost.
          </div>
          <button style={primaryStyle} onClick={() => start(true)}>
            Review all {valid.length} cards
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const acc =
      stats.reviewed > 0
        ? Math.round((stats.correct / stats.reviewed) * 100)
        : 0;
    const statsRow = {
      display: "flex",
      justifyContent: "center",
      gap: "30px",
      margin: "18px 0 22px",
    };
    const statBox = { display: "flex", flexDirection: "column", gap: "3px" };
    const statN = { fontSize: "28px", fontWeight: 800, color: accent };
    const statL = {
      fontSize: "12px",
      fontWeight: 600,
      color: muted,
      textTransform: "uppercase",
      letterSpacing: ".05em",
    };
    return (
      <div style={rootStyle}>
        <div style={wrapStyle}>
          <div style={emojiStyle}>🎉</div>
          <div style={titleStyle}>Session complete</div>
          <div style={statsRow}>
            <div style={statBox}>
              <span style={statN}>{stats.reviewed}</span>
              <span style={statL}>reviewed</span>
            </div>
            <div style={statBox}>
              <span style={statN}>{acc}%</span>
              <span style={statL}>recalled</span>
            </div>
            <div style={statBox}>
              <span style={statN}>{stats.again}</span>
              <span style={statL}>to redo</span>
            </div>
          </div>
          <button style={primaryStyle} onClick={() => start(all)}>
            Study again
          </button>
        </div>
      </div>
    );
  }

  const card = queue[pos];
  const previews = previewIntervals(getCardState(fcHist || {}, card.id));
  const recall = getRetrievability(fcHist || {}, card.id);
  const pct = queue.length > 0 ? Math.round((pos / queue.length) * 100) : 0;

  const headRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12.5px",
    marginBottom: "8px",
  };
  const dueStyle = { fontWeight: 800, color: accent };
  const countStyle = { color: muted, fontWeight: 600 };
  const progStyle = {
    height: "7px",
    borderRadius: "999px",
    background: D ? "#262844" : "#ece9f7",
    overflow: "hidden",
  };
  const progFill = {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg," + accent + ",#8b5cf6)",
    transition: "width .35s ease",
    width: pct + "%",
  };
  const sceneStyle = { perspective: "1600px", margin: "16px 0" };
  const cardStyle = {
    position: "relative",
    width: "100%",
    minHeight: "300px",
    transformStyle: "preserve-3d",
    transition: "transform .55s cubic-bezier(.22,1,.36,1)",
    cursor: "pointer",
    transform: flipped ? "rotateY(180deg)" : "none",
  };
  const faceBase = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: "22px",
    padding: "34px 30px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    overflow: "auto",
    background: cardBg,
    border: cardBorder,
    boxShadow: "0 18px 44px -20px rgba(31,28,72,.4)",
  };
  const backStyle = { ...faceBase, transform: "rotateY(180deg)" };
  const barBase = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "5px",
    borderTopLeftRadius: "22px",
    borderTopRightRadius: "22px",
  };
  const barFront = {
    ...barBase,
    background: "linear-gradient(90deg," + accent + ",#8b5cf6,#d946ef)",
  };
  const barBack = {
    ...barBase,
    background: "linear-gradient(90deg,#0d9488,#10b981,#34d399)",
  };
  const eyebrowFront = {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    color: accent,
    marginBottom: "14px",
  };
  const eyebrowBack = { ...eyebrowFront, color: D ? "#2dd4bf" : "#0d9488" };
  const bodyStyle = {
    fontSize: "19px",
    lineHeight: 1.55,
    fontWeight: 600,
    width: "100%",
    color: textColor,
  };
  const tapStyle = {
    position: "absolute",
    bottom: "14px",
    left: 0,
    right: 0,
    fontSize: "11.5px",
    fontWeight: 600,
    color: D ? "#5b6178" : "#b6b9c9",
  };
  const revealStyle = {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "15px",
    color: "#fff",
    background: accentGrad,
    boxShadow: "0 10px 24px -10px rgba(124,58,237,.6)",
  };
  const rateWrap = {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "8px",
  };
  const btnBase = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    padding: "11px 6px",
    border: "none",
    borderRadius: "13px",
    cursor: "pointer",
    color: "#fff",
    fontWeight: 800,
    fontSize: "14px",
  };
  const btnIntervalStyle = { fontSize: "10.5px", fontWeight: 600, opacity: 0.9 };
  const footStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "14px",
  };
  const skipStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: muted,
    padding: "4px 2px",
  };
  const linkStyle = { ...skipStyle, color: accent };

  const rate = (g) => {
    if (markTodayActive) {
      try {
        markTodayActive();
      } catch (e) {}
    }
    if (typeof setFCH === "function") {
      setFCH((prev) => {
        const ph = prev || {};
        const prevState = getCardState(ph, card.id);
        const next = fsrsNext(prevState, g);
        return { ...ph, [card.id]: next };
      });
    }
    setStats((s) => ({
      reviewed: s.reviewed + 1,
      correct: s.correct + (g >= 3 ? 1 : 0),
      again: s.again + (g === 1 ? 1 : 0),
    }));
    setSession((s) => {
      const q = g === 1 ? s.queue.concat([card]) : s.queue;
      return { queue: q, pos: s.pos + 1 };
    });
    setFlipped(false);
  };

  const skip = () => {
    setSession((s) => ({ queue: s.queue, pos: s.pos + 1 }));
    setFlipped(false);
  };

  return (
    <div style={rootStyle}>
      <div style={headRow}>
        <span style={dueStyle}>
          {all ? "Review all" : "Due now"} · {Math.max(queue.length - pos, 0)} left
        </span>
        <span style={countStyle}>
          {pos + 1} / {queue.length}
          {recall != null ? " · " + recall + "% recall" : ""}
        </span>
      </div>
      <div style={progStyle}>
        <div style={progFill} />
      </div>

      <div style={sceneStyle}>
        <div style={cardStyle} onClick={() => setFlipped((v) => !v)}>
          <div style={faceBase}>
            <div style={barFront} />
            <div style={eyebrowFront}>Question</div>
            <div style={bodyStyle}>
              <RichText value={qText(card)} color={textColor} />
            </div>
            <div style={tapStyle}>Tap to reveal answer</div>
          </div>
          <div style={backStyle}>
            <div style={barBack} />
            <div style={eyebrowBack}>Answer</div>
            <div style={bodyStyle}>
              <RichText value={aText(card)} color={textColor} />
            </div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div style={rateWrap}>
          {RATINGS.map((r, i) => {
            const btnStyle = { ...btnBase, background: r.grad };
            return (
              <button key={r.g} style={btnStyle} onClick={() => rate(r.g)}>
                <span>{r.label}</span>
                <span style={btnIntervalStyle}>{previews[i]}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <button style={revealStyle} onClick={() => setFlipped(true)}>
          Show answer
        </button>
      )}

      <div style={footStyle}>
        <button style={skipStyle} onClick={skip}>
          Skip
        </button>
        {!all && (
          <button style={linkStyle} onClick={() => start(true)}>
            Review all cards
          </button>
        )}
      </div>
    </div>
  );
}
