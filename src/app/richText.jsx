import React, { useState, useEffect, useRef } from "react";
import { DiagramRenderer, SEMANTIC_COLORS } from "./diagrams.jsx";
import { B, I, mu, tx } from "./ui.jsx";

export function useMathReady() {
  const [ready, setReady] = useState(typeof window.katex !== "undefined");
  useEffect(() => {
    if (!ready) window.__onKatexReady(() => setReady(true));
  }, []);
  return ready;
}

export function renderMath(src, display = false) {
  if (typeof window.katex === "undefined")
    return (
      <code
        style={{
          fontFamily: "'IBM PlexMono',monospace",
          fontSize: 12,
          background: "rgba(99,102,241,.12)",
          padding: "1px 5px",
          borderRadius: 4,
        }}
      >
        {src}
      </code>
    );
  try {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: window.katex.renderToString(src, {
            throwOnError: false,
            displayMode: display,
          }),
        }}
      />
    );
  } catch (e) {
    return <code style={{ fontFamily: "monospace", fontSize: 12 }}>{src}</code>;
  }
}

export function parseLatex(s, mathReady) {
  if (!s) return "";

  s = s
    .split("\\[")
    .join("$$")
    .split("\\]")
    .join("$$")
    .split("\\(")
    .join("$")
    .split("\\)")
    .join("$");
  if (!mathReady) return s;
  const out = [];
  let i = 0,
    cur = "";
  while (i < s.length) {
    if (s[i] === "$" && s[i + 1] === "$") {
      const end = s.indexOf("$$", i + 2);
      if (end > i) {
        if (cur) {
          out.push(cur);
          cur = "";
        }
        out.push(
          <span
            key={i}
            style={{ display: "block", textAlign: "center", margin: "4px 0" }}
          >
            {renderMath(s.slice(i + 2, end), true)}
          </span>,
        );
        i = end + 2;
        continue;
      }
    }
    if (s[i] === "$" && s[i + 1] !== "$") {
      const end = s.indexOf("$", i + 1);
      if (end > i && end - i < 200) {
        if (cur) {
          out.push(cur);
          cur = "";
        }
        out.push(<span key={i}>{renderMath(s.slice(i + 1, end))}</span>);
        i = end + 1;
        continue;
      }
    }
    cur += s[i];
    i++;
  }
  if (cur) out.push(cur);
  return out.length === 0
    ? ""
    : out.length === 1 && typeof out[0] === "string"
      ? out[0]
      : out;
}

export function ContentBlock({ content, D, style = {}, fontSize = 15 }) {
  const mathReady = useMathReady();
  const isHtml = (content || "").trimStart().startsWith("<");
  if (isHtml)
    return (
      <div
        className="rich-display"
        dangerouslySetInnerHTML={{ __html: content || "" }}
        style={{ fontSize, lineHeight: 1.75, color: tx(D), ...style }}
      />
    );
  const parsed = parseLatex(content || "", mathReady);
  return (
    <p
      style={{
        fontSize,
        lineHeight: 1.75,
        color: tx(D),
        whiteSpace: "pre-line",
        ...style,
      }}
    >
      {parsed}
    </p>
  );
}

