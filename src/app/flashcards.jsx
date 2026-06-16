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

function RichText({ value }) {
  const text = value == null ? "" : String(value);
  const isHtml = text.trimStart().startsWith("<");
  if (isHtml) {
    const htmlObj = { __html: text };
    return (
      <div className="fcx-rt rich-display" dangerouslySetInnerHTML={htmlObj} />
    );
  }
  const lines = text.split("\n");
  return (
    <div className="fcx-rt">
      {lines.map((ln, i) => (
        <p key={i} className="fcx-line">
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
  { g: 1, label: "Again", cls: "fcx-again" },
  { g: 2, label: "Hard", cls: "fcx-hard" },
  { g: 3, label: "Good", cls: "fcx-good" },
  { g: 4, label: "Easy", cls: "fcx-easy" },
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

  const rootStyle = { "--fcx-accent": accent };
  const rootCls = "fcx-root" + (D ? " fcx-dark" : "");

  if (valid.length === 0) {
    return (
      <div className={rootCls} style={rootStyle}>
        <div className="fcx-empty">
          <div className="fcx-empty-emoji">🗂️</div>
          <div className="fcx-empty-title">No flashcards yet</div>
          <div className="fcx-empty-sub">
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
      <div className={rootCls} style={rootStyle}>
        <div className="fcx-empty">
          <div className="fcx-empty-emoji">✅</div>
          <div className="fcx-empty-title">All caught up</div>
          <div className="fcx-empty-sub">
            No cards are due right now. Spaced repetition will resurface them
            exactly when reviewing gives the biggest memory boost.
          </div>
          <button className="fcx-primary" onClick={() => start(true)}>
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
    return (
      <div className={rootCls} style={rootStyle}>
        <div className="fcx-complete">
          <div className="fcx-empty-emoji">🎉</div>
          <div className="fcx-empty-title">Session complete</div>
          <div className="fcx-stats">
            <div className="fcx-stat">
              <span className="fcx-stat-n">{stats.reviewed}</span>
              <span className="fcx-stat-l">reviewed</span>
            </div>
            <div className="fcx-stat">
              <span className="fcx-stat-n">{acc}%</span>
              <span className="fcx-stat-l">recalled</span>
            </div>
            <div className="fcx-stat">
              <span className="fcx-stat-n">{stats.again}</span>
              <span className="fcx-stat-l">to redo</span>
            </div>
          </div>
          <button className="fcx-primary" onClick={() => start(all)}>
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
  const barStyle = { width: pct + "%" };
  const cardCls = "fcx-card" + (flipped ? " is-flipped" : "");

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
    <div className={rootCls} style={rootStyle}>
      <div className="fcx-head">
        <div className="fcx-head-row">
          <span className="fcx-due">
            {all ? "Review all" : "Due now"} · {Math.max(queue.length - pos, 0)}{" "}
            left
          </span>
          <span className="fcx-count">
            {pos + 1} / {queue.length}
            {recall != null ? " · " + recall + "% recall" : ""}
          </span>
        </div>
        <div className="fcx-prog">
          <div className="fcx-prog-fill" style={barStyle} />
        </div>
      </div>

      <div className="fcx-scene">
        <div className={cardCls} onClick={() => setFlipped((v) => !v)}>
          <div className="fcx-face fcx-front">
            <div className="fcx-eyebrow">Question</div>
            <div className="fcx-body">
              <RichText value={qText(card)} />
            </div>
            <div className="fcx-tap">Tap to reveal answer</div>
          </div>
          <div className="fcx-face fcx-back">
            <div className="fcx-eyebrow">Answer</div>
            <div className="fcx-body">
              <RichText value={aText(card)} />
            </div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="fcx-rate">
          {RATINGS.map((r, i) => (
            <button
              key={r.g}
              className={"fcx-btn " + r.cls}
              onClick={() => rate(r.g)}
            >
              <span className="fcx-btn-l">{r.label}</span>
              <span className="fcx-btn-i">{previews[i]}</span>
            </button>
          ))}
        </div>
      ) : (
        <button className="fcx-reveal" onClick={() => setFlipped(true)}>
          Show answer
        </button>
      )}

      <div className="fcx-foot">
        <button className="fcx-skip" onClick={skip}>
          Skip
        </button>
        {!all && (
          <button className="fcx-link" onClick={() => start(true)}>
            Review all cards
          </button>
        )}
      </div>
    </div>
  );
}
