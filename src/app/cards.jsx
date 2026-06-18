import React, { useState, useEffect } from "react";
import { stripHtml } from "./ui.jsx";
import { themeAccent } from "./themes.js";

export function _cleanText(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

export function _clozeLooseMatch(correct, input) {
  const a = _cleanText(correct),
    b = _cleanText(input);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.replace(/s$/, "") === b.replace(/s$/, "")) return true;
  return a.includes(b) || b.includes(a);
}

export function parseClozeText(text) {
  const parts = [];
  let i = 0;
  let bi = 0;
  const src = String(text || "");
  while (i < src.length) {
    const s = src.indexOf("{{", i);
    if (s === -1) {
      parts.push({ type: "text", value: src.slice(i) });
      break;
    }
    if (s > i) parts.push({ type: "text", value: src.slice(i, s) });
    const e = src.indexOf("}}", s + 2);
    if (e === -1) {
      parts.push({ type: "text", value: src.slice(s) });
      break;
    }
    const ans = src.slice(s + 2, e).trim();
    parts.push({ type: "blank", answer: ans, index: bi++ });
    i = e + 2;
  }
  return parts;
}

export function ClozeCard({ card, D, onSubmit, DiagramRendererComp }) {
  const parts = React.useMemo(
    () => parseClozeText(card?.text || card?.q || ""),
    [card?.text, card?.q],
  );
  const blanks = React.useMemo(
    () => parts.filter((p) => p.type === "blank"),
    [parts],
  );
  const [vals, setVals] = React.useState(function () {
    const obj = {};
    blanks.forEach(function (b) {
      obj[b.index] = "";
    });
    return obj;
  });
  const [result, setResult] = React.useState(null);
  React.useEffect(() => {
    const obj = {};
    blanks.forEach(function (b) {
      obj[b.index] = "";
    });
    setVals(obj);
    setResult(null);
  }, [card?.id, blanks.length]);
  const submit = async () => {
    const rows = blanks.map(function (b) {
      const user = (vals[b.index] || "").trim();
      const correct = (b.answer || "").trim();
      const exact = _cleanText(user) === _cleanText(correct);
      return { user, correct, ok: exact || _clozeLooseMatch(correct, user) };
    });
    const allCorrect = rows.every((r) => r.ok);
    const score = rows.length
      ? Math.round((rows.filter((r) => r.ok).length / rows.length) * 100)
      : 0;
    const out = { allCorrect, score, rows };
    setResult(out);
    if (onSubmit) onSubmit(out);
  };
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1.5px solid ${D ? "#374151" : "#e5e7eb"}`,
        padding: 16,
        background: D ? "#13131f" : "#fff",
      }}
    >
      {card?.diagram && (
        <div style={{ marginBottom: 10 }}>
          <DiagramRendererComp diagram={card.diagram} D={D} width={420} />
        </div>
      )}
      <div
        style={{
          lineHeight: 2,
          fontSize: 15,
          color: D ? "#e5e7eb" : "#111827",
        }}
      >
        {parts.map(function (p, idx) {
          if (p.type === "text") return <span key={idx}>{p.value}</span>;
          return (
            <input
              key={idx}
              value={vals[p.index] || ""}
              onChange={(e) =>
                setVals((v) => ({ ...v, [p.index]: e.target.value }))
              }
              style={{
                display: "inline-block",
                minWidth: 120,
                padding: "4px 8px",
                margin: "05px",
                borderRadius: 8,
                border: `1.5px solid ${D ? "#4b5563" : "#cbd5e1"}`,
                background: D ? "#0a0a14" : "#f8fafc",
                color: D ? "#fff" : "#111",
              }}
            />
          );
        })}
      </div>
      <button
        onClick={submit}
        style={{
          marginTop: 12,
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          background: "var(--riq-accent)",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Check answers
      </button>
      {result && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: result.allCorrect ? "#16a34a" : "#d97706",
          }}
        >
          {result.allCorrect ? "✓ All correct" : "Score: " + result.score + "%"}
        </div>
      )}
    </div>
  );
}

export function SequenceCard({ card, D, onSubmit }) {
  const base = React.useMemo(
    () => (Array.isArray(card?.items) ? card.items.filter(Boolean) : []),
    [card?.items],
  );
  const [order, setOrder] = React.useState([]);
  const [dragIdx, setDragIdx] = React.useState(null);
  const [result, setResult] = React.useState(null);
  React.useEffect(() => {
    const arr = [...base].sort(() => Math.random() - 0.5);
    setOrder(arr);
    setResult(null);
    setDragIdx(null);
  }, [card?.id, base.join("|")]);
  const onDropAt = (idx) => {
    if (dragIdx === null || dragIdx === idx) return;
    setOrder((prev) => {
      const n = [...prev];
      const [m] = n.splice(dragIdx, 1);
      n.splice(idx, 0, m);
      return n;
    });
    setDragIdx(null);
  };
  const grade = () => {
    const correctPositions = order.reduce(
      (a, it, i) => a + (it === base[i] ? 1 : 0),
      0,
    );
    const score = base.length ? correctPositions / base.length : 0;
    const status =
      score === 1 ? "correct" : score >= 0.5 ? "partial" : "incorrect";
    const out = { status, score, correctPositions, total: base.length };
    setResult(out);
    if (onSubmit) onSubmit(out);
  };
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1.5px solid ${D ? "#374151" : "#e5e7eb"}`,
        padding: 16,
        background: D ? "#13131f" : "#fff",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {order.map(function (it, idx) {
          return (
            <div
              key={it + "-" + idx}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropAt(idx)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${D ? "#4b5563" : "#d1d5db"}`,
                background: D ? "#0a0a14" : "#f9fafb",
                cursor: "grab",
              }}
            >
              {it}
            </div>
          );
        })}
      </div>
      <button
        onClick={grade}
        style={{
          marginTop: 12,
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          background: "var(--riq-accent)",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Check order
      </button>
      {result && (
        <div style={{ marginTop: 10, fontSize: 12 }}>
          <div
            style={{
              fontWeight: 700,
              color:
                result.status === "correct"
                  ? "#16a34a"
                  : result.status === "partial"
                    ? "#d97706"
                    : "#dc2626",
            }}
          >
            {result.status.toUpperCase()} · {Math.round(result.score * 100)}%
          </div>
          <div style={{ marginTop: 6, color: D ? "#cbd5e1" : "#374151" }}>
            {base
              .map(function (x, i) {
                return i + 1 + ". " + x;
              })
              .join(" → ")}
          </div>
        </div>
      )}
    </div>
  );
}

export function QuestionFigure({ figure, D, figureNumber = 1, DiagramRendererComp }) {
  if (!figure) return null;
  const w = figure.data?.width || 520,
    h = figure.data?.height || 220,
    pad = 28;
  const pts = Array.isArray(figure.data?.points) ? figure.data.points : [];
  const minX = Math.min(...pts.map((p) => Number(p.x) || 0), 0),
    maxX = Math.max(...pts.map((p) => Number(p.x) || 0), 1);
  const minY = Math.min(...pts.map((p) => Number(p.y) || 0), 0),
    maxY = Math.max(...pts.map((p) => Number(p.y) || 0), 1);
  const sx = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2),
    sy = (y) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - pad * 2);
  const chart = (function () {
    if (figure.type === "photo")
      return (
        <img
          src={figure.data?.src || ""}
          alt={figure.caption || "figure"}
          style={{ maxWidth: "100%", borderRadius: 10 }}
        />
      );
    if (figure.type === "table")
      return (
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
        >
          <thead>
            <tr>
              {(figure.data?.headers || []).map((h2, i) => (
                <th
                  key={i}
                  style={{
                    border: "1px solid #cbd5e1",
                    padding: 6,
                    background: D ? "#0a0a14" : "#f8fafc",
                  }}
                >
                  {h2}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(figure.data?.rows || []).map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    style={{ border: "1px solid #cbd5e1", padding: 6 }}
                  >
                    {String(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    if (figure.type === "svg" && figure.data)
      return <DiagramRendererComp diagram={figure.data} D={D} width={520} />;
    if (figure.type === "bar") {
      const bars = Array.isArray(figure.data?.bars) ? figure.data.bars : [];
      const m = Math.max(...bars.map((b) => Number(b.value) || 0), 1);
      return (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          style={{ width: "100%", height: "auto" }}
        >
          {bars.map((b, i) => {
            const bw = (w - pad * 2) / Math.max(bars.length, 1) - 8;
            const x = pad + i * (bw + 8);
            const hh = ((Number(b.value) || 0) / m) * (h - pad * 2);
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={h - pad - hh}
                  width={bw}
                  height={hh}
                  fill={themeAccent()}
                />
                <text
                  x={x + bw / 2}
                  y={h - pad + 14}
                  textAnchor="middle"
                  fontSize="10"
                >
                  {b.label || i + 1}
                </text>
              </g>
            );
          })}
          <line
            x1={pad}
            y1={h - pad}
            x2={w - pad}
            y2={h - pad}
            stroke="#94a3b8"
          />
        </svg>
      );
    }
    if (figure.type === "line") {
      const lp = Array.isArray(figure.data?.points) ? figure.data.points : [];
      const d = lp
        .map(
          (p, i) =>
            (i ? "L" : "M") + sx(Number(p.x) || 0) + " " + sy(Number(p.y) || 0),
        )
        .join(" ");
      return (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          style={{ width: "100%", height: "auto" }}
        >
          <line
            x1={pad}
            y1={h - pad}
            x2={w - pad}
            y2={h - pad}
            stroke="#94a3b8"
          />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#94a3b8" />
          <path d={d} fill="none" stroke={themeAccent()} strokeWidth="2" />
        </svg>
      );
    }
    if (figure.type === "scatter") {
      const ps = pts;
      return (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          style={{ width: "100%", height: "auto" }}
        >
          <line
            x1={pad}
            y1={h - pad}
            x2={w - pad}
            y2={h - pad}
            stroke="#94a3b8"
          />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#94a3b8" />
          {ps.map((p, i) => (
            <circle
              key={i}
              cx={sx(Number(p.x) || 0)}
              cy={sy(Number(p.y) || 0)}
              r="4"
              fill={p.anomaly ? "#ef4444" : themeAccent()}
            />
          ))}
        </svg>
      );
    }
    return null;
  })();
  return (
    <div
      style={{
        marginBottom: 12,
        padding: 10,
        borderRadius: 10,
        border: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
        background: D ? "#111827" : "#fff",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
        Figure {figureNumber}:{figure.caption || "Untitled"}
      </div>
      {chart}
      {figure.source && (
        <div
          style={{
            fontSize: 11,
            color: D ? "#9ca3af" : "#6b7280",
            marginTop: 6,
          }}
        >
          Source: {figure.source}
        </div>
      )}
    </div>
  );
}

export function generateWhyPrompt(card) {
  if (
    typeof window !== "undefined" &&
    typeof window.generateWhyPrompt === "function"
  ) {
    try {
      return window.generateWhyPrompt(card);
    } catch (_) {}
  }
  var src = stripHtml(card?.a || card?.text || card?.q || "");
  var key =
    src.split(/\s+/).filter(Boolean).slice(0, 4).join(" ") || "this concept";
  return "Why is " + key + " important?";
}
