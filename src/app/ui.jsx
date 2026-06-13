import React, { useState, useEffect } from "react";

export const C = (D) => ({
  background: D ? "#161b27" : "#ffffff",
  border: `1px solid ${D ? "#252d3f" : "#eceef2"}`,
  borderRadius: 18,
  boxShadow: D
    ? "0 1px 2px rgba(0,0,0,.4), 0 10px 30px -16px rgba(0,0,0,.7)"
    : "0 1px 2px rgba(16,24,40,.04), 0 14px 34px -18px rgba(16,24,40,.14)",
});

export const I = (D, x = {}) => ({
  width: "100%",
  background: D ? "#1a2133" : "#fff",
  border: `1.5px solid ${D ? "#2f3a52" : "#dde1e9"}`,
  borderRadius: 12,
  padding: "11px 14px",
  fontSize: 14,
  outline: "none",
  color: D ? "#e8ecf4" : "#111827",
  transition: "border-color .18s ease, box-shadow .18s ease",
  boxSizing: "border-box",
  ...x,
});

export const B = (color, outline, extra = {}) => ({
  padding: "10px 18px",
  borderRadius: 12,
  border: outline ? `1.5px solid ${color}` : "1px solid transparent",
  background: outline ? "transparent" : color,
  color: outline ? color : "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: ".01em",
  transition:
    "transform .15s ease, box-shadow .15s ease, filter .15s ease, background .15s ease",
  boxShadow: outline || !color ? "none" : `0 1px 2px rgba(16,24,40,.14), 0 8px 18px -10px ${color}`,
  ...extra,
});

export const mu = (D) => (D ? "#94a3c4" : "#6b7280");

export const tx = (D) => (D ? "#eef2fb" : "#0f172a");

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 9)
    : Math.random().toString(36).slice(2, 9);

export const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, "").trim();

export const _analyticsQueue = [];

export let _analyticsFlushing = false;

export async function _flushAnalytics() {
  if (_analyticsFlushing || !_analyticsQueue.length) return;
  _analyticsFlushing = true;
  const batch = _analyticsQueue.splice(0, 20);

  try {
    const dayKey = "gcse:analytics:" + new Date().toISOString().slice(0, 10);
    let existing = [];
    try {
      const r = await window.storage.get(dayKey, true);
      if (r?.value) existing = JSON.parse(r.value);
    } catch (_) {}
    await window.storage.set(
      dayKey,
      JSON.stringify([...existing, ...batch]),
      true,
    );
  } catch (_) {}
  _analyticsFlushing = false;
  if (_analyticsQueue.length) setTimeout(_flushAnalytics, 500);
}

export function trackEvent(event, props = {}) {
  _analyticsQueue.push({
    event,
    ts: Date.now(),
    screen: props.screen || null,
    subjectId: props.subjectId || null,
    sectionId: props.sectionId || null,
    tab: props.tab || null,
    value: props.value !== undefined ? props.value : null,
  });
  setTimeout(_flushAnalytics, 1000);
}

export const GRADES = ["U", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const pctToGrade = (pct) =>
  pct >= 90
    ? "9"
    : pct >= 80
      ? "8"
      : pct >= 70
        ? "7"
        : pct >= 60
          ? "6"
          : pct >= 50
            ? "5"
            : pct >= 40
              ? "4"
              : pct >= 30
                ? "3"
                : pct >= 20
                  ? "2"
                  : pct >= 10
                    ? "1"
                    : "U";

export const gradeColor = (g) =>
  ({
    9: "#7c3aed",
    8: "#2563eb",
    7: "#0891b2",
    6: "#16a34a",
    5: "#65a30d",
    4: "#ca8a04",
    3: "#d97706",
    2: "#ea580c",
    1: "#dc2626",
    U: "#9ca3af",
  })[g] || "#9ca3af";

export let _toastListeners = [];

export function _emitToast(msg, type = "success", duration = 2200) {
  _toastListeners.forEach((fn) => fn({ id: uid(), msg, type, duration }));
}

export function showToast(msg, type, duration) {
  _emitToast(msg, type, duration);
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
    { id: "home", icon: " ", label: "Home", fn: onHome },
    { id: "study", icon: " ", label: "Study", fn: onStudy },
    { id: "progress", icon: " ", label: "Progress", fn: onProgress },
    { id: "tutor", icon: " ", label: "Tutor", fn: onTutor },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: D ? "#161b27" : "#fff",
        borderTop: `1px solid ${D ? "#2a3347" : "#e5e7eb"}`,
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -4px 20px rgba(0,0,0,.08)",
      }}
    >
      {items.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={item.fn}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 0 8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              gap: 3,
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                color: active ? "#6366f1" : D ? "#8896b3" : "#9ca3af",
              }}
            >
              {item.label}
            </span>
            {active && (
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#6366f1",
                  marginTop: 1,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const fn = (t) => {
      setToasts((p) => [...p, { ...t, leaving: false }]);
      setTimeout(() => {
        setToasts((p) =>
          p.map((x) => (x.id === t.id ? { ...x, leaving: true } : x)),
        );
        setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 220);
      }, t.duration || 2200);
    };
    _toastListeners.push(fn);
    return () => {
      _toastListeners = _toastListeners.filter((f) => f !== fn);
    };
  }, []);
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={t.leaving ? "toast-out" : "toast-in"}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background:
              t.type === "error"
                ? "#ef4444"
                : t.type === "warn"
                  ? "#f59e0b"
                  : "#10b981",
            boxShadow: "0 4px 20px rgba(0,0,0,.2)",
            whiteSpace: "nowrap",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
