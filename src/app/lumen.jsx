import React from "react";

/* ============================================================
   Lumen — signature presentational components.
   Pure, prop-driven, dependency-free (SVG + inline styles).
   All inline styles are named const objects (single-brace) to
   stay robust; referenced as style={name}.
   ============================================================ */

const GRAD_FROM = "#5b54f0";
const GRAD_MID = "#8b5cf6";
const GRAD_TO = "#d946ef";

const txc = (D) => (D ? "#eef1fb" : "#0a0a14");
const muc = (D) => (D ? "#98a2bd" : "#5b6478");
const hairline = (D) => (D ? "rgba(255,255,255,.07)" : "rgba(16,24,40,.06)");

/* Big display figure (e.g. a streak count or accuracy %). */
export function Figure({ children, size = 40, D, gradient = false }) {
  const st = { fontSize: size, lineHeight: 1, color: gradient ? undefined : txc(D) };
  return (
    <span className={"riq-figure" + (gradient ? " riq-gradient-text" : "")} style={st}>
      {children}
    </span>
  );
}

/* A circular progress ring with a centred label. value: 0..1 */
export function Ring({ value = 0, size = 96, stroke = 10, color = "gradient", label, sub, D }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const id = "rg" + Math.round(v * 1000) + "_" + size;
  const wrap = { position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" };
  const svgSt = { transform: "rotate(-90deg)" };
  const prog = { transition: "stroke-dashoffset .9s var(--riq-ease, ease)" };
  const center = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 };
  const labelSt = { fontSize: size * 0.26, color: txc(D) };
  const subSt = { fontSize: 11, color: muc(D), fontWeight: 600 };
  const trackColor = D ? "rgba(255,255,255,.08)" : "rgba(16,24,40,.08)";
  const strokeColor = color === "gradient" ? `url(#${id})` : color;
  return (
    <div style={wrap}>
      <svg width={size} height={size} style={svgSt}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={GRAD_FROM} />
            <stop offset="60%" stopColor={GRAD_MID} />
            <stop offset="100%" stopColor={GRAD_TO} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={strokeColor} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - v)} style={prog} />
      </svg>
      <div style={center}>
        {label != null ? <span className="riq-figure" style={labelSt}>{label}</span> : null}
        {sub != null ? <span style={subSt}>{sub}</span> : null}
      </div>
    </div>
  );
}

/* A compact stat tile with icon, big figure and caption. */
export function StatTile({ icon, figure, caption, accent = GRAD_MID, D }) {
  const card = { padding: "16px 18px", borderRadius: 18, background: D ? "rgba(255,255,255,.04)" : "#fff", border: `1px solid ${hairline(D)}`, display: "flex", flexDirection: "column", gap: 8 };
  const row = { display: "flex", alignItems: "center", justifyContent: "space-between" };
  const ic = { fontSize: 22 };
  const dot = { width: 8, height: 8, borderRadius: 999, background: accent, boxShadow: `0 0 10px ${accent}` };
  const figSt = { fontSize: 30, color: txc(D) };
  const capSt = { fontSize: 12.5, color: muc(D), fontWeight: 600 };
  return (
    <div className="riq-lift" style={card}>
      <div style={row}>
        <span style={ic}>{icon}</span>
        <span style={dot} />
      </div>
      <span className="riq-figure" style={figSt}>{figure}</span>
      <span style={capSt}>{caption}</span>
    </div>
  );
}

/* ---- Signature: the Calibration Dial ----
   value 0..1 where 1 = perfectly calibrated.
   bias < 0 = under-confident, bias > 0 = over-confident. */