export function RichEditor({ value, onChange, D, placeholder, minHeight = 110 }) {
  const ref = useRef(null);
  const inited = useRef(false);
  useEffect(() => {
    if (!inited.current && ref.current) {
      ref.current.innerHTML = value || "";
      inited.current = true;
    }
  });
  const exec = (cmd, arg) => {
    document.execCommand(cmd, false, arg ?? undefined);
    if (ref.current) onChange(ref.current.innerHTML);
    ref.current?.focus();
  };

  const insLatex = () => {
    const formula = window.prompt("Enter LaTeX (e.g. x^2+y^2=r^2):");
    if (!formula) return;
    let html;
    if (typeof window.katex !== "undefined") {
      try {
        html = `<span style="display:inline-block;padding:0
2px">${window.katex.renderToString(formula, { throwOnError: false, displayMode: false })}</span>`;
      } catch (e) {
        html = `<code style="font-family:'IBM Plex
Mono',monospace;background:rgba(99,102,241,.13);padding:1px
5px;border-radius:4px;font-size:12px">$${formula}$</code>`;
      }
    } else {
      html = `<code style="font-family:'IBM Plex
Mono',monospace;background:rgba(99,102,241,.13);padding:1px
5px;border-radius:4px;font-size:12px">$${formula}$</code>`;
    }
    exec("insertHTML", html);
  };
  const brd = D ? "#374151" : "#d1d5db";
  const bs = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    borderRadius: 5,
    padding: "3px 8px",
    fontSize: 13,
    fontWeight: 600,
    color: tx(D),
  };
  return (
    <div
      style={{
        border: `1.5px solid ${brd}`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: "5px 8px",
          background: D ? "#1e2537" : "#f3f4f6",
          borderBottom: `1px solid ${brd}`,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {[
          ["bold", <b>B</b>],
          ["italic", <i>I</i>],
          ["underline", <u>U</u>],
        ].map(([cmd, lbl]) => (
          <button
            key={cmd}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(cmd);
            }}
            style={bs}
          >
            {lbl}
          </button>
        ))}
        <span style={{ color: brd, userSelect: "none", padding: "0 2px" }}>
          |
        </span>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertUnorderedList");
          }}
          style={bs}
        >
          • List
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec("insertOrderedList");
          }}
          style={bs}
        >
          1. List
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec("formatBlock", "h3");
          }}
          style={bs}
        >
          H3
        </button>
        <span style={{ color: brd, userSelect: "none", padding: "0 2px" }}>
          |
        </span>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            insLatex();
          }}
          style={{ ...bs, color: "#6366f1" }}
          title="Insert LaTeX"
        >
          ∑ LaTeX
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            exec("removeFormat");
          }}
          style={{ ...bs, fontSize: 11, color: mu(D) }}
        >
          Clear
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="rich-body"
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        data-placeholder={placeholder || "Write here…"}
        style={{
          padding: "12px 14px",
          background: D ? "#1e2537" : "#fff",
          color: tx(D),
          minHeight,
          outline: "none",
          lineHeight: 1.75,
          fontSize: 13,
        }}
      />
    </div>
  );
}

