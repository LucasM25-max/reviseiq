import React, { useState, useEffect } from "react";
import { uid } from "./learningCore.js";
import { B, I, mu, tx } from "./uiPrimitives.js";

// Toast System
let _toastListeners = [];
export function _emitToast(msg, type = "success", duration = 2200) {
  _toastListeners.forEach(fn => fn({ id: uid(), msg, type, duration }));
}
export function showToast(msg, type, duration) {
  _emitToast(msg, type, duration);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const fn = t => {
      setToasts(p => [...p, { ...t, leaving: false }]);
      setTimeout(() => {
        setToasts(p => p.map(x => x.id === t.id ? { ...x, leaving: true } : x));
        setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 220);
      }, t.duration || 2200);
    };
    _toastListeners.push(fn);
    return () => { _toastListeners = _toastListeners.filter(f => f !== fn); };
  }, []);
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 99999, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} className={t.leaving ? "toast-out" : "toast-in"}
          style={{ padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#fff", background: t.type === "error" ? "#ef4444" : t.type === "warn" ? "#f59e0b" : "#10b981", boxShadow: "0 4px 20px rgba(0,0,0,.2)", whiteSpace: "nowrap" }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function MobileBottomNav({ screen, onHome, onStudy, onProgress, onTutor, D }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  if (!isMobile) return null;
  const items = [
    { id: "home", icon: "🏠", label: "Home", fn: onHome },
    { id: "study", icon: "📚", label: "Study", fn: onStudy },
    { id: "progress", icon: "📊", label: "Progress", fn: onProgress },
    { id: "tutor", icon: "🤖", label: "Tutor", fn: onTutor },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: D ? "#161b27" : "#fff", borderTop: `1px solid ${D ? "#2a3347" : "#e5e7eb"}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -4px 20px rgba(0,0,0,.08)" }}>
      {items.map(item => {
        const active = screen === item.id;
        return (
          <button key={item.id} onClick={item.fn}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer", gap: 3 }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? "#6366f1" : D ? "#8896b3" : "#9ca3af" }}>{item.label}</span>
            {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", marginTop: 1 }} />}
          </button>
        );
      })}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: "#1f2937", color: "#fff", textAlign: "center", fontSize: 12, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <span>📵</span><span>You are offline — AI features won't work until you reconnect.</span>
    </div>
  );
}

export function ShortcutModal({ D, onClose }) {
  const shortcuts = [
    ["Flashcard screen", ""],
    ["F", "Flip flashcard"],
    ["N / →", "Next flashcard"],
    ["P / ←", "Previous flashcard"],
    ["1", "Again (forgot)"],
    ["2", "Hard"],
    ["3", "Good"],
    ["4", "Easy"],
    ["Questions screen", ""],
    ["N / →", "Next question"],
    ["P / ←", "Previous question"],
    ["Global", ""],
    ["Cmd+K", "Open search"],
    ["?", "Toggle this panel"],
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: D ? "#1e2537" : "#fff", borderRadius: 16, padding: 28, width: 320, maxWidth: "90vw", boxShadow: "0 25px 60px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: D ? "#e8ecf4" : "#111827" }}>⌨️ Keyboard Shortcuts</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: D ? "#9ca3af" : "#6b7280" }}>×</button>
        </div>
        {shortcuts.map(([key, desc], i) => !desc ? (
          <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#6366f1", textTransform: "uppercase", marginTop: i > 0 ? 14 : 0, marginBottom: 4 }}>{key}</div>
        ) : (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${D ? "#374151" : "#f3f4f6"}` }}>
            <kbd style={{ background: D ? "#374151" : "#f3f4f6", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontFamily: "monospace", color: D ? "#e8ecf4" : "#1f2937", minWidth: 28, textAlign: "center" }}>{key}</kbd>
            <span style={{ fontSize: 13, color: D ? "#d1d5db" : "#374151" }}>{desc}</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: D ? "#8896b3" : "#9ca3af", marginTop: 14, textAlign: "center" }}>Press ? to close</p>
      </div>
    </div>
  );
}