export function CalibrationDial({ value = 0.5, bias = 0, size = 220, D }) {
  const v = Math.max(0, Math.min(1, value));
  const cx = size / 2, cy = size / 2, r = size * 0.4;
  const ang = Math.PI + Math.PI * v;
  const nx = cx + r * Math.cos(ang), ny = cy + r * Math.sin(ang);
  const arc = (a0, a1) => {
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const pct = Math.round(v * 100);
  const verdict = Math.abs(bias) < 0.06 ? "Well calibrated" : bias > 0 ? "Slightly over-confident" : "Slightly under-confident";
  const wrap = { display: "flex", flexDirection: "column", alignItems: "center" };
  const trackColor = D ? "rgba(255,255,255,.08)" : "rgba(16,24,40,.08)";
  const arcSt = { transition: "d .9s var(--riq-ease, ease)" };
  const needleSt = { transition: "all .9s var(--riq-ease, ease)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.25))" };
  const ctr = { marginTop: -size * 0.16, textAlign: "center" };
  const pctSt = { fontSize: 34, color: txc(D) };
  const verdictSt = { fontSize: 13, color: muc(D), fontWeight: 700, marginTop: 2 };
  return (
    <div style={wrap}>
      <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
        <defs>
          <linearGradient id="caldial" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor={GRAD_MID} />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path d={arc(Math.PI, 2 * Math.PI)} fill="none" stroke={trackColor} strokeWidth={14} strokeLinecap="round" />
        <path d={arc(Math.PI, ang)} fill="none" stroke="url(#caldial)" strokeWidth={14} strokeLinecap="round" style={arcSt} />
        <circle cx={nx} cy={ny} r={9} fill="#fff" stroke={GRAD_MID} strokeWidth={3} style={needleSt} />
      </svg>
      <div style={ctr}>
        <div className="riq-figure" style={pctSt}>{pct}%</div>
        <div style={verdictSt}>{verdict}</div>
      </div>
    </div>
  );
}

/* ---- Signature: the Mastery Constellation ----
   topics: [{ id, name, retention(0..1), size(0..1) }] */
export function MasteryConstellation({ topics = [], width = 520, height = 320, D, onSelect }) {
  const nodes = topics.map((t, i) => {
    const seed = (i * 137.508) % 360;
    const ring = 0.32 + ((i % 3) * 0.2);
    const a = (seed * Math.PI) / 180;
    const x = width / 2 + Math.cos(a) * width * 0.36 * ring + (((i * 53) % 40) - 20);
    const y = height / 2 + Math.sin(a) * height * 0.4 * ring + (((i * 31) % 36) - 18);
    const ret = Math.max(0, Math.min(1, t.retention == null ? 0.5 : t.retention));
    const rad = 5 + (t.size == null ? 0.5 : t.size) * 9;
    return { id: t.id, name: t.name, x, y, ret, rad };
  });
  const col = (ret) => (ret > 0.75 ? GRAD_MID : ret > 0.45 ? "#8b8ff0" : "#f59e0b");
  const lineColor = D ? "rgba(255,255,255,.06)" : "rgba(16,24,40,.06)";
  const svgSt = { display: "block", overflow: "visible" };
  const labelSt = { pointerEvents: "none" };
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={svgSt}>
      {nodes.map((n, i) => (i > 0 ? (
        <line key={"l" + i} x1={nodes[i - 1].x} y1={nodes[i - 1].y} x2={n.x} y2={n.y} stroke={lineColor} strokeWidth={1} />
      ) : null))}
      {nodes.map((n) => {
        const gSt = { cursor: onSelect ? "pointer" : "default" };
        const coreSt = { filter: `drop-shadow(0 0 ${4 + n.ret * 10}px ${col(n.ret)})` };
        return (
          <g key={n.id} style={gSt} onClick={onSelect ? () => onSelect(n) : undefined}>
            <circle cx={n.x} cy={n.y} r={n.rad + 8} fill={col(n.ret)} opacity={0.18 * n.ret} />
            <circle cx={n.x} cy={n.y} r={n.rad} fill={col(n.ret)} opacity={0.35 + n.ret * 0.65} style={coreSt} />
            <text x={n.x} y={n.y + n.rad + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill={muc(D)} style={labelSt}>{n.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---- Session Recap card ---- */
export function SessionRecap({ minutes, reviewed, strengthened = [], shaky = [], nextNudge, D }) {
  const card = { padding: 24, borderRadius: 22, background: D ? "rgba(32,36,56,.7)" : "#fff", border: `1px solid ${D ? "rgba(255,255,255,.08)" : "rgba(16,24,40,.06)"}`, boxShadow: "0 26px 60px -34px rgba(16,24,40,.4)" };
  const title = { fontSize: 13, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: muc(D) };
  const figRow = { display: "flex", gap: 28, marginTop: 10 };
  const fig = { fontSize: 30, color: txc(D) };
  const unit = { fontSize: 16, color: muc(D), marginLeft: 2 };
  const cap = { fontSize: 12.5, color: muc(D), fontWeight: 600, marginTop: 2 };
  const block = { marginTop: 16 };
  const goodLbl = { fontSize: 12.5, fontWeight: 800, color: "#22c55e" };
  const warnLbl = { fontSize: 12.5, fontWeight: 800, color: "#f59e0b" };
  const listText = { fontSize: 14, color: txc(D), marginTop: 4 };
  const nudge = { marginTop: 18, padding: "12px 14px", borderRadius: 14, background: D ? "rgba(139,92,246,.14)" : "rgba(139,92,246,.08)", color: txc(D), fontSize: 14, fontWeight: 600 };
  return (
    <div className="riq-pop" style={card}>
      <div style={title}>Session recap</div>
      <div style={figRow}>
        <div>
          <div className="riq-figure" style={fig}>{minutes}<span style={unit}>m</span></div>
          <div style={cap}>focused</div>
        </div>
        <div>
          <div className="riq-figure" style={fig}>{reviewed}</div>
          <div style={cap}>reviewed</div>
        </div>
      </div>
      {strengthened.length > 0 ? (
        <div style={block}>
          <span style={goodLbl}>✨ Strengthened</span>
          <div style={listText}>{strengthened.join(", ")}</div>
        </div>
      ) : null}
      {shaky.length > 0 ? (
        <div style={block}>
          <span style={warnLbl}>⚠️ Still shaky</span>
          <div style={listText}>{shaky.join(", ")}</div>
        </div>
      ) : null}
      {nextNudge ? <div style={nudge}>🎯 {nextNudge}</div> : null}
    </div>
  );
}