export function MD({ text, D }) {
  const mathReady = useMathReady();
  const lines = (text || "").split("\n"),
    out = [],
    tbl = [];
  const flush = () => {
    if (!tbl.length) return;
    const rows = tbl.filter((l) => !l.match(/^\|[-|: ]+\|$/));
    out.push(
      <div
        key={`t${out.length}`}
        style={{ overflowX: "auto", margin: "10px 0" }}
      >
        <table
          style={{
            fontSize: 12,
            borderCollapse: "collapse",
            width: "100%",
            color: D ? "#e5e7eb" : "#374151",
          }}
        >
          {rows.map((row, ri) => {
            const cells = row
              .split("|")
              .filter((_, i, a) => i > 0 && i < a.length - 1)
              .map((c) => c.trim());
            const T = ri === 0 ? "th" : "td";
            return (
              <tr
                key={ri}
                style={{
                  background: ri === 0 ? (D ? "#374151" : "#f3f4f6") : "",
                }}
              >
                {cells.map((c, ci) => (
                  <T
                    key={ci}
                    style={{
                      border: `1px solid ${D ? "#4b5563" : "#d1d5db"}`,
                      padding: "6px 12px",
                      textAlign: "left",
                    }}
                  >
                    {c}
                  </T>
                ))}
              </tr>
            );
          })}
        </table>
      </div>,
    );
    tbl.length = 0;
  };
  const pb = (s) => {
    if (!mathReady) return;
    s.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/).map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) return;
      <strong key={i}>{p.slice(2, -2)}</strong>;
      if (
        p.startsWith("*") &&
        p.endsWith("*") &&
        !p.startsWith("**") &&
        p.length > 2
      )
        return <em key={i}>{p.slice(1, -1)}</em>;
      return p;
    });
    const latexParsed = parseLatex(s, mathReady);
    if (typeof latexParsed === "string") {
      return latexParsed.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} style={{ color: D ? "#fff" : "#111827" }}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          p
        ),
      );
    }
    if (!Array.isArray(latexParsed)) return latexParsed;
    return latexParsed.flatMap((seg, si) => {
      if (typeof seg !== "string") return [seg];
      return seg.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={`${si}-${i}`} style={{ color: D ? "#fff" : "#111827" }}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          p
        ),
      );
    });
  };
  lines.forEach((l, i) => {
    if (l.startsWith("|")) {
      tbl.push(l);
      return;
    }
    flush();

    if (!l.trim()) {
      out.push(<div key={i} style={{ height: 6 }} />);
      return;
    }
    if (l.match(/^-{3,}$|^\*{3,}$/)) {
      out.push(
        <hr
          key={i}
          style={{
            border: "none",
            borderTop: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
            margin: "10px 0",
          }}
        />,
      );
      return;
    }
    if (l.startsWith("### ")) {
      out.push(
        <h3
          key={i}
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: D ? "#e5e7eb" : "#111827",
            margin: "14px 05px",
            letterSpacing: "0.01em",
          }}
        >
          {pb(l.slice(4))}
        </h3>,
      );
      return;
    }
    if (l.startsWith("## ")) {
      out.push(
        <h2
          key={i}
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: D ? "#f3f4f6" : "#111827",
            margin: "16px 06px",
            paddingBottom: 4,
            borderBottom: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
          }}
        >
          {pb(l.slice(3))}
        </h2>,
      );
      return;
    }
    if (l.startsWith("# ")) {
      out.push(
        <h1
          key={i}
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: D ? "#e8ecf4" : "#111827",
            margin: "18px 08px",
          }}
        >
          {pb(l.slice(2))}
        </h1>,
      );
      return;
    }
    if (l.startsWith("• ") || l.startsWith("- ")) {
      const txt = l.startsWith("•") ? l.slice(2) : l.slice(2);
      out.push(
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            fontSize: 13,
            lineHeight: 1.7,
            marginBottom: 2,
            color: D ? "#d1d5db" : "#374151",
          }}
        >
          <span
            style={{
              marginTop: 7,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "currentColor",
              flexShrink: 0,
              opacity: 0.5,
            }}
          />
          <span>{pb(txt)}</span>
        </div>,
      );
      return;
    }
    if (l.startsWith(" ")) {
      out.push(
        <div
          key={i}
          style={{
            margin: "8px 0",
            padding: "10px 14px",
            borderRadius: 8,
            border: `1px solid ${D ? "#92400e" : "#fde68a"}`,
            background: D ? "rgba(120,53,15,.25)" : "#fffbeb",
            fontSize: 13,
            color: D ? "#fcd34d" : "#92400e",
          }}
        >
          {pb(l)}
        </div>,
      );
      return;
    }
    if (l.match(/^\d+\.\s/)) {
      out.push(
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            fontSize: 13,
            lineHeight: 1.7,
            marginBottom: 2,
            color: D ? "#d1d5db" : "#374151",
          }}
        >
          <span
            style={{
              flexShrink: 0,
              fontFamily: "monospace",
              fontSize: 11,
              marginTop: 2,
              color: D ? "#9ca3af" : "#6b7280",
            }}
          >
            {l.match(/^\d+/)[0]}.
          </span>
          <span>{pb(l.replace(/^\d+\.\s*/, ""))}</span>
        </div>,
      );
      return;
    }
    out.push(
      <p
        key={i}
        style={{
          fontSize: 15,
          lineHeight: 1.8,
          marginBottom: 4,
          color: D ? "#d1d5db" : "#374151",
        }}
      >
        {pb(l)}
      </p>,
    );
  });
  flush();
  return <>{out}</>;
}

