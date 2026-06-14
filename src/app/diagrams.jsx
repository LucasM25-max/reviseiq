import React, { useState, useEffect, useRef } from "react";
import { SK_GRAPH, SK_SVG_ASSETS } from "./coreHelpers.js";
import { QuestionFigure } from "./cards.jsx";
import { C, I, mu, uid } from "./ui.jsx";

export function useAttentionLayer() {
  const [activeId, setActiveId] = React.useState(null);

  const [pulsing, setPulsing] = React.useState(null);
  const props = (id) => ({
    onMouseEnter: () => {
      setActiveId(id);
      setPulsing(id);
      setTimeout(() => setPulsing(null), 300);
    },
    onMouseLeave: () => setActiveId(null),
    onClick: () => {
      setActiveId((v) => (v === id ? null : id));
      setPulsing(id);
      setTimeout(() => setPulsing(null), 300);
    },
    style: {
      opacity: activeId === null || activeId === id ? 1 : 0.45,
      transition: "opacity .18s ease",
      cursor: "pointer",
    },
  });
  const isActive = (id) => activeId === id;
  const isPulsing = (id) => pulsing === id;
  return { activeId, props, isActive, isPulsing };
}

export function ProcessFlowDiagram({
  steps = [],
  accent = "#059669",
  D = false,
  width = 600,
}) {
  const { props: attn, isActive, isPulsing } = useAttentionLayer();
  const stepW = 110,
    stepH = 54,
    arrowW = 28,
    gap = arrowW;
  const perRow = Math.max(1, Math.floor(width / (stepW + gap)));
  const rows = [];
  for (let i = 0; i < steps.length; i += perRow)
    rows.push(steps.slice(i, i + perRow));
  const svgH = rows.length * (stepH + 40) + 20;
  const bg = D ? "#13131f" : "#fff";
  const textCol = D ? "#e8ecf4" : "#111827";
  const subCol = D ? "#8896b3" : "#6b7280";
  return (
    <svg
      viewBox={`0 0 ${width} ${svgH}`}
      width="100%"
      style={{ display: "block", maxWidth: width }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Process flow diagram"
    >
      <rect width={width} height={svgH} fill={bg} rx="8" />
      <defs>
        <marker
          id="arrow-proc"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={accent} />
        </marker>
      </defs>
      {rows.map((row, ri) => {
        const rowY = ri * (stepH + 40) + 20;
        const reversed = ri % 2 === 1;
        const displayRow = reversed ? [...row].reverse() : row;
        const totalRowW =
          displayRow.length * stepW + (displayRow.length - 1) * gap;
        const startX = (width - totalRowW) / 2;
        return (
          <g key={ri}>
            {displayRow.map((step, si) => {
              const x = startX + si * (stepW + gap);
              const stepAccent = step.color || accent;
              const sid = step.id || String(ri * 100 + si);
              const active = isActive(sid);
              const pulse = isPulsing(sid);
              return (
                <g key={sid} {...attn(sid)}>
                  <rect
                    x={x}
                    y={rowY}
                    width={stepW}
                    height={stepH}
                    rx="8"
                    fill={
                      active
                        ? stepAccent + "55"
                        : stepAccent + (D ? "22" : "18")
                    }
                    stroke={stepAccent}
                    strokeWidth="1.5"
                    style={{
                      transform: pulse ? "scale(1.04)" : "scale(1)",
                      transition: "transform .15sease",
                      transformOrigin: `${x + stepW / 2}px ${rowY + stepH / 2}px`,
                    }}
                  />
                  <text
                    x={x + stepW / 2}
                    y={rowY + (step.sublabel ? stepH / 2 - 4 : stepH / 2 + 5)}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={textCol}
                    fontFamily="Arial,sans-serif"
                    style={{ userSelect: "none" }}
                  >
                    {step.label}
                  </text>
                  {step.sublabel && (
                    <text
                      x={x + stepW / 2}
                      y={rowY + stepH / 2 + 12}
                      textAnchor="middle"
                      fontSize="9"
                      fill={subCol}
                      fontFamily="Arial,sans-serif"
                      style={{ userSelect: "none" }}
                    >
                      {step.sublabel}
                    </text>
                  )}
                  {si < displayRow.length - 1 && (
                    <line
                      x1={x + stepW + 2}
                      y1={rowY + stepH / 2}
                      x2={x + stepW + gap - 2}
                      y2={rowY + stepH / 2}
                      stroke={accent}
                      strokeWidth="1.5"
                      markerEnd="url(#arrow-proc)"
                    />
                  )}
                </g>
              );
            })}
            {ri < rows.length - 1 && (
              <line
                x1={
                  reversed
                    ? startX + stepW / 2
                    : startX + (row.length - 1) * (stepW + gap) + stepW / 2
                }
                y1={rowY + stepH}
                x2={
                  reversed
                    ? startX + stepW / 2
                    : startX + (row.length - 1) * (stepW + gap) + stepW / 2
                }
                y2={rowY + stepH + 30}
                stroke={accent}
                strokeWidth="1.5"
                markerEnd="url(#arrow-proc)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function CycleDiagram({
  steps = [],
  accent = "#059669",
  D = false,
  size = 320,
}) {
  const { props: attn, isActive, isPulsing } = useAttentionLayer();
  const cx = size / 2,
    cy = size / 2,
    r = size * 0.33,
    nodeR = size * 0.095,
    n = steps.length;
  const bg = D ? "#13131f" : "#fff";
  const textCol = D ? "#e8ecf4" : "#111827";
  const subCol = D ? "#8896b3" : "#6b7280";
  const positions = steps.map((_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle };
  });
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ display: "block", maxWidth: size }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Cycle diagram"
    >
      <rect width={size} height={size} fill={bg} rx="8" />
      <defs>
        <marker
          id="arrow-cyc"
          markerWidth="7"
          markerHeight="5"
          refX="6"
          refY="2.5"
          orient="auto"
        >
          <polygon points="0 0, 7 2.5, 0 5" fill={accent} />
        </marker>
      </defs>
      {positions.map((pos, i) => {
        const next = positions[(i + 1) % n];
        const stepAccent = steps[i].color || accent;
        const sid = steps[i].id || String(i);
        const active = isActive(sid);
        const pulse = isPulsing(sid);
        const dx = next.x - pos.x,
          dy = next.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / dist,
          uy = dy / dist;
        const x1 = pos.x + ux * (nodeR + 2),
          y1 = pos.y + uy * (nodeR + 2);
        const x2 = next.x - ux * (nodeR + 8),
          y2 = next.y - uy * (nodeR + 8);
        const midX = (x1 + x2) / 2 - uy * 18,
          midY = (y1 + y2) / 2 + ux * 18;
        return (
          <g key={sid}>
            <path
              d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              fill="none"
              stroke={accent}
              strokeWidth="1.5"
              markerEnd="url(#arrow-cyc)"
            />
            <g {...attn(sid)}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={active ? nodeR * 1.12 : nodeR}
                fill={stepAccent + (D ? "28" : "20")}
                stroke={stepAccent}
                strokeWidth="1.5"
                style={{ transition: "r .15s ease" }}
              />
              <text
                x={pos.x}
                y={pos.y + (steps[i].sublabel ? -3 : 4)}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill={textCol}
                fontFamily="Arial,sans-serif"
                style={{ userSelect: "none" }}
              >
                {steps[i].label}
              </text>
              {steps[i].sublabel && (
                <text
                  x={pos.x}
                  y={pos.y + 11}
                  textAnchor="middle"
                  fontSize="8"
                  fill={subCol}
                  fontFamily="Arial,sans-serif"
                  style={{ userSelect: "none" }}
                >
                  {steps[i].sublabel}
                </text>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export function HierarchyTree({
  root = null,
  accent = "#0891B2",
  D = false,
  width = 560,
}) {
  const { props: attn, isActive } = useAttentionLayer();
  if (!root) return null;
  const bg = D ? "#13131f" : "#fff";
  const textCol = D ? "#e8ecf4" : "#111827";
  const nodeW = 100,
    nodeH = 36,
    levelGap = 60;
  function countLeaves(node) {
    if (!node.children || !node.children.length) return 1;
    return node.children.reduce((s, c) => s + countLeaves(c), 0);
  }
  function buildLayout(node, depth, xOffset) {
    const leaves = countLeaves(node);
    const nodeX =
      xOffset + (leaves * nodeW + (leaves - 1) * 12) / 2 - nodeW / 2;
    const nodeY = depth * (nodeH + levelGap) + 20;
    const result = [{ node, x: nodeX, y: nodeY, depth }];
    if (node.children) {
      let childX = xOffset;
      node.children.forEach((child) => {
        const childLeaves = countLeaves(child);
        result.push(...buildLayout(child, depth + 1, childX));
        childX += childLeaves * nodeW + (childLeaves - 1) * 12 + 16;
      });
    }
    return result;
  }
  const allNodes = buildLayout(root, 0, 0);
  const maxX = Math.max(...allNodes.map((n) => n.x + nodeW));
  const svgH =
    (Math.max(...allNodes.map((n) => n.depth)) + 1) * (nodeH + levelGap) + 40;
  const scale = maxX > width - 20 ? (width - 20) / maxX : 1;
  return (
    <svg
      viewBox={`0 0 ${width} ${svgH * scale}`}
      width="100%"
      style={{ display: "block", maxWidth: width }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Hierarchy diagram"
    >
      <rect width={width} height={svgH * scale} fill={bg} rx="8" />
      <defs>
        <filter id="node-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>
      <g transform={`scale(${scale})`}>
        {allNodes.map(({ node, x, y, depth }, i) => {
          const nodeAccent = node.color || accent;
          const sid = node.label + String(i);
          const active = isActive(sid);
          const parentNode = allNodes.find(
            (p) =>
              p.node.children &&
              p.node.children.includes(node) &&
              p.depth === depth - 1,
          );
          return (
            <g key={i}>
              {parentNode && (
                <line
                  x1={parentNode.x + nodeW / 2}
                  y1={parentNode.y + nodeH}
                  x2={x + nodeW / 2}
                  y2={y}
                  stroke={nodeAccent}
                  strokeWidth="1.2"
                  strokeDasharray={depth > 1 ? "4,2" : ""}
                  opacity="0.7"
                />
              )}
              <g {...attn(sid)}>
                <rect
                  x={x}
                  y={y}
                  width={nodeW}
                  height={nodeH}
                  rx="6"
                  fill={
                    active ? nodeAccent + "44" : nodeAccent + (D ? "22" : "18")
                  }
                  stroke={nodeAccent}
                  strokeWidth="1.5"
                  filter={active ? "url(#node-shadow)" : undefined}
                />
                <text
                  x={x + nodeW / 2}
                  y={y + nodeH / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={textCol}
                  fontFamily="Arial,sans-serif"
                  style={{ userSelect: "none" }}
                >
                  {node.label}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function ComparisonGrid({
  rows = [],
  columns = [],
  data = {},
  accent = "#7C3AED",
  D = false,
}) {
  const cellW = 90,
    cellH = 38,
    labelW = 120,
    headerH = 42;
  const gridW = labelW + columns.length * cellW + 2;
  const gridH = headerH + rows.length * cellH + 2;
  const bg = D ? "#13131f" : "#fff";
  const hdrBg = D ? accent + "33" : accent + "18";
  const textCol = D ? "#e8ecf4" : "#111827";
  const subCol = D ? "#8896b3" : "#6b7280";
  const borderCol = D ? "#262844" : "#e2e8f0";
  return (
    <svg
      viewBox={`0 0 ${gridW} ${gridH}`}
      width="100%"
      style={{ display: "block", maxWidth: gridW }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Comparison grid"
    >
      <rect
        width={gridW}
        height={gridH}
        fill={bg}
        rx="8"
        stroke={borderCol}
        strokeWidth="1"
      />
      <rect x={0} y={0} width={labelW} height={headerH} fill={hdrBg} />
      {columns.map((col, ci) => (
        <g key={col.id}>
          <rect
            x={labelW + ci * cellW}
            y={0}
            width={cellW}
            height={headerH}
            fill={hdrBg}
          />
          <line
            x1={labelW + ci * cellW}
            y1={0}
            x2={labelW + ci * cellW}
            y2={gridH}
            stroke={borderCol}
            strokeWidth="1"
          />
          <text
            x={labelW + ci * cellW + cellW / 2}
            y={headerH / 2 + 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill={textCol}
            fontFamily="Arial,sans-serif"
            style={{ userSelect: "none" }}
          >
            {col.label}
          </text>
        </g>
      ))}
      {rows.map((row, ri) => {
        const y = headerH + ri * cellH;
        return (
          <g key={row.id}>
            <line
              x1={0}
              y1={y}
              x2={gridW}
              y2={y}
              stroke={borderCol}
              strokeWidth="1"
            />
            <rect
              x={0}
              y={y}
              width={labelW}
              height={cellH}
              fill={
                ri % 2 === 0
                  ? bg
                  : D
                    ? "rgba(255,255,255,.02)"
                    : "rgba(0,0,0,.015)"
              }
            />
            <text
              x={8}
              y={y + cellH / 2 + 4}
              fontSize="10"
              fontWeight="600"
              fill={textCol}
              fontFamily="Arial,sans-serif"
              style={{ userSelect: "none" }}
            >
              {row.label}
            </text>
            {columns.map((col, ci) => {
              const val = data[`${row.id}:${col.id}`];
              let symbol = "—",
                symCol = subCol;
              if (val === true || val === "yes") {
                symbol = "✓";
                symCol = "#059669";
              } else if (val === false || val === "no") {
                symbol = "✗";
                symCol = "#DC2626";
              } else if (val === "partial") {
                symbol = "◑";
                symCol = "#D97706";
              } else if (typeof val === "string" && val) {
                symbol = val;
                symCol = textCol;
              }
              return (
                <g key={col.id}>
                  <rect
                    x={labelW + ci * cellW}
                    y={y}
                    width={cellW}
                    height={cellH}
                    fill={
                      ri % 2 === 0
                        ? bg
                        : D
                          ? "rgba(255,255,255,.02)"
                          : "rgba(0,0,0,.015)"
                    }
                  />
                  <text
                    x={labelW + ci * cellW + cellW / 2}
                    y={y + cellH / 2 + 4}
                    textAnchor="middle"
                    fontSize={
                      typeof val === "string" && val.length > 2 ? "9" : "12"
                    }
                    fontWeight="600"
                    fill={symCol}
                    fontFamily="Arial,sans-serif"
                    style={{ userSelect: "none" }}
                  >
                    {symbol}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export function LabelledStructure({
  imageUrl = null,
  labels = [],
  accent = "#0891B2",
  D = false,
  width = 520,
  selfTestMode = false,
  onAllCorrect = null,
}) {
  const [revealed, setRevealed] = React.useState({});
  const [inputs, setInputs] = React.useState({});
  const [hoveredId, setHoveredId] = React.useState(null);
  const imgH = width * 0.65;
  const handleInput = (id, value) => {
    const next = { ...inputs, [id]: value };

    setInputs(next);
    const correct = labels.find((l) => l.id === id);
    if (correct && value.trim().toLowerCase() === correct.label.toLowerCase())
      setRevealed((r) => ({ ...r, [id]: true }));
    if (
      onAllCorrect &&
      labels.every(
        (l) => next[l.id]?.trim().toLowerCase() === l.label.toLowerCase(),
      )
    )
      onAllCorrect();
  };
  if (!imageUrl && !labels.length) return null;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: width,
        userSelect: "none",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="diagram"
          style={{
            width: "100%",
            display: "block",
            borderRadius: 8,
            border: `1px solid ${D ? "#262844" : "#e5e7eb"}`,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: imgH,
            borderRadius: 8,
            background: D ? "#191a2b" : "#f3f4f6",
            border: `1.
5px dashed ${D ? "#374151" : "#d1d5db"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 12, color: D ? "#8896b3" : "#9ca3af" }}>
            Diagram placeholder
          </span>
        </div>
      )}
      {labels.map((label) => {
        const isHovered = hoveredId === label.id;
        const isCorrect = revealed[label.id];
        const labelAccent = isCorrect
          ? "#059669"
          : isHovered
            ? accent
            : D
              ? "#8896b3"
              : "#6b7280";
        return (
          <div
            key={label.id}
            style={{
              position: "absolute",
              left: `${label.x}%`,
              top: `${label.y}%`,
              transform: "translate(-50%,-50%)",
              zIndex: 10,
            }}
            onMouseEnter={() => setHoveredId(label.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {selfTestMode && !isCorrect ? (
              <input
                value={inputs[label.id] || ""}
                onChange={(e) => handleInput(label.id, e.target.value)}
                placeholder="?"
                style={{
                  width: 80,
                  fontSize: 10,
                  fontWeight: 700,
                  textAlign: "center",
                  padding: "2px 4px",
                  borderRadius: 4,
                  border: `1.5px solid ${labelAccent}`,
                  background: D ? "#13131f" : "#fff",
                  color: D ? "#e8ecf4" : "#111827",
                  outline: "none",
                }}
              />
            ) : (
              <div
                style={{
                  background: isCorrect
                    ? "#059669"
                    : isHovered
                      ? accent
                      : D
                        ? accent + "44"
                        : accent + "22",
                  color:
                    isCorrect || isHovered ? "#fff" : D ? "#e8ecf4" : "#111827",
                  border: `1.5px solid ${labelAccent}`,
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,.25)" : "none",

                  transition: "all .15s",
                  cursor: "default",
                  transform: isHovered ? "scale(1.4)" : "scale(1)",
                  opacity: selfTestMode && !isCorrect ? 0 : 1,
                }}
              >
                {label.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TimelineDiagram({
  events = [],
  accent = "#D97706",
  D = false,
  width = 580,
}) {
  const { props: attn, isActive, isPulsing } = useAttentionLayer();
  if (!events.length) return null;
  const bg = D ? "#13131f" : "#fff";
  const textCol = D ? "#e8ecf4" : "#111827";
  const subCol = D ? "#8896b3" : "#6b7280";
  const lineY = 80,
    svgH = 170,
    padX = 28;
  const lineX1 = padX,
    lineX2 = width - padX,
    lineLen = lineX2 - lineX1,
    n = events.length;
  return (
    <svg
      viewBox={`0 0 ${width} ${svgH}`}
      width="100%"
      style={{ display: "block", maxWidth: width, overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Timeline diagram"
    >
      <rect width={width} height={svgH} fill={bg} rx="8" />
      <line
        x1={lineX1}
        y1={lineY}
        x2={lineX2}
        y2={lineY}
        stroke={accent}
        strokeWidth="2"
        opacity="0.4"
      />
      <polygon
        points={`${lineX2},${lineY - 5} ${lineX2 + 10},${lineY} ${lineX2},${lineY + 5}`}
        fill={accent}
        opacity="0.6"
      />
      {events.map((ev, i) => {
        const x = lineX1 + (i / Math.max(n - 1, 1)) * lineLen;
        const above = i % 2 === 0;
        const evAccent = ev.color || accent;
        const dotR = ev.important ? 7 : 5;
        const sid = ev.id || String(i);
        const active = isActive(sid);
        const pulse = isPulsing(sid);
        return (
          <g key={sid} {...attn(sid)}>
            <line
              x1={x}
              y1={lineY - dotR}
              x2={x}
              y2={above ? lineY - dotR - 32 : lineY + dotR + 32}
              stroke={evAccent}
              strokeWidth="1.2"
              opacity="0.6"
            />
            <circle
              cx={x}
              cy={lineY}
              r={active ? dotR * 1.3 : dotR}
              fill={evAccent + (D ? "cc" : "dd")}
              stroke={evAccent}
              strokeWidth={ev.important ? 2 : 1}
              style={{ transition: "r .15s ease" }}
            />
            <text
              x={x}
              y={above ? lineY - dotR - 38 : lineY + dotR + 46}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill={textCol}
              fontFamily="Arial,sans-serif"
              style={{ userSelect: "none" }}
            >
              {ev.label}
            </text>
            {ev.date && (
              <text
                x={x}
                y={above ? lineY - dotR - 26 : lineY + dotR + 34}
                textAnchor="middle"
                fontSize="8"
                fill={evAccent}
                fontFamily="Arial,sans-serif"
                style={{ userSelect: "none" }}
              >
                {ev.date}
              </text>
            )}
            {ev.sublabel && (
              <text
                x={x}
                y={above ? lineY - dotR - 14 : lineY + dotR + 22}
                textAnchor="middle"
                fontSize="8"
                fill={subCol}
                fontFamily="Arial,sans-serif"
                style={{ userSelect: "none" }}
              >
                {ev.sublabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function DiagramRenderer() {
  // Auto-generated concept diagrams have been removed from ReviseIQ.
  return null;
  // eslint-disable-next-line no-unreachable
  const diagram = null,
    D = false,
    width = 560;
  if (!diagram || !diagram.type) return null;
  const { type, data, accent } = diagram;
  const itemCount = data
    ? (data.steps || data.events || []).length ||
      (data.root ? 1 : 0) ||
      (data.rows || []).length
    : 0;
  const rendered =
    type === "process" ? (
      <ProcessFlowDiagram
        steps={data?.steps || []}
        accent={accent}
        D={D}
        width={width}
      />
    ) : type === "cycle" ? (
      <CycleDiagram steps={data?.steps || []} accent={accent} D={D} />
    ) : type === "hierarchy" ? (
      <HierarchyTree
        root={data?.root || null}
        accent={accent}
        D={D}
        width={width}
      />
    ) : type === "comparison" ? (
      <ComparisonGrid
        rows={data?.rows || []}
        columns={data?.columns || []}
        data={data?.cells || {}}
        accent={accent}
        D={D}
      />
    ) : type === "structure" ? (
      <LabelledStructure
        imageUrl={data?.imageUrl || null}
        labels={data?.labels || []}
        accent={accent}
        D={D}
        width={width}
      />
    ) : type === "timeline" ? (
      <TimelineDiagram
        events={data?.events || []}
        accent={accent}
        D={D}
        width={width}
      />
    ) : null;
  if (!rendered) return null;
  return (
    <div>
      {rendered}
      {itemCount > 2 && (
        <p
          style={{
            fontSize: 10,
            color: D ? "#8896b3" : "#9ca3af",
            textAlign: "center",
            marginTop: 4,
            fontStyle: "italic",
          }}
        >
          Tap or hover elements to highlight
        </p>
      )}
    </div>
  );
}

export const SEMANTIC_COLORS = {
  definition: {
    bg_l: "#f0f9ff",
    bg_d: "rgba(8,145,178,.1)",
    border: "#0891B2",
    label_l: "#0e7490",
    label_d: "#67e8f9",
    icon: "📖",
  },
  process: {
    bg_l: "#ecfdf5",
    bg_d: "rgba(5,150,105,.1)",
    border: "#059669",
    label_l: "#065f46",
    label_d: "#6ee7b7",
    icon: "🔄",
  },
  equation: {
    bg_l: "#f5f3ff",
    bg_d: "rgba(124,58,237,.1)",
    border: "#7C3AED",
    label_l: "#6d28d9",
    label_d: "#c4b5fd",
    icon: "➗",
  },
  mistake: {
    bg_l: "#fffbeb",
    bg_d: "rgba(217,119,6,.1)",
    border: "#D97706",
    label_l: "#b45309",
    label_d: "#fcd34d",
    icon: "⚠️",
  },
  evaluation: {
    bg_l: "#fff1f2",
    bg_d: "rgba(225,29,72,.1)",
    border: "#E11D48",
    label_l: "#be123c",
    label_d: "#fda4af",
    icon: "⚖️",
  },
  practical: {
    bg_l: "#f0fdf4",
    bg_d: "rgba(22,163,74,.1)",
    border: "#16A34A",
    label_l: "#15803d",
    label_d: "#86efac",
    icon: "🔬",
  },
  example: {
    bg_l: "#faf5ff",
    bg_d: "rgba(147,51,234,.1)",
    border: "#9333EA",
    label_l: "#7e22ce",
    label_d: "#d8b4fe",
    icon: "✨",
  },
};

export function ProgressiveDiagram({ steps = [], D }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => setIdx(0), [steps.length]);
  const cur = steps[idx] || null;
  if (!cur) return null;
  return (
    <div style={{ ...C(D), padding: 12 }} className="fade-in">
      <p style={{ fontSize: 12, marginBottom: 8 }}>{cur.text}</p>
      {cur.svg && (
        <div style={{ opacity: 1, transition: "opacity .25s" }}>
          <DiagramRenderer diagram={cur.svg} D={D} width={420} />
        </div>
      )}
      {idx < steps.length - 1 && (
        <button
          onClick={() => setIdx((i) => i + 1)}
          style={{
            marginTop: 8,
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            background: "#7c3aed",
            color: "#fff",
          }}
        >
          Next
        </button>
      )}
    </div>
  );
}

export function ConceptMap({ x, y, relation, D }) {
  return (
    <svg viewBox="0 0 360 120" style={{ width: "100%", maxWidth: 420 }}>
      <circle
        cx="70"
        cy="60"
        r="32"
        fill={D ? "#1e293b" : "#f5f3ff"}
        stroke="#7c3aed"
      />
      <circle
        cx="290"
        cy="60"
        r="32"
        fill={D ? "#1e293b" : "#f5f3ff"}
        stroke="#7c3aed"
      />
      <text x="70" y="64" textAnchor="middle" fontSize="12">
        {x || "X"}
      </text>
      <text x="290" y="64" textAnchor="middle" fontSize="12">
        {y || "Y"}
      </text>
      <line
        x1="104"
        y1="60"
        x2="256"
        y2="60"
        stroke="#7c3aed"
        markerEnd="url(#arr)"
      />
      <defs>
        <marker
          id="arr"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#7c3aed" />
        </marker>
      </defs>
      <text x="180" y="48" textAnchor="middle" fontSize="11">
        {relation || "relates to"}
      </text>
    </svg>
  );
}

export function checkPrerequisites(graph, topicId, masteryMap, threshold) {
  const t = threshold == null ? 60 : threshold;
  const edges = (graph?.edges || []).filter(
    (e) => e.to === topicId && e.type === "requires",
  );
  const unmet = edges
    .filter((e) => Number(masteryMap?.[e.from] || 0) < t)
    .map((e) => e.from);
  return unmet;
}

export function ProcessCard({ card, D }) {
  const [idx, setIdx] = React.useState(0);
  const steps = card?.steps || [];
  React.useEffect(() => setIdx(0), [card?.id]);
  return (
    <div style={{ ...C(D), padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        {steps[idx]?.label || "Step"}
      </div>
      <button
        onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "none",
          background: "#7c3aed",
          color: "#fff",
        }}
      >
        Next Step
      </button>
      <div style={{ marginTop: 10, fontSize: 12, color: mu(D) }}>
        {steps.map((s, i) => (
          <div key={i}>
            {i + 1}. {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SketchCanvas({ D }) {
  const ref = React.useRef(null);
  const drawing = React.useRef(false);

  const start = (e) => {
    drawing.current = true;
    const c = ref.current.getContext("2d");
    c.beginPath();
    c.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const c = ref.current.getContext("2d");
    c.lineWidth = 2;
    c.strokeStyle = D ? "#e5e7eb" : "#111827";
    c.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    c.stroke();
  };
  const end = () => {
    drawing.current = false;
  };
  return (
    <canvas
      ref={ref}
      width={320}
      height={180}
      onMouseDown={start}
      onMouseMove={move}
      onMouseUp={end}
      onMouseLeave={end}
      style={{
        border: "1px solid #94a3b8",
        borderRadius: 8,
        background: D ? "#0a0a14" : "#fff",
        width: "100%",
        maxWidth: 340,
      }}
    />
  );
}

export function GraphCard({ card, D }) {
  return (
    <div>
      {card?.graph && (
        <QuestionFigure
          figure={card.graph}
          D={D}
          figureNumber={1}
          DiagramRendererComp={DiagramRenderer}
        />
      )}
      <p style={{ fontSize: 13, marginBottom: 8 }}>{card?.question || ""}</p>
      {card?.annotation && (
        <div style={{ fontSize: 12, color: "#7c3aed" }}>
          {" "}
          {card.annotation.label || "Key point"}
        </div>
      )}
    </div>
  );
}

export async function generateSVGDiagram(content, user) {
  // SVG diagram generation removed from ReviseIQ.
  return "";
  // eslint-disable-next-line no-unreachable
  const key = SK_SVG_ASSETS(user);
  const hash = btoa(unescape(encodeURIComponent(content || ""))).slice(0, 40);
  try {
    const cache = JSON.parse(localStorage.getItem(key) || "{}");
    if (cache[hash] && String(cache[hash]).includes("<svg")) return cache[hash];
    let svg = "";
    if (
      typeof window !== "undefined" &&
      typeof window.generateSVGDiagram === "function"
    ) {
      try {
        svg = await window.generateSVGDiagram(content);
      } catch (_) {}
    }
    if (!svg || !String(svg).includes("<svg"))
      svg = `<svg xmlns="http://www.w3.org/2000/svg"
width="360" height="140"><rect x="10" y="10" width="340" height="120" fill="#f5f3ff"
stroke="#7c3aed"/><text x="24" y="75" font-size="14"
fill="#1c1d30">${(content || "Diagram").slice(0, 36)}</text></svg>`;
    cache[hash] = svg;
    localStorage.setItem(key, JSON.stringify(cache));
    return svg;
  } catch (_) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="140"><rect
x="10" y="10" width="340" height="120" fill="#f5f3ff" stroke="#7c3aed"/><text x="24" y="75"
font-size="14" fill="#1c1d30">Diagram</text></svg>`;
  }
}

export function masteryColor(p) {
  return p >= 70 ? "#16a34a" : p >= 40 ? "#f59e0b" : "#9ca3af";
}

export function buildTreemap(nodes, width, height) {
  const arr = [...(nodes || [])]
    .filter((n) => n && n.contentSize > 0)
    .sort((a, b) => b.contentSize - a.contentSize);
  if (!arr.length) return [];
  const total = arr.reduce((a, n) => a + n.contentSize, 0) || 1;
  let x = 0,
    y = 0,
    w = width,
    h = height,
    dir = 0;
  return arr.map((n, i) => {
    const frac = n.contentSize / total;
    let rw = w,
      rh = h;
    if (dir % 2 === 0) {
      rw = Math.max(1, width * frac);
      const r = { ...n, x, y, w: rw, h };
      x += rw;
      w = Math.max(0, width - x);
      dir++;
      return r;
    }
    rh = Math.max(1, height * frac);
    const r = { ...n, x, y, w, h: rh };
    y += rh;
    h = Math.max(0, height - y);
    dir++;
    return r;
  });
}

export function MasteryTreemap({ nodes = [], D, onSelect }) {
  const [tip, setTip] = React.useState(null);
  const layout = React.useMemo(
    () => buildTreemap(nodes, 900, 320),
    [JSON.stringify(nodes)],
  );
  if (!nodes.length)
    return (
      <div style={{ ...C(D), padding: 16, fontSize: 13, color: mu(D) }}>
        No mastery data yet.
      </div>
    );
  return (
    <div style={{ position: "relative", ...C(D), padding: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
        Mastery Landscape
      </h3>
      <svg viewBox="0 0 900 320" style={{ width: "100%", height: "auto" }}>
        {layout.map((n, i) => (
          <g
            key={i}
            onMouseEnter={() => setTip(n)}
            onMouseLeave={() => setTip(null)}
            onClick={() => onSelect && onSelect(n)}
          >
            <rect
              x={n.x}
              y={n.y}
              width={n.w}
              height={n.h}
              fill={masteryColor(n.mastery || 0)}
              stroke="#fff"
            />
            {n.w > 80 && n.h > 28 && (
              <text x={n.x + 6} y={n.y + 16} fontSize="11" fill="#fff">
                {n.name}
              </text>
            )}
          </g>
        ))}
      </svg>
      {tip && (
        <div
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            fontSize: 11,
            background: D ? "#0a0a14" : "#fff",
            border: "1px solid #cbd5e1",
            padding: "5px 8px",
            borderRadius: 6,
          }}
        >
          {tip.name} ·{Math.round(tip.mastery || 0)}%
        </div>
      )}
    </div>
  );
}

export function LearningTimeline({
  sessions = [],
  exams = [],
  subjects = [],
  D,
  onSelect,
}) {
  const [tip, setTip] = React.useState(null);
  const data = React.useMemo(() => {
    if (!sessions.length) return { items: [], min: 0, max: 1 };
    const times = sessions.map((s) => new Date(s.date).getTime());
    const min = Math.min(...times),
      max = Math.max(...times, min + 1);
    const items = sessions.map((s, i) => ({
      ...s,
      _x: 30 + ((new Date(s.date).getTime() - min) / (max - min || 1)) * 820,
      _h: Math.min(120, 20 + Number(s.duration || 20)),
    }));
    return { items, min, max };
  }, [JSON.stringify(sessions)]);
  if (!sessions.length)
    return (
      <div style={{ ...C(D), padding: 16, fontSize: 13, color: mu(D) }}>
        No data yet.
      </div>
    );
  const bySub = {};
  sessions.forEach((s) => {
    bySub[s.subject] = (bySub[s.subject] || 0) + Number(s.duration || 0);
  });
  const topSub = Object.entries(bySub).sort((a, b) => b[1] - a[1])[0];
  return (
    <div style={{ ...C(D), padding: 12, marginTop: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
        Learning Timeline
      </h3>
      <svg viewBox="0 0 900 220" style={{ width: "100%", height: "auto" }}>
        <line x1="30" y1="180" x2="860" y2="180" stroke="#94a3b8" />
        {data.items.map((s, i) => {
          const subj = subjects.find(
            (x) => x.name === s.subject || x.id === s.subjectId,
          );
          const col = subj?.accent || "#7c3aed";
          return (
            <rect
              key={i}
              x={s._x}
              y={180 - s._h}
              width="10"
              height={s._h}
              fill={col}
              onMouseEnter={() => setTip(s)}
              onMouseLeave={() => setTip(null)}
              onClick={() => onSelect && onSelect(s)}
            />
          );
        })}
        {exams.map((e, i) => {
          const x =
            30 +
            ((new Date(e.date).getTime() - data.min) /
              (data.max - data.min || 1)) *
              820;
          return (
            <line
              key={i}
              x1={x}
              y1="20"
              x2={x}
              y2="180"
              stroke="#ef4444"
              strokeDasharray="4 3"
            />
          );
        })}
      </svg>
      {tip && (
        <div style={{ fontSize: 11, marginTop: 6 }}>
          {tip.date} · {tip.subject} · {tip.duration}
          min
        </div>
      )}
      <div style={{ fontSize: 11, color: mu(D), marginTop: 6 }}>
        Most studied subject:
        {topSub?.[0] || "—"}
      </div>
    </div>
  );
}
