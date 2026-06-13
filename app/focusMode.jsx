import React, { useState, useEffect, useRef } from "react";
import { C, mu, tx } from "./ui.jsx";

export function FocusMode({ D, cards, questions, section, subj, fcHist, onExit }) {
  const [mode, setMode] = React.useState("work");
  const [timeLeft, setTL] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);
  const [workMins, setWorkMins] = React.useState(25);
  const [noise, setNoise] = React.useState(false);
  const [cardIdx, setCI] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [exitConfirm, setExitConfirm] = React.useState(false);
  const audioCtxRef = React.useRef(null);
  const noiseNodeRef = React.useRef(null);
  const timerRef = React.useRef(null);
  React.useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setTL((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (mode === "work") {
            setMode("break");
            setTL(5 * 60);
          } else {
            setMode("work");
            setTL(workMins * 60);
          }
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, mode, workMins]);
  const toggleNoise = () => {
    if (!noise) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * 0.15;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0.3;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      audioCtxRef.current = ctx;
      noiseNodeRef.current = src;
    } else {
      try {
        noiseNodeRef.current?.stop();
        audioCtxRef.current?.close();
      } catch (_) {}
      audioCtxRef.current = null;
      noiseNodeRef.current = null;
    }
    setNoise((v) => !v);
  };
  React.useEffect(
    () => () => {
      clearInterval(timerRef.current);
      try {
        noiseNodeRef.current?.stop();
        audioCtxRef.current?.close();
      } catch (_) {}
    },
    [],
  );
  const fmtT = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerPct =
    mode === "work"
      ? (1 - timeLeft / (workMins * 60)) * 100
      : (1 - timeLeft / (5 * 60)) * 100;
  const r = 70,
    circ = 2 * Math.PI * r;
  const col = mode === "work" ? "#6366f1" : "#10b981";
  const fc = cards[Math.min(cardIdx, cards.length - 1)];

  if (exitConfirm)
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.8)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            background: D ? "#1e2537" : "#fff",
            borderRadius: 20,
            padding: 28,
            maxWidth: 340,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 18, marginBottom: 8 }}> </p>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            Exit Focus Mode?
          </p>
          <p style={{ fontSize: 13, color: mu(D), marginBottom: 18 }}>
            Your session progress will be lost.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setExitConfirm(false)}
              style={{
                flex: 1,
                padding: "10px0",
                borderRadius: 10,
                border: "1px solid#d1d5db",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Stay
            </button>
            <button
              onClick={onExit}
              style={{
                flex: 1,
                padding: "10px0",
                borderRadius: 10,
                border: "none",
                background: "#ef4444",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: D ? "#0a0d14" : "#f0f4ff",
        zIndex: 9500,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "12px20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: D ? "#e8ecf4" : "#111827",
          }}
        >
          {subj?.icon}
          {subj?.name}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={toggleNoise}
            title="Brown noise"
            style={{
              fontSize: 12,
              padding: "5px 10px",
              borderRadius: 8,
              border: `1px solid
${noise ? "#6366f1" : "#d1d5db"}`,
              background: noise ? "#6366f1" : "transparent",
              color: noise ? "#fff" : D ? "#9ca3af" : "#6b7280",
              cursor: "pointer",
            }}
          >
            {noise ? "🔊" : "🔇"} Noise
          </button>
          <button
            onClick={() => setExitConfirm(true)}
            style={{
              fontSize: 12,
              padding: "5px 12px",
              borderRadius: 8,
              border: "1px solid#d1d5db",
              background: "transparent",
              color: D ? "#9ca3af" : "#6b7280",
              cursor: "pointer",
            }}
          >
            Exit
          </button>
        </div>
      </div>
      {}
      <div style={{ marginBottom: 24, position: "relative" }}>
        <svg width={160} height={160} viewBox="0 0 160 160">
          <circle
            cx={80}
            cy={80}
            r={r}
            fill="none"
            stroke={D ? "#2a3347" : "#e5e7eb"}
            strokeWidth={8}
          />
          <circle
            cx={80}
            cy={80}
            r={r}
            fill="none"
            stroke={col}
            strokeWidth={8}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - timerPct / 100)}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
          <text
            x={80}
            y={76}
            textAnchor="middle"
            fontSize={28}
            fontWeight={800}
            fill={D ? "#e8ecf4" : "#111827"}
          >
            {fmtT(timeLeft)}
          </text>
          <text
            x={80}
            y={96}
            textAnchor="middle"
            fontSize={11}
            fill={col}
            fontWeight={600}
          >
            {mode === "work" ? "Focus" : "Break"}
          </text>
        </svg>
      </div>
      {}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        {!running ? (
          <>
            <select
              value={workMins}
              onChange={(e) => {
                setWorkMins(Number(e.target.value));
                setTL(Number(e.target.value) * 60);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid#d1d5db",
                background: D ? "#1e2537" : "#fff",
                color: D ? "#e8ecf4" : "#111827",
                fontSize: 12,
              }}
            >
              {[5, 10, 15, 25, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
            <button
              onClick={() => setRunning(true)}
              style={{
                padding: "10px24px",
                borderRadius: 12,
                border: "none",
                background: col,
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Start
            </button>
          </>
        ) : (
          <button
            onClick={() => setRunning(false)}
            style={{
              padding: "10px24px",
              borderRadius: 12,
              border: "none",
              background: "#f59e0b",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Pause
          </button>
        )}
      </div>

      {}
      {mode === "work" && fc && (
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: mu(D),
              textAlign: "center",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Card {Math.min(cardIdx, cards.length - 1) + 1} / {cards.length} ·
            {flipped ? "Answer" : "Question"}
          </div>
          <div
            onClick={() => setFlipped((v) => !v)}
            style={{
              ...C(D),
              padding: 32,
              textAlign: "center",
              cursor: "pointer",
              minHeight: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderColor: flipped ? "#6366f1" : undefined,
            }}
          >
            <div
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                fontWeight: flipped ? 600 : 400,
                color: flipped ? "#6366f1" : tx(D),
              }}
            >
              {flipped ? fc.a || fc.back || "" : fc.q || fc.front || ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={() => {
                setCI((i) => (i > 0 ? i - 1 : cards.length - 1));
                setFlipped(false);
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: "1px solid#d1d5db",
                background: "transparent",
                color: mu(D),
                cursor: "pointer",
                fontSize: 13,
              }}
            ></button>
            <button
              onClick={() => {
                setCI((i) => (i + 1) % cards.length);
                setFlipped(false);
              }}
              style={{
                flex: 1,
                padding: "10px0",
                borderRadius: 10,
                border: "none",
                background: "#6366f1",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            ></button>
          </div>
        </div>
      )}
      {mode === "break" && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}> </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: D ? "#e8ecf4" : "#111827",
              marginBottom: 4,
            }}
          >
            Break time!
          </p>
          <p style={{ fontSize: 13, color: mu(D) }}>
            Step away, breathe, hydrate. Your brain is consolidating.
          </p>
        </div>
      )}
    </div>
  );
}