export const NOTE_SEC_DEFS = {
  "CORE CONTENT": {
    icon: " ",
    border: "#6366f1",
    bg_l: "#eef2ff",
    bg_d: "rgba(99,102,241,.08)",
    lbl_l: "#4338ca",
    lbl_d: "#a5b4fc",
    selfCheck: false,
  },
  "WORKED EXAMPLE": {
    icon: SEMANTIC_COLORS.process.icon,
    border: SEMANTIC_COLORS.process.border,
    bg_l: SEMANTIC_COLORS.process.bg_l,
    bg_d: SEMANTIC_COLORS.process.bg_d,
    lbl_l: SEMANTIC_COLORS.process.label_l,
    lbl_d: SEMANTIC_COLORS.process.label_d,
    selfCheck: false,
  },
  "KEY MISTAKE": {
    icon: SEMANTIC_COLORS.mistake.icon,
    border: SEMANTIC_COLORS.mistake.border,
    bg_l: SEMANTIC_COLORS.mistake.bg_l,
    bg_d: SEMANTIC_COLORS.mistake.bg_d,
    lbl_l: SEMANTIC_COLORS.mistake.label_l,
    lbl_d: SEMANTIC_COLORS.mistake.label_d,
    selfCheck: false,
  },
  "COMMON EXAM MISTAKE": {
    icon: SEMANTIC_COLORS.mistake.icon,
    border: SEMANTIC_COLORS.mistake.border,
    bg_l: SEMANTIC_COLORS.mistake.bg_l,
    bg_d: SEMANTIC_COLORS.mistake.bg_d,
    lbl_l: SEMANTIC_COLORS.mistake.label_l,
    lbl_d: SEMANTIC_COLORS.mistake.label_d,
    selfCheck: false,
  },
  "SELF-CHECK": {
    icon: " ",
    border: "#10b981",
    bg_l: "#ecfdf5",
    bg_d: "rgba(16,185,129,.08)",
    lbl_l: "#065f46",
    lbl_d: "#6ee7b7",
    selfCheck: true,
  },
  DEFINITION: {
    icon: SEMANTIC_COLORS.definition.icon,
    border: SEMANTIC_COLORS.definition.border,
    bg_l: SEMANTIC_COLORS.definition.bg_l,
    bg_d: SEMANTIC_COLORS.definition.bg_d,
    lbl_l: SEMANTIC_COLORS.definition.label_l,
    lbl_d: SEMANTIC_COLORS.definition.label_d,
    selfCheck: false,
  },
  EQUATION: {
    icon: SEMANTIC_COLORS.equation.icon,
    border: SEMANTIC_COLORS.equation.border,
    bg_l: SEMANTIC_COLORS.equation.bg_l,
    bg_d: SEMANTIC_COLORS.equation.bg_d,
    lbl_l: SEMANTIC_COLORS.equation.label_l,
    lbl_d: SEMANTIC_COLORS.equation.label_d,
    selfCheck: false,
  },
  "REQUIRED PRACTICAL": {
    icon: SEMANTIC_COLORS.practical.icon,
    border: SEMANTIC_COLORS.practical.border,
    bg_l: SEMANTIC_COLORS.practical.bg_l,
    bg_d: SEMANTIC_COLORS.practical.bg_d,
    lbl_l: SEMANTIC_COLORS.practical.label_l,
    lbl_d: SEMANTIC_COLORS.practical.label_d,
    selfCheck: false,
  },
  MNEMONIC: {
    icon: " ",
    border: "#ec4899",
    bg_l: "#fdf2f8",
    bg_d: "rgba(236,72,153,.08)",
    lbl_l: "#9d174d",
    lbl_d: "#f9a8d4",
    selfCheck: false,
  },
};

export function parseNoteBody(body) {
  if (!(body || "").includes("\n## ") && !(body || "").startsWith("## "))
    return null;
  const lines2 = body.split("\n");
  const secs = [];
  let cur = null;
  for (const line of lines2) {
    if (line.startsWith("## ")) {
      if (cur) secs.push(cur);
      const hdKey = line.slice(3).trim().toUpperCase();

      const def = NOTE_SEC_DEFS[hdKey] || {
        icon: " ",
        border: "#6b7280",
        bg_l: "#f9fafb",
        bg_d: "#1f2937",
        lbl_l: "#374151",
        lbl_d: "#d1d5db",
        selfCheck: false,
      };
      cur = {
        key: hdKey,
        heading: line.slice(3).trim(),
        def,
        lines2: [],
        images: [],
      };
    } else if (cur) {
      cur.lines2.push(line);
    } else {
      if (!secs.length || secs[0].key !== "__pre")
        secs.unshift({ key: "__pre", def: null, lines2: [] });
      secs[0].lines2.push(line);
    }
  }
  if (cur) secs.push(cur);
  return secs.length ? secs : null;
}

