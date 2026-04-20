import React, { useState, useEffect } from "react";
import { B, C, I, tx, mu } from "./uiPrimitives.js";
import { calcBrierScore } from "./learningEngine.js"; // Needs basic access to this helper if defined there
import { showToast } from "./layoutComponents.jsx";

export function SessionGoalModal({ D, onStart, onSkip }) {
  const [goal, setGoal] = React.useState("");
  const [confidence, setConf] = React.useState(3);
  const [duration, setDuration] = React.useState(25);
  const times = [5, 10, 15, 25, 45, 60];
  const confLabels = ["😟 Low", "🤔 Unsure", "😊 OK", "💪 Good", "🔥 High"];
  const bd2 = D ? "#374151" : "#e5e7eb";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} className="fade-in">
      <div style={{ background: D ? "#161b27" : "#fff", borderRadius: 20, width: "100%", maxWidth: 440, padding: 28, boxShadow: "0 30px 80px rgba(0,0,0,.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: D ? "#e8ecf4" : "#111827", margin: 0 }}>Set Your Session Goal</h3>
          <p style={{ fontSize: 12, color: D ? "#9ca3af" : "#6b7280", marginTop: 4 }}>30 seconds of planning = 30% better retention</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: D ? "#9ca3af" : "#6b7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>What do you want to achieve?</label>
            <input value={goal} onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Master photosynthesis equations"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${bd2}`, background: D ? "#1e2537" : "#f9fafb", color: D ? "#e8ecf4" : "#111827", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: D ? "#9ca3af" : "#6b7280", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>How confident do you feel right now?</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => setConf(v)}
                  style={{
                    flex: 1, padding: "8px 4px", borderRadius: 10, border: `2px solid ${confidence === v ? "#6366f1" : bd2}`, background: confidence === v ? "#6366f1" : "transparent",
                    color: confidence === v ? "#fff" : (D ? "#9ca3af" : "#6b7280"), cursor: "pointer", fontSize: 12, fontWeight: confidence === v ? 700 : 400, transition: "all .12s"
                  }}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#6366f1", textAlign: "center", marginTop: 4, fontWeight: 600 }}>{confLabels[confidence - 1]}</div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: D ? "#9ca3af" : "#6b7280", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Time available</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {times.map(t => (
                <button key={t} onClick={() => setDuration(t)}
                  style={{
                    flex: 1, minWidth: 44, padding: "8px 4px", borderRadius: 9, border: `2px solid ${duration === t ? "#6366f1" : bd2}`,
                    background: duration === t ? "#6366f1" : "transparent", color: duration === t ? "#fff" : (D ? "#9ca3af" : "#6b7280"),
                    cursor: "pointer", fontSize: 12, fontWeight: duration === t ? 700 : 400, transition: "all .12s"
                  }}>
                  {t}m
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onSkip}
            style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${bd2}`, background: "transparent", color: D ? "#9ca3af" : "#6b7280", cursor: "pointer", fontSize: 13 }}>
            Skip
          </button>
          <button onClick={() => onStart({ goal: goal.trim(), confidence, duration, startTime: Date.now() })}
            style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Start Session →
          </button>
        </div>
      </div>
    </div>
  );
}

export function PostSessionReflection({ D, sessionGoal, subjectId, onSave, onSkip }) {
  const [open, setOpen] = React.useState(true);
  const [understood, setU] = React.useState("");
  const [unclear, setC] = React.useState("");
  const [improve, setI] = React.useState("");
  const bd2 = D ? "#374151" : "#e5e7eb";
  const handleSave = () => {
    onSave({
      date: new Date().toISOString().slice(0, 10),
      goal: sessionGoal || "",
      reflections: { understood: understood.trim(), unclear: unclear.trim(), improve: improve.trim() }
    });
  };
  if (!open) return null;
  return (
    <div style={{ ...C(D), marginTop: 16, overflow: "hidden", border: "1.5px solid #6366f1" }} className="slide-up">
      <button onClick={() => setOpen(false)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: D ? "rgba(99,102,241,.1)" : "#eef2ff", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 18 }}>📝</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#6366f1" }}>Session Reflection <span style={{ fontSize: 11, fontWeight: 400, color: D ? "#a5b4fc" : "#4338ca" }}>(optional — 2 mins)</span></span>
        <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700 }}>▼</span>
      </button>
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {sessionGoal && <div style={{ padding: "8px 12px", borderRadius: 8, background: D ? "#1e2537" : "#f9fafb", fontSize: 12, color: D ? "#9ca3af" : "#6b7280" }}>
          🎯 Goal: <em>{sessionGoal}</em>
        </div>}
        {[
          { key: "understood", label: "✅ What did I understand well?", val: understood, set: setU, ph: "e.g. The stages of mitosis" },
          { key: "unclear", label: "❓ What is still unclear?", val: unclear, set: setC, ph: "e.g. Why ATP is needed" },
          { key: "improve", label: "🔄 What will I do differently next time?", val: improve, set: setI, ph: "e.g. Test myself without notes first" },
        ].map(field => (
          <div key={field.key}>
            <label style={{ fontSize: 11, fontWeight: 600, color: D ? "#9ca3af" : "#6b7280", display: "block", marginBottom: 4 }}>{field.label}</label>
            <textarea value={field.val} onChange={e => field.set(e.target.value)} rows={2}
              placeholder={field.ph}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${bd2}`, background: D ? "#1e2537" : "#f9fafb", color: D ? "#e8ecf4" : "#111827", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={onSkip} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${bd2}`, background: "transparent", color: D ? "#9ca3af" : "#6b7280", cursor: "pointer", fontSize: 12 }}>Skip</button>
          <button onClick={handleSave} style={{ flex: 2, padding: "9px 0", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save Reflection ✓</button>
        </div>
      </div>
    </div>
  );
}

export function StudyJournalTab({ D, entries, mu2, tx2 }) {
  if (!entries || !entries.length) return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <p style={{ fontSize: 28, marginBottom: 8 }}>📔</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: tx2, marginBottom: 4 }}>No reflections yet</p>
      <p style={{ fontSize: 12, color: mu2 }}>Complete a study session and add a reflection to start your journal.</p>
    </div>
  );
  return (
    <div className="fade-in">
      {[...entries].reverse().map((entry, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 4 }} />
            {i < entries.length - 1 && <div style={{ width: 2, flex: 1, background: D ? "#2a3347" : "#e5e7eb", marginTop: 4 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: 16 }}>
            <div style={{ fontSize: 11, color: mu2, marginBottom: 4, fontWeight: 600 }}>{entry.date}</div>
            {entry.goal && <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginBottom: 6 }}>🎯 {entry.goal}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entry.reflections?.understood && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: D ? "rgba(16,185,129,.08)" : "#f0fdf4", fontSize: 12, color: D ? "#6ee7b7" : "#15803d" }}>
                  <strong>✅ Understood:</strong> {entry.reflections.understood}
                </div>
              )}
              {entry.reflections?.unclear && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: D ? "rgba(245,158,11,.08)" : "#fffbeb", fontSize: 12, color: D ? "#fcd34d" : "#92400e" }}>
                  <strong>❓ Unclear:</strong> {entry.reflections.unclear}
                </div>
              )}
              {entry.reflections?.improve && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: D ? "rgba(99,102,241,.08)" : "#eef2ff", fontSize: 12, color: D ? "#a5b4fc" : "#4338ca" }}>
                  <strong>🔄 Next time:</strong> {entry.reflections.improve}
                </div>
              )}
              {entry.coaching && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: D ? "rgba(99,102,241,.06)" : "#f8f7ff", border: "1px solid " + (D ? "#4f46e522" : "#c7d2fe"), marginTop: 2 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>🤖 AI Coach</div>
                  {entry.coaching.summary && <p style={{ fontSize: 12, color: D ? "#c7d2fe" : "#3730a3", marginBottom: 4, lineHeight: 1.55 }}>{entry.coaching.summary}</p>}
                  {entry.coaching.keyGap && <p style={{ fontSize: 11, color: mu2, marginBottom: 3 }}><strong>Key gap:</strong> {entry.coaching.keyGap}</p>}
                  {entry.coaching.nextAction && <p style={{ fontSize: 11, color: mu2, marginBottom: 3 }}><strong>Next session:</strong> {entry.coaching.nextAction}</p>}
                  {entry.coaching.encouragement && <p style={{ fontSize: 11, fontStyle: "italic", color: D ? "#a5b4fc" : "#4338ca" }}>{entry.coaching.encouragement}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ... Additional exports like CalibrationGauge, StrategyRecommendation, AdminBar, ImportModal, ManageAccountsModal would be included here exactly as originally written.
