import React from "react";
import { resolveVar } from "./themes.js";
import { createPortal } from "react-dom";

function stripHtml(s) {
  return (s == null ? "" : String(s)).replace(/<[^>]*>/g, "").trim();
}

function qText(card) {
  if (!card) return "";
  return card.q || card.front || card.question || card.text || "";
}
function aText(card) {
  if (!card) return "";
  return card.a || card.back || card.answer || card.explanation || "";
}

const PHASES = {
  work: { label: "Focus", color: "var(--riq-accent)", grad: "linear-gradient(135deg,var(--riq-accent),var(--riq-primary-2))" },
  short: { label: "Short break", color: "#10b981", grad: "linear-gradient(135deg,#10b981,#059669)" },
  long: { label: "Long break", color: "#0ea5e9", grad: "linear-gradient(135deg,#0ea5e9,#0284c7)" },
};

export function FocusMode({ D = false, cards = [], section, subj, onExit }) {
  const safeCards = React.useMemo(
    () => (Array.isArray(cards) ? cards.filter((c) => c && (qText(c) || aText(c))) : []),
    [cards],
  );

  // Pomodoro settings
  const [workMin, setWorkMin] = React.useState(25);
  const [shortMin, setShortMin] = React.useState(5);
  const [longMin, setLongMin] = React.useState(15);
  const [perLong, setPerLong] = React.useState(4);
  const [autoStart, setAutoStart] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);

  // Session state
  const [phase, setPhase] = React.useState("work");
  const [secondsLeft, setSecondsLeft] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);
  const [completedWork, setCompletedWork] = React.useState(0);
  const [totalFocusSec, setTotalFocusSec] = React.useState(0);

  // Flashcard review
  const [cardIdx, setCardIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);

  // Noise + exit
  const [noise, setNoise] = React.useState(false);
  const [exitConfirm, setExitConfirm] = React.useState(false);

  const audioCtxRef = React.useRef(null);
  const noiseNodeRef = React.useRef(null);
  const phaseRef = React.useRef(phase);
  const transitioningRef = React.useRef(false);

  const phaseMinutes = (p) => (p === "work" ? workMin : p === "short" ? shortMin : longMin);
  const phaseDuration = (p) => phaseMinutes(p) * 60;

  React.useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Tick
  React.useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setTotalFocusSec((t) => t + (phaseRef.current === "work" ? 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const playChime = React.useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const notes = [660, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const t0 = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.35);
      });
      setTimeout(() => {
        try {
          ctx.close();
        } catch (e) {}
      }, 900);
    } catch (e) {}
  }, []);

  const notify = React.useCallback((title, body) => {
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(title, { body });
      }
    } catch (e) {}
  }, []);

  // Phase transition when timer hits 0
  React.useEffect(() => {
    if (secondsLeft > 0) {
      transitioningRef.current = false;
      return;
    }
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    playChime();
    if (phase === "work") {
      const done = completedWork + 1;
      setCompletedWork(done);
      const next = done % perLong === 0 ? "long" : "short";
      setPhase(next);
      setSecondsLeft(phaseDuration(next));
      setRunning(autoStart);
      notify("Focus session complete", next === "long" ? "Time for a long break." : "Time for a short break.");
    } else {
      setPhase("work");
      setSecondsLeft(phaseDuration("work"));
      setRunning(autoStart);
      notify("Break over", "Back to focus.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // Cleanup noise on unmount
  React.useEffect(
    () => () => {
      try {
        noiseNodeRef.current && noiseNodeRef.current.stop();
        audioCtxRef.current && audioCtxRef.current.close();
      } catch (e) {}
    },
    [],
  );

  const requestNotify = () => {
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch (e) {}
  };

  const startPause = () => {
    if (!running) requestNotify();
    setRunning((v) => !v);
  };

  const resetPhase = () => {
    setRunning(false);
    transitioningRef.current = false;
    setSecondsLeft(phaseDuration(phase));
  };

  const skipPhase = () => {
    setRunning(false);
    transitioningRef.current = false;
    if (phase === "work") {
      const done = completedWork + 1;
      setCompletedWork(done);
      const next = done % perLong === 0 ? "long" : "short";
      setPhase(next);
      setSecondsLeft(phaseDuration(next));
    } else {
      setPhase("work");
      setSecondsLeft(phaseDuration("work"));
    }
  };

  const applySetting = (setter, val, isCurrentPhaseKey) => {
    setter(val);
    if (isCurrentPhaseKey && !running) {
      setSecondsLeft(val * 60);
    }
  };

  const toggleNoise = () => {
    if (!noise) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
          const white = Math.random() * 2 - 1;
          last = (last + 0.02 * white) / 1.02;
          data[i] = last * 3.5;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0.25;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
        audioCtxRef.current = ctx;
        noiseNodeRef.current = src;
        setNoise(true);
      } catch (e) {}
    } else {
      try {
        noiseNodeRef.current && noiseNodeRef.current.stop();
        audioCtxRef.current && audioCtxRef.current.close();
      } catch (e) {}
      noiseNodeRef.current = null;
      audioCtxRef.current = null;
      setNoise(false);
    }
  };

  const fmt = (s) => {
    const m = Math.floor(Math.max(s, 0) / 60);
    const sec = Math.max(s, 0) % 60;
    return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  };

  const meta = PHASES[phase];
  const total = phaseDuration(phase);
  const pct = total > 0 ? (1 - secondsLeft / total) * 100 : 0;
  const R = 88;
  const circ = 2 * Math.PI * R;

  // Theme
  const bg = D ? "#0b0b14" : "#f6f5fc";
  const cardBg = D ? "#13131f" : "#ffffff";
  const border = "1px solid " + (D ? "#262844" : "#ece9f7");
  const textColor = D ? "#eef1fb" : "#0a0a14";
  const muted = D ? "#98a2bd" : "#6b7280";

  // ---- styles ----
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 4000,
    background: bg,
    color: textColor,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    padding: "18px",
    boxSizing: "border-box",
  };
  const topBar = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "560px",
    width: "100%",
    margin: "0 auto",
  };
  const subjTag = { display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "15px" };
  const topBtns = { display: "flex", gap: "8px", alignItems: "center" };
  const ghostBtn = (active, activeColor) => ({
    fontSize: "12.5px",
    fontWeight: 700,
    padding: "7px 12px",
    borderRadius: "10px",
    border: "1px solid " + (active ? activeColor : D ? "#39405c" : "#d8d5e8"),
    background: active ? activeColor : "transparent",
    color: active ? "#fff" : muted,
    cursor: "pointer",
  });
  const exitBtn = {
    fontSize: "12.5px",
    fontWeight: 700,
    padding: "7px 12px",
    borderRadius: "10px",
    border: "1px solid " + (D ? "#7f1d1d" : "#fecaca"),
    background: "transparent",
    color: "#ef4444",
    cursor: "pointer",
  };
  const centerCol = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "18px",
    maxWidth: "560px",
    width: "100%",
    margin: "22px auto 0",
  };
  const phasePill = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 16px",
    borderRadius: "999px",
    fontWeight: 800,
    fontSize: "13.5px",
    letterSpacing: ".04em",
    textTransform: "uppercase",
    color: "#fff",
    background: meta.grad,
    boxShadow: "0 10px 24px -12px " + meta.color,
  };
  const ringWrap = { position: "relative", width: "220px", height: "220px" };
  const ringCenter = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
  };
  const timeText = { fontSize: "46px", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: textColor };
  const ringSub = { fontSize: "12.5px", fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: ".08em" };
  const ringCircleBase = { transition: "stroke-dashoffset .9s linear" };

  const dotsRow = { display: "flex", gap: "9px", alignItems: "center" };
  const dotsLabel = { fontSize: "12.5px", color: muted, fontWeight: 600, marginRight: "4px" };

  const controlsRow = { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" };
  const primaryBtn = {
    padding: "14px 40px",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
    color: "#fff",
    background: meta.grad,
    boxShadow: "0 12px 26px -12px " + meta.color,
  };
  const secondaryBtn = {
    padding: "14px 22px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    color: textColor,
    background: cardBg,
    border: border,
  };

  const statsRow = { display: "flex", gap: "26px", justifyContent: "center", marginTop: "2px" };
  const statBox = { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" };
  const statNum = { fontSize: "20px", fontWeight: 800, color: textColor };
  const statLbl = { fontSize: "11px", fontWeight: 600, color: muted, textTransform: "uppercase", letterSpacing: ".05em" };

  const panel = {
    width: "100%",
    background: cardBg,
    border: border,
    borderRadius: "18px",
    padding: "18px",
    boxSizing: "border-box",
  };
  const panelTitle = { fontSize: "14px", fontWeight: 800, marginBottom: "14px", color: textColor };
  const settingRow = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "10px" };
  const settingLbl = { fontSize: "13.5px", fontWeight: 600, color: textColor };
  const selectStyle = {
    padding: "8px 12px",
    borderRadius: "10px",
    border: border,
    background: D ? "#0f0f1a" : "#fff",
    color: textColor,
    fontWeight: 700,
    fontSize: "13.5px",
    cursor: "pointer",
  };

  // Flashcard styles
  const fcWrap = { width: "100%" };
  const fcMeta = { fontSize: "12.5px", color: muted, fontWeight: 600, marginBottom: "8px", textAlign: "center" };
  const fcCard = {
    background: cardBg,
    border: border,
    borderRadius: "18px",
    padding: "30px 24px",
    minHeight: "130px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: "17px",
    fontWeight: 600,
    lineHeight: 1.5,
    cursor: "pointer",
    color: textColor,
    boxShadow: "0 12px 30px -20px rgba(31,28,72,.4)",
  };
  const fcNav = { display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "10px" };
  const fcNavBtn = {
    flex: 1,
    padding: "11px",
    borderRadius: "12px",
    border: border,
    background: "transparent",
    color: textColor,
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  };
  const fcEyebrow = {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    color: meta.color,
    marginBottom: "10px",
  };

  const breakBox = { textAlign: "center", padding: "10px 0" };
  const breakEmoji = { fontSize: "44px", marginBottom: "8px" };
  const breakTitle = { fontSize: "18px", fontWeight: 800, marginBottom: "6px", color: textColor };
  const breakSub = { fontSize: "14px", color: muted, lineHeight: 1.6, maxWidth: "360px", margin: "0 auto" };

  // Exit confirm overlay
  if (exitConfirm) {
    const confirmCard = {
      background: cardBg,
      border: border,
      borderRadius: "20px",
      padding: "30px 26px",
      maxWidth: "360px",
      textAlign: "center",
      boxShadow: "0 24px 60px -24px rgba(0,0,0,.5)",
    };
    const confirmRow = { display: "flex", gap: "10px", marginTop: "20px" };
    const stayBtn = { ...secondaryBtn, flex: 1 };
    const leaveBtn = { ...primaryBtn, flex: 1, padding: "14px", background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 12px 26px -12px #ef4444" };
    const confirmTitle = { fontSize: "18px", fontWeight: 800, marginBottom: "6px" };
    const confirmSub = { fontSize: "14px", color: muted, lineHeight: 1.5 };
    const confirmOverlay = { ...overlayStyle, alignItems: "center", justifyContent: "center" };
    return createPortal(
      <div style={confirmOverlay}>
        <div style={confirmCard}>
          <div style={breakEmoji}>🚪</div>
          <div style={confirmTitle}>Exit Focus Mode?</div>
          <div style={confirmSub}>
            You’ve focused for {Math.floor(totalFocusSec / 60)} min and completed {completedWork} session
            {completedWork === 1 ? "" : "s"}. Progress for this session won’t be saved.
          </div>
          <div style={confirmRow}>
            <button style={stayBtn} onClick={() => setExitConfirm(false)}>
              Keep focusing
            </button>
            <button style={leaveBtn} onClick={onExit}>
              Exit
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const fc = safeCards.length > 0 ? safeCards[cardIdx % safeCards.length] : null;
  const dots = [];
  const doneInCycle = completedWork % perLong;
  for (let i = 0; i < perLong; i++) {
    const filled = phase === "long" ? true : i < doneInCycle;
    const dotStyle = {
      width: "11px",
      height: "11px",
      borderRadius: "50%",
      background: filled ? meta.color : D ? "#2c2f48" : "#dcd9ec",
      transition: "background .3s",
    };
    dots.push(<div key={i} style={dotStyle} />);
  }
  const untilLong = perLong - doneInCycle === 0 ? perLong : perLong - doneInCycle;

  return createPortal(
    <div style={overlayStyle}>
      <div style={topBar}>
        <div style={subjTag}>
          <span>{subj && subj.icon ? subj.icon : "🎯"}</span>
          <span>{(subj && subj.name) || (section && (section.title || section.name)) || "Focus session"}</span>
        </div>
        <div style={topBtns}>
          <button style={ghostBtn(showSettings, meta.color)} onClick={() => setShowSettings((v) => !v)}>
            ⚙️ Settings
          </button>
          <button style={ghostBtn(noise, "var(--riq-accent)")} onClick={toggleNoise} title="Brown noise">
            {noise ? "🔊" : "🔇"} Noise
          </button>
          <button style={exitBtn} onClick={() => setExitConfirm(true)}>
            Exit
          </button>
        </div>
      </div>

      <div style={centerCol}>
        <div style={phasePill}>{meta.label}</div>

        <div style={ringWrap}>
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r={R} fill="none" stroke={D ? "#23263c" : "#e8e5f5"} strokeWidth="12" />
            <circle
              cx="110"
              cy="110"
              r={R}
              fill="none"
              stroke={resolveVar(meta.color)}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              transform="rotate(-90 110 110)"
              style={ringCircleBase}
            />
          </svg>
          <div style={ringCenter}>
            <div style={timeText}>{fmt(secondsLeft)}</div>
            <div style={ringSub}>{running ? meta.label : "Paused"}</div>
          </div>
        </div>

        <div style={dotsRow}>
          <span style={dotsLabel}>Cycle</span>
          {dots}
        </div>

        <div style={controlsRow}>
          <button style={primaryBtn} onClick={startPause}>
            {running ? "Pause" : secondsLeft === phaseDuration(phase) ? "Start" : "Resume"}
          </button>
          <button style={secondaryBtn} onClick={resetPhase}>
            Reset
          </button>
          <button style={secondaryBtn} onClick={skipPhase}>
            Skip ⇢
          </button>
        </div>

        <div style={statsRow}>
          <div style={statBox}>
            <span style={statNum}>{completedWork}</span>
            <span style={statLbl}>Sessions</span>
          </div>
          <div style={statBox}>
            <span style={statNum}>{Math.floor(totalFocusSec / 60)}</span>
            <span style={statLbl}>Min focused</span>
          </div>
          <div style={statBox}>
            <span style={statNum}>{untilLong}</span>
            <span style={statLbl}>Until long break</span>
          </div>
        </div>

        {showSettings && (
          <div style={panel}>
            <div style={panelTitle}>Pomodoro settings</div>
            <div style={settingRow}>
              <span style={settingLbl}>Focus length</span>
              <select
                style={selectStyle}
                value={workMin}
                onChange={(e) => applySetting(setWorkMin, Number(e.target.value), phase === "work")}
              >
                {[15, 20, 25, 30, 45, 50, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
            <div style={settingRow}>
              <span style={settingLbl}>Short break</span>
              <select
                style={selectStyle}
                value={shortMin}
                onChange={(e) => applySetting(setShortMin, Number(e.target.value), phase === "short")}
              >
                {[3, 5, 8, 10].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
            <div style={settingRow}>
              <span style={settingLbl}>Long break</span>
              <select
                style={selectStyle}
                value={longMin}
                onChange={(e) => applySetting(setLongMin, Number(e.target.value), phase === "long")}
              >
                {[10, 15, 20, 30].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
            <div style={settingRow}>
              <span style={settingLbl}>Sessions before long break</span>
              <select
                style={selectStyle}
                value={perLong}
                onChange={(e) => setPerLong(Number(e.target.value))}
              >
                {[2, 3, 4, 5, 6].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div style={settingRow}>
              <span style={settingLbl}>Auto-start next phase</span>
              <button style={ghostBtn(autoStart, meta.color)} onClick={() => setAutoStart((v) => !v)}>
                {autoStart ? "On" : "Off"}
              </button>
            </div>
          </div>
        )}

        {phase === "work" && fc && (
          <div style={fcWrap}>
            <div style={fcMeta}>
              Card {(cardIdx % safeCards.length) + 1} / {safeCards.length} · tap to flip
            </div>
            <div style={fcCard} onClick={() => setFlipped((v) => !v)}>
              <div>
                <div style={fcEyebrow}>{flipped ? "Answer" : "Question"}</div>
                <div>{flipped ? stripHtml(aText(fc)) : stripHtml(qText(fc))}</div>
              </div>
            </div>
            <div style={fcNav}>
              <button
                style={fcNavBtn}
                onClick={() => {
                  setCardIdx((i) => (i - 1 + safeCards.length) % safeCards.length);
                  setFlipped(false);
                }}
              >
                ← Previous
              </button>
              <button
                style={fcNavBtn}
                onClick={() => {
                  setCardIdx((i) => (i + 1) % safeCards.length);
                  setFlipped(false);
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {phase !== "work" && (
          <div style={panel}>
            <div style={breakBox}>
              <div style={breakEmoji}>{phase === "long" ? "🌴" : "☕"}</div>
              <div style={breakTitle}>{phase === "long" ? "Long break" : "Break time"}</div>
              <div style={breakSub}>
                Step away from the screen, stretch, and hydrate. Your brain consolidates what you just
                learned while you rest.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
