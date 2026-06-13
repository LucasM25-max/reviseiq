import React, { useState } from "react";
import { getDisplayName } from "./coreHelpers.js";

export function ManageAccountsModal({ D, accounts, adminUser, onClose, onDelete }) {
  var users = Object.keys(accounts)
    .filter(function (u) {
      return u !== adminUser;
    })
    .sort();
  var bd = D ? "#374151" : "#e5e7eb";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        zIndex: 9500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={function (e) {
          e.stopPropagation();
        }}
        style={{
          background: D ? "#1e2537" : "#fff",
          borderRadius: 16,
          width: 500,
          maxWidth: "96vw",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 80px rgba(0,0,0,.3)",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid" + bd,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            Manage Accounts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: D ? "#9ca3af" : "#6b7280",
            }}
          ></button>
        </div>
        <div style={{ padding: "14px 22px", flex: 1, overflowY: "auto" }}>
          {users.length === 0 && (
            <p style={{ color: D ? "#9ca3af" : "#6b7280", fontSize: 13 }}>
              No user accounts yet.
            </p>
          )}
          {users.map(function (u) {
            return (
              <div
                key={u}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid" + bd,
                  marginBottom: 8,
                  background: D ? "#161b27" : "#f9fafb",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: D ? "#e8ecf4" : "#111827",
                    }}
                  >
                    {getDisplayName(u)}
                  </div>
                  <div
                    style={{ fontSize: 11, color: D ? "#9ca3af" : "#6b7280" }}
                  >
                    {u}
                  </div>
                </div>
                <button
                  onClick={function () {
                    if (
                      window.confirm(
                        "Delete account for " + u + "? This cannotbe undone.",
                      )
                    )
                      onDelete(u);
                  }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 7,
                    border: "1px solid #ef4444",
                    background: "none",
                    color: "#ef4444",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
        <div
          style={{
            padding: "12px 22px",
            borderTop: "1px solid " + bd,
            textAlign: "right",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 10,
              border: "1px solid" + bd,
              background: "transparent",
              color: D ? "#e5e7eb" : "#374151",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Clo se
          </button>
        </div>
      </div>
    </div>
  );
}

export function ImportModal({ D, subjects, onClose, onDone }) {
  const [raw, setRaw] = React.useState("");
  const [status, setStatus] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const doImport = async () => {
    setLoading(true);
    setStatus(null);
    setMsg("");
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") {
        throw new Error("JSON must be an object");
      }

      const entries = data.subjects ? data.subjects : [data];
      let imported = 0;
      for (const entry of entries) {
        const { id, board, custom, extras, papers } = entry;
        if (!id || !board) {
          throw new Error("Each entry needs 'id' and 'board' fields");
        }
        const subjDef = subjects.find((s) => s.id === id);
        if (!subjDef) {
          throw new Error(
            "Unknown subject id: " +
              id +
              ". Valid ids:" +
              subjects.map((s) => s.id).join(", "),
          );
        }

        if (custom !== undefined) {
          let existing = [];
          try {
            const r = await window.storage.get(
              "gcse:c:" + id + ":" + board,
              true,
            );
            if (r?.value) existing = JSON.parse(r.value);
          } catch (_) {}

          const existingIds = new Set(
            (existing || []).map(function (c) {
              return c.id;
            }),
          );
          const merged = (existing || []).concat(
            (custom || []).filter(function (c) {
              return !existingIds.has(c.id);
            }),
          );
          await window.storage.set(
            "gcse:c:" + id + ":" + board,
            JSON.stringify(merged),
            true,
          );
        }
        if (extras !== undefined) {
          let existing = {};
          try {
            const r = await window.storage.get(
              "gcse:e:" + id + ":" + board,
              true,
            );
            if (r?.value) existing = JSON.parse(r.value);
          } catch (_) {}

          const merged = Object.assign({}, existing);
          Object.keys(extras || {}).forEach(function (secId) {
            const newItems = extras[secId] || {};
            const ex = existing[secId] || {};
            merged[secId] = {};
            ["notes", "flashcards", "questions"].forEach(function (k) {
              const exArr = ex[k] || [];
              const newArr = newItems[k] || [];
              const exIds = new Set(
                exArr.map(function (x) {
                  return x.id;
                }),
              );
              merged[secId][k] = exArr.concat(
                newArr.filter(function (x) {
                  return !exIds.has(x.id);
                }),
              );
            });
          });
          await window.storage.set(
            "gcse:e:" + id + ":" + board,
            JSON.stringify(merged),
            true,
          );
        }
        if (papers !== undefined) {
          let existing = [];
          try {
            const r = await window.storage.get(
              "gcse:p:" + id + ":" + board,
              true,
            );
            if (r?.value) existing = JSON.parse(r.value);
          } catch (_) {}

          const exKeys = new Set(
            (existing || []).map(function (p) {
              return (p.title || "") + (p.year || "");
            }),
          );
          const merged = (existing || []).concat(
            (papers || []).filter(function (p) {
              return !exKeys.has((p.title || "") + (p.year || ""));
            }),
          );
          await window.storage.set(
            "gcse:p:" + id + ":" + board,
            JSON.stringify(merged),
            true,
          );
        }
        imported++;
      }
      setStatus("ok");
      setMsg(
        "✓ Imported " +
          imported +
          " subject" +
          (imported !== 1 ? "s" : "") +
          "successfully. Reload the app to see changes.",
      );
      onDone();
    } catch (e) {
      setStatus("err");
      setMsg("Error: " + e.message);
    }
    setLoading(false);
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        zIndex: 9500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: D ? "#1e2537" : "#fff",
          borderRadius: 16,
          width: 600,
          maxWidth: "96vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 80px rgba(0,0,0,.3)",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
              Import Revision Data
            </h2>
            <p
              style={{
                fontSize: 12,
                color: D ? "#9ca3af" : "#6b7280",
                margin: "4px 0 0",
              }}
            >
              Paste a JSON export below. Will overwrite existing board data for
              that subject.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: D ? "#9ca3af" : "#6b7280",
            }}
          ></button>
        </div>
        <div style={{ padding: "16px 22px", flex: 1, overflowY: "auto" }}>
          <div
            style={{
              marginBottom: 10,
              fontSize: 12,
              color: D ? "#9ca3af" : "#6b7280",
              lineHeight: 1.6,
            }}
          >
            <strong>Expected format:</strong>
            <pre
              style={{
                marginTop: 4,
                padding: "8px 12px",
                borderRadius: 8,
                background: D ? "#161b27" : "#f3f4f6",
                fontSize: 11,
                overflow: "auto",
              }}
            >{`{
"id":"maths", "board":"AQA",\n "custom": [...], "extras": {...}, "papers": [...] }`}</pre>
            Or wrap multiple subjects: <code>{'{ "subjects": [...] }'}</code>
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Paste JSON here…"
            style={{
              width: "100%",
              minHeight: 200,
              borderRadius: 10,
              border: `1px solid ${D ? "#374151" : "#d1d5db"}`,
              background: D ? "#161b27" : "#f9fafb",
              color: D ? "#e8ecf4" : "#111827",
              padding: "10px 14px",
              fontSize: 12,
              fontFamily: "monospace",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          {status && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 14px",
                borderRadius: 8,
                background: status === "ok" ? "#dcfce7" : "#fee2e2",
                color: status === "ok" ? "#15803d" : "#b91c1c",
                fontSize: 13,
              }}
            >
              {msg}
            </div>
          )}
        </div>
        <div
          style={{
            padding: "14px 22px",
            borderTop: `1px solid ${D ? "#374151" : "#e5e7eb"}`,
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              border: `1px solid ${D ? "#374151" : "#d1d5db"}`,
              background: "transparent",
              color: D ? "#e5e7eb" : "#374151",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={doImport}
            disabled={!raw.trim() || loading}
            style={{
              padding: "9px 22px",
              borderRadius: 10,
              border: "none",
              background: loading || !raw.trim() ? "#a5b4fc" : "#6366f1",
              color: "#fff",
              cursor: loading || !raw.trim() ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {loading ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#1f2937",
        color: "#fff",
        textAlign: "center",
        fontSize: 12,
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span> </span>
      <span>You are offline — AI features won't work until you reconnect.</span>
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
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: D ? "#1e2537" : "#fff",
          borderRadius: 16,
          padding: 28,
          width: 320,
          maxWidth: "90vw",
          boxShadow: "0 25px 60px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: D ? "#e8ecf4" : "#111827",
            }}
          >
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: D ? "#9ca3af" : "#6b7280",
            }}
          >
            ×
          </button>
        </div>
        {shortcuts.map(([key, desc], i) =>
          !desc ? (
            <div
              key={i}
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#6366f1",
                textTransform: "uppercase",
                marginTop: i > 0 ? 14 : 0,
                marginBottom: 4,
              }}
            >
              {key}
            </div>
          ) : (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px 0",
                borderBottom: `1px solid ${D ? "#374151" : "#f3f4f6"}`,
              }}
            >
              <kbd
                style={{
                  background: D ? "#374151" : "#f3f4f6",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: D ? "#e8ecf4" : "#1f2937",
                  minWidth: 28,
                  textAlign: "center",
                }}
              >
                {key}
              </kbd>
              <span style={{ fontSize: 13, color: D ? "#d1d5db" : "#374151" }}>
                {desc}
              </span>
            </div>
          ),
        )}
        <p
          style={{
            fontSize: 11,
            color: D ? "#8896b3" : "#9ca3af",
            marginTop: 14,
            textAlign: "center",
          }}
        >
          Press ? to close
        </p>
      </div>
    </div>
  );
}