export function SearchModal({ D, subjects, allSections, boardData, boardSels, onNavigate, onClose }) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(() => { setTimeout(() => inputRef.current && inputRef.current.focus(), 50); }, []);

  const results = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const hits = [];
    allSections.forEach(sec => {
      const subj = subjects.find(s => s.id === sec.subjectId);
      if (!subj) return;
      const sub = subj.name + " › " + sec.title;
      if (sec.title && sec.title.toLowerCase().includes(query)) {
        hits.push({ type: "section", label: sec.title, sub, icon: subj.icon, subj, sec });
      }
      (sec.notes || []).forEach(n => {
        if ((n.heading || "").toLowerCase().includes(query) || (typeof n.body === "string" && n.body.toLowerCase().includes(query))) {
          hits.push({ type: "note", label: n.heading || "Note", sub, icon: "📖", subj, sec });
        }
      });
      (sec.flashcards || []).forEach(fc => {
        if ((fc.q || "").toLowerCase().includes(query) || (fc.a || "").toLowerCase().includes(query)) {
          hits.push({ type: "flashcard", label: (fc.q || "").slice(0, 60), sub, icon: "🃏", subj, sec, tab: "flashcards" });
        }
      });
      (sec.questions || []).forEach(qItem => {
        if ((qItem.text || "").toLowerCase().includes(query)) {
          hits.push({ type: "question", label: (qItem.text || "").slice(0, 60), sub, icon: "❓", subj, sec, tab: "questions" });
        }
      });
    });
    return hits.slice(0, 12);
  }, [q, subjects, allSections]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 9000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: D ? "#1e2537" : "#fff", borderRadius: 14, width: 520, maxWidth: "92vw", boxShadow: "0 30px 80px rgba(0,0,0,.3)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${D ? "#374151" : "#e5e7eb"}` }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") onClose(); }}
            placeholder="Search notes, flashcards, sections…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 15, color: D ? "#e8ecf4" : "#111827" }} />
          <span style={{ fontSize: 11, color: D ? "#8896b3" : "#9ca3af", background: D ? "#374151" : "#f3f4f6", padding: "2px 7px", borderRadius: 6 }}>Esc</span>
        </div>
        {!q && <div style={{ padding: "32px 16px", textAlign: "center", color: D ? "#8896b3" : "#9ca3af", fontSize: 13 }}>Start typing to search…</div>}
        {q && results.length === 0 && <div style={{ padding: "32px 16px", textAlign: "center", color: D ? "#8896b3" : "#9ca3af", fontSize: 13 }}>No results for "{q}"</div>}
        {results.map((r, i) => (
          <button key={i} onClick={() => { onNavigate(r); onClose(); }}
            style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: `1px solid ${D ? "#374151" : "#f3f4f6"}`, transition: "background .1s" }}
            onMouseEnter={e => e.currentTarget.style.background = D ? "#374151" : "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: D ? "#e8ecf4" : "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
              <div style={{ fontSize: 11, color: D ? "#9ca3af" : "#6b7280" }}>{r.sub}</div>
            </div>
            <span style={{ fontSize: 10, color: "#6366f1", fontWeight: 600, background: D ? "#312e81" : "#eef2ff", padding: "2px 7px", borderRadius: 8, flexShrink: 0, alignSelf: "center" }}>{r.type}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AppFooter({ D, onContact }) {
  var bg2 = D ? "#0d1117" : "#f9fafb";
  var border = D ? "#1f2937" : "#e5e7eb";
  return (
    <footer style={{ borderTop: "1px solid " + border, background: bg2, padding: "20px 24px", marginTop: 40 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 12, color: D ? "#8896b3" : "#9ca3af", lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600, color: D ? "#9ca3af" : "#6b7280" }}>🎓 ReviseIQ</span>
          {" · "}Built with the help of{" "}
          <span style={{ color: "#f97316" }}>Claude</span>
          {", AI powered by "}
          <span style={{ color: "#10a37f" }}>Llama via Groq</span>
          {" · "}
          <span style={{ fontSize: 11 }}>Not affiliated with Anthropic or Groq.</span>
        </div>
        <button onClick={onContact}
          style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", background: "none", border: "1px solid #6366f1", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
          ✉️ Contact Us
        </button>
      </div>
    </footer>
  );
}
