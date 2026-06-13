import React, { useState, useRef } from "react";
import { B, C, mu, tx, uid } from "./ui.jsx";

export const ANN_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#16a34a",
  "#f59e0b",
  "#ffffff",
  "#111827",
];

export const ANN_TOOLS = [
  { id: "label", icon: " ", tip: "Label" },
  { id: "arrow", icon: " ", tip: "Arrow" },
  { id: "text", icon: "T", tip: "Text" },
];

export function ImageAnnotator({ value, onChange, D }) {
  const { image, annotations = [] } = value || {};
  const [tool, setTool] = useState("label");
  const [color, setColor] = useState("#ef4444");
  const [dragging, setDragging] = useState(null);
  const [arrowStart, setArrowStart] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const containerRef = useRef(null);
  const pct = (e) => {
    const r = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };
  const update = (anns) => onChange({ ...value, annotations: anns });
  const handleContainerClick = (e) => {
    if (
      e.target !== containerRef.current &&
      !e.target.tagName.match(/IMG|SVG|svg/i) &&
      !e.target.classList.contains("ann-bg")
    )
      return;
    const { x, y } = pct(e);

    if (tool === "arrow") {
      if (!arrowStart) {
        setArrowStart({ x, y });
        return;
      }
      update([
        ...annotations,
        {
          id: uid(),
          type: "arrow",
          x: arrowStart.x,
          y: arrowStart.y,
          x2: x,
          y2: y,
          text: "",
          color,
        },
      ]);
      setArrowStart(null);
      return;
    }
    update([
      ...annotations,
      {
        id: uid(),
        type: tool,
        x,
        y,
        text: tool === "label" ? "Label" : "Text",
        color,
      },
    ]);
  };
  const deleteAnn = (id) => update(annotations.filter((a) => a.id !== id));
  const updateAnn = (id, patch) =>
    update(annotations.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const handleMouseDown = (e, ann) => {
    e.stopPropagation();
    const r = containerRef.current.getBoundingClientRect();
    setDragging({
      id: ann.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: ann.x,
      origY: ann.y,
      w: r.width,
      h: r.height,
    });
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    const dx = ((e.clientX - dragging.startX) / dragging.w) * 100,
      dy = ((e.clientY - dragging.startY) / dragging.h) * 100;
    updateAnn(dragging.id, {
      x: Math.max(0, Math.min(95, dragging.origX + dx)),
      y: Math.max(0, Math.min(95, dragging.origY + dy)),
    });
  };
  const handleMouseUp = () => setDragging(null);
  if (!image) return null;
  return (
    <div style={{ userSelect: "none" }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {ANN_TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTool(t.id);
              setArrowStart(null);
            }}
            title={t.tip}
            style={{
              ...B(tool === t.id ? "#6366f1" : "transparent", tool !== t.id, {
                fontSize: 13,
                padding: "4px10px",
                borderColor: D ? "#374151" : "#d1d5db",
                color: tool === t.id ? "#fff" : tx(D),
              }),
            }}
          >
            {t.icon}
            {t.tip}
          </button>
        ))}
        <div style={{ display: "flex", gap: 5, marginLeft: 6 }}>
          {ANN_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: c,
                border:
                  color === c ? "2px solid#6366f1" : "2px solid transparent",
                cursor: "pointer",
                flexShrink: 0,
                outline: "none",
              }}
            />
          ))}
        </div>
        {arrowStart && (
          <span style={{ fontSize: 11, color: "#f59e0b", fontStyle: "italic" }}>
            Click endpoint…
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="ann-bg"
        style={{
          position: "relative",
          display: "inline-block",
          width: "100%",
          cursor: tool === "arrow" && arrowStart ? "crosshair" : "cell",
          borderRadius: 8,
          overflow: "hidden",
          border: `1.5px solid
${D ? "#374151" : "#d1d5db"}`,
        }}
        onClick={handleContainerClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={image}
          alt="annotated"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            pointerEvents: "none",
          }}
        />
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <defs>
            {ANN_COLORS.map((c) => (
              <marker
                key={c}
                id={`ah-${c.slice(1)}`}
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill={c} />
              </marker>
            ))}
          </defs>
          {annotations
            .filter((a) => a.type === "arrow")
            .map((a) => (
              <line
                key={a.id}
                x1={`${a.x}%`}
                y1={`${a.y}%`}
                x2={`${a.x2}%`}
                y2={`${a.y2}%`}
                stroke={a.color}
                strokeWidth="2.5"
                markerEnd={`url(#ah-${a.color.slice(1)})`}
                style={{ pointerEvents: "stroke", cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAnn(a.id);
                }}
              />
            ))}
        </svg>
        {annotations
          .filter((a) => a.type !== "arrow")
          .map((a) => (
            <div
              key={a.id}
              className="ann-handle"
              style={{
                position: "absolute",
                left: `${a.x}%`,
                top: `${a.y}%`,
                transform: "translate(-4px,-4px)",
                zIndex: 10,
              }}
              onMouseDown={(e) => handleMouseDown(e, a)}
            >
              {editId === a.id ? (
                <input
                  autoFocus
                  value={editText || a.text}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => {
                    updateAnn(a.id, { text: editText || a.text });
                    setEditId(null);
                    setEditText("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      updateAnn(a.id, { text: editText || a.text });
                      setEditId(null);
                      setEditText("");
                    }
                  }}
                  style={{
                    background: a.color,
                    color:
                      a.color === "#ffffff" || a.color === "#f59e0b"
                        ? "#111"
                        : "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "3px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                    width: 100,
                    outline: "none",
                  }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div
                    onDoubleClick={() => {
                      setEditId(a.id);
                      setEditText(a.text);
                    }}
                    style={{
                      background: a.color,
                      color:
                        a.color === "#ffffff" || a.color === "#f59e0b"
                          ? "#111"
                          : "#fff",
                      borderRadius: 4,
                      padding: "3px8px",
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      boxShadow: "0 1px 4pxrgba(0,0,0,.4)",
                    }}
                  >
                    {a.text || "…"}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAnn(a.id);
                    }}
                    style={{
                      background: "rgba(0,0,0,.5)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 3,
                      width: 14,
                      height: 14,
                      fontSize: 9,
                      cursor: "pointer",
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
      <p style={{ fontSize: 10, color: mu(D), marginTop: 4 }}>
        Click image to place · Drag to move · Double-click to edit
      </p>
    </div>
  );
}

export function ImagePanel({ images = [], onChange, D }) {
  const [annotatingIdx, setAI] = useState(null);
  const fileRef = useRef(null);

  const addImage = (e) => {
    Array.from(e.target.files || []).forEach((file) => {
      const r = new FileReader();
      r.onload = (ev) =>
        onChange([...images, { image: ev.target.result, annotations: [] }]);
      r.readAsDataURL(file);
    });
    e.target.value = "";
  };
  const removeImage = (i) => onChange(images.filter((_, idx) => idx !== i));
  const updateImage = (i, v) =>
    onChange(images.map((img, idx) => (idx === i ? v : img)));
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: mu(D) }}>
          Images &amp; Diagrams
        </span>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            ...B("#6366f1", true, { fontSize: 11, padding: "4px 10px" }),
          }}
        >
          ＋ Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={addImage}
        />
      </div>
      {images.length === 0 && (
        <p style={{ fontSize: 12, color: mu(D), fontStyle: "italic" }}>
          No images. Upload diagrams to annotate.
        </p>
      )}
      {images.map((img, i) => (
        <div key={i} style={{ ...C(D), padding: 14, marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: tx(D) }}>
              Image {i + 1}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setAI(annotatingIdx === i ? null : i)}
                style={{
                  ...B("#6366f1", true, { fontSize: 11, padding: "4px 10px" }),
                }}
              >
                {annotatingIdx === i ? "✓Done" : "Annotate"}
              </button>
              <button
                onClick={() => removeImage(i)}
                style={{
                  ...B("#ef4444", true, { fontSize: 11, padding: "4px 10px" }),
                }}
              >
                Remove
              </button>
            </div>
          </div>
          {annotatingIdx === i ? (
            <ImageAnnotator
              value={img}
              onChange={(v) => updateImage(i, v)}
              D={D}
            />
          ) : (
            <div
              style={{
                position: "relative",
                display: "inline-block",
                width: "100%",
              }}
            >
              <img
                src={img.image}
                alt=""
                style={{ width: "100%", borderRadius: 8, display: "block" }}
              />
              {(img.annotations || []).length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 6,
                    right: 6,
                    background: "rgba(0,0,0,.6)",
                    color: "#fff",
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}
                >
                  {img.annotations.length}
                  annotation{img.annotations.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function AnnotatedImage({ img, D }) {
  if (!img?.image) return null;
  const anns = img.annotations || [];
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        width: "100%",
        marginBottom: 10,
      }}
    >
      <img
        src={img.image}
        alt=""
        style={{ width: "100%", borderRadius: 8, display: "block" }}
      />
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <defs>
          {ANN_COLORS.map((c) => (
            <marker
              key={c}
              id={`ro-ah-${c.slice(1)}`}
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3,0 6" fill={c} />
            </marker>
          ))}
        </defs>
        {anns
          .filter((a) => a.type === "arrow")
          .map((a) => (
            <line
              key={a.id}
              x1={`${a.x}%`}
              y1={`${a.y}%`}
              x2={`${a.x2}%`}
              y2={`${a.y2}%`}
              stroke={a.color}
              strokeWidth="2.5"
              markerEnd={`url(#ro-ah-${a.color.slice(1)})`}
            />
          ))}
      </svg>
      {anns
        .filter((a) => a.type !== "arrow")
        .map((a) => (
          <div
            key={a.id}
            style={{
              position: "absolute",
              left: `${a.x}%`,
              top: `${a.y}%`,
              transform: "translate(-4px,-4px)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: a.color,
                color:
                  a.color === "#ffffff" || a.color === "#f59e0b"
                    ? "#111"
                    : "#fff",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                boxShadow: "0 1px4px rgba(0,0,0,.4)",
              }}
            >
              {a.text}
            </div>
          </div>
        ))}
    </div>
  );
}