export function NoteSec({ sec, D, images = [] }) {
  const [open, setOpen] = React.useState(!sec.def?.selfCheck);
  const [lightbox, setLightbox] = React.useState(null);
  const content = (sec.lines2 || []).join("\n").trim();
  if (sec.key === "__pre")
    return content ? (
      <div style={{ marginBottom: 10 }}>
        <MD text={content} D={D} />
      </div>
    ) : null;
  const { def, heading } = sec;
  const borderCol = def?.border || "#6b7280";
  const bgCol = D ? def?.bg_d || "#1f2937" : def?.bg_l || "#f9fafb";
  const lblCol = D ? def?.lbl_d || "#9ca3af" : def?.lbl_l || "#374151";
  const bd2 = D ? "#2a3347" : "#e5e7eb";
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: `1.5px solid ${borderCol}33`,
        marginBottom: 8,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 14px",
          background: bgCol,
          borderLeft: `3px solid ${borderCol}`,
          borderTop: "none",
          borderRight: "none",
          borderBottom: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 15, flexShrink: 0 }}>{def?.icon || " "}</span>
        <span
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 700,
            color: lblCol,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {heading}
        </span>
        {def?.selfCheck && (
          <span
            style={{
              fontSize: 10,
              color: lblCol,
              background: borderCol + "25",
              padding: "2px 8px",
              borderRadius: 10,
              fontWeight: 700,
              marginRight: 4,
            }}
          >
            Try first!
          </span>
        )}
        <span
          style={{
            fontSize: 12,
            color: lblCol,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          className="note-reveal"
          style={{
            background: D ? "#0d1117" : "#fff",
            borderTop: `1px solid ${borderCol}22`,
          }}
        >
          {images.length > 0 && (
            <div style={{ padding: "8px 16px 0" }}>
              {images.map((img, ii) =>
                img && img.image ? (
                  <div
                    key={ii}
                    style={{
                      marginBottom: 10,
                      cursor: "zoom-in",
                      borderRadius: 8,
                      overflow: "hidden",
                      position: "relative",
                    }}
                    onClick={() => setLightbox(img.image)}
                  >
                    <img
                      src={img.image}
                      alt="diagram"
                      style={{
                        maxWidth: "100%",
                        borderRadius: 8,
                        display: "block",
                        border: `1px solid ${bd2}`,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        background: "rgba(0,0,0,.55)",
                        color: "#fff",
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 8,
                        fontWeight: 600,
                      }}
                    >
                      Zoom
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
          <div style={{ padding: "12px 16px" }}>
            {def?.selfCheck && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: bgCol,
                  marginBottom: 10,
                  fontSize: 11,
                  color: lblCol,
                  fontStyle: "italic",
                  lineHeight: 1.55,
                  border: `1px dashed ${borderCol}55`,
                }}
              >
                Cover the notes above and try to recall these from memory before
                reading.
              </div>
            )}
            <MD text={content} D={D} />
          </div>
        </div>
      )}
      {lightbox && (
        <div className="img-lb" onClick={() => setLightbox(null)}>
          <img
            src={lightbox}
            alt="enlarged"
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              borderRadius: 12,
              boxShadow: "0 30px 80px rgba(0,0,0,.5)",
            }}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255,255,255,.15)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export function SmartNoteCard({
  note,
  D,
  subjectAccent,
  canEdit,
  onEdit,
  onDelete,
  onAddVisual,
}) {
  const [lightbox, setLightbox] = React.useState(null);
  const isHtml = (note.body || "").trimStart().startsWith("<");
  const parsed = !isHtml ? parseNoteBody(note.body || "") : null;
  const bd2 = D ? "#2a3347" : "#e5e7eb";
  const accentCol = subjectAccent || "#6366f1";
  const isSideBySide =
    note.layoutMode === "side-by-side" && (note.images || []).length > 0;

  const sectionImages = (sectionKey) => {
    const allImgs = note.images || [];
    const keyed = allImgs.filter((img) => img && img.sectionKey === sectionKey);
    if (keyed.length) return keyed;

    const unassigned = allImgs.filter((img) => img && !img.sectionKey);
    if (unassigned.length && parsed) {
      const firstRealSec = parsed.find((s) => s.key !== "__pre");
      if (firstRealSec && firstRealSec.key === sectionKey) return unassigned;
    }
    return [];
  };

  const firstTypedSec = parsed
    ? parsed.find((s) => s.key && s.key !== "__pre" && NOTE_SEC_DEFS[s.key])
    : null;
  const semanticDef = firstTypedSec ? NOTE_SEC_DEFS[firstTypedSec.key] : null;
  return (
    <div
      style={{
        background: D ? "#161b27" : "#fff",
        borderRadius: 14,
        border: `1px solid ${bd2}`,
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          padding: "12px 18px 10px",
          background: D ? "rgba(255,255,255,.02)" : "#fafafa",
          borderBottom: `1px solid ${bd2}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 4,
              height: 26,
              borderRadius: 3,
              background: accentCol,
              flexShrink: 0,
            }}
          />
          <h3
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: D ? "#e8ecf4" : "#111827",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {note.heading || note.text || ""}
          </h3>
          {semanticDef && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 20,
                background: D ? semanticDef.bg_d : semanticDef.bg_l,
                color: D ? semanticDef.lbl_d : semanticDef.lbl_l,
                border: `1px solid ${semanticDef.border}33`,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                flexShrink: 0,
              }}
            >
              {semanticDef.icon} {firstTypedSec.key}
            </span>
          )}
        </div>
        {canEdit && (
          <div
            style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}
          >
            <button
              onClick={onEdit}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#6366f1",
                padding: "2px 6px",
              }}
            >
              {" "}
            </button>
            {!note.diagram && onAddVisual && (
              <button
                onClick={() => onAddVisual(note)}
                title="Generate diagram for this note"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#6366f1",
                  padding: "2px 6px",
                }}
              >
                {" "}
              </button>
            )}
            <button
              onClick={onDelete}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#ef4444",
                padding: "2px 6px",
              }}
            >
              {" "}
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: "14px 18px" }}>
        <div
          style={
            isSideBySide
              ? {
                  display: "grid",
                  gridTemplateColumns: "2fr1fr",
                  gap: 20,
                  alignItems: "start",
                }
              : {}
          }
        >
          <div>
            {parsed ? (
              parsed.map((s, i) => (
                <NoteSec
                  key={i}
                  sec={s}
                  D={D}
                  images={isSideBySide ? [] : sectionImages(s.key)}
                />
              ))
            ) : isHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: note.body }}
                className="rich-display"
                style={{ color: D ? "#d1d5db" : "#374151" }}
              />
            ) : (
              <MD text={note.body || note.text || ""} D={D} />
            )}
            {!parsed &&
              !isHtml &&
              (note.images || [])
                .filter((img) => img && img.image)
                .map((img, ii) => (
                  <div
                    key={ii}
                    style={{
                      marginBottom: 12,
                      cursor: "zoom-in",
                      borderRadius: 8,
                      overflow: "hidden",
                      position: "relative",
                    }}
                    onClick={() => setLightbox(img.image)}
                  >
                    <img
                      src={img.image}
                      alt="diagram"
                      style={{
                        maxWidth: "100%",
                        borderRadius: 8,
                        display: "block",
                        border: `1px solid ${bd2}`,
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        background: "rgba(0,0,0,.55)",
                        color: "#fff",
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 8,
                        fontWeight: 600,
                      }}
                    >
                      Zoom
                    </div>
                  </div>
                ))}
          </div>
          {isSideBySide && (
            <div style={{ position: "sticky", top: 80 }}>
              {(note.images || []).map((img, ii) =>
                img && img.image ? (
                  <img
                    key={ii}
                    src={img.image}
                    alt=""
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      marginBottom: 10,
                      display: "block",
                      border: `1px solid ${bd2}`,
                    }}
                  />
                ) : null,
              )}
            </div>
          )}
        </div>
        {}
        {canEdit && note.diagram && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${D ? "#2a3347" : "#e5e7eb"}`,
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
                  fontSize: 10,
                  fontWeight: 700,
                  color: D ? "#8896b3" : "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {note.diagram.type} diagram
              </span>
              {onAddVisual && (
                <button
                  onClick={() => onAddVisual({ ...note, _removeDiagram: true })}
                  style={{
                    fontSize: 10,
                    color: mu(D),
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            <DiagramRenderer diagram={note.diagram} D={D} width={660} />
          </div>
        )}
        {!canEdit && note.diagram && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${D ? "#2a3347" : "#e5e7eb"}`,
            }}
          >
            <DiagramRenderer diagram={note.diagram} D={D} width={660} />
          </div>
        )}
      </div>

      {lightbox && (
        <div className="img-lb" onClick={() => setLightbox(null)}>
          <img
            src={lightbox}
            alt="enlarged"
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              borderRadius: 12,
              boxShadow: "0 30px 80px rgba(0,0,0,.5)",
            }}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255,255,255,.15)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
