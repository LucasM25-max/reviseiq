import React, { useState, useEffect } from "react";

export var SK_MSGS = "gcse:contact-msgs";

export function ContactScreen({ D, user, isAdmin, onBack }) {
  var [tab, setTab] = useState(isAdmin ? "inbox" : "send");
  var [year, setYear] = useState("");
  var [msg, setMsg] = useState("");
  var [sent, setSent] = useState(false);
  var [sending, setSending] = useState(false);
  var [msgs, setMsgs] = useState([]);
  var [readIds, setReadIds] = useState(new Set());
  var [replyText, setReplyText] = useState({});
  var [replyingSending, setRS] = useState({});
  var bd = D ? "#1f2937" : "#e5e7eb";
  var SK_READ = "gcse:contact-read:" + (user || "").replace(/\W/g, "-");
  useEffect(function () {
    loadMsgs();

    window.storage
      .get(SK_READ, true)
      .then(function (r) {
        try {
          if (r && r.value) {
            var ids = JSON.parse(r.value);
            if (Array.isArray(ids)) setReadIds(new Set(ids));
          }
        } catch (e) {}
      })
      .catch(function () {});
  }, []);

  useEffect(
    function () {
      if (tab !== "inbox" || !isAdmin || !msgs.length) return;

      var ids = new Set(
        msgs.map(function (m) {
          return m.id;
        }),
      );
      setReadIds(ids);
      window.storage
        .set(SK_READ, JSON.stringify([...ids]), true)
        .catch(function () {});
    },
    [tab, msgs.length],
  );
  function loadMsgs() {
    window.storage
      .get(SK_MSGS, true)
      .then(function (r) {
        try {
          if (r && r.value) {
            var arr = JSON.parse(r.value);
            if (Array.isArray(arr)) setMsgs(arr);
          }
        } catch (e) {}
      })
      .catch(function () {});
  }
  function handleSend() {
    if (!msg.trim()) return;
    setSending(true);
    var newEntry = {
      id: Math.random().toString(36).slice(2, 9),
      from: user,
      name: user,
      yearGroup: year,
      message: msg.trim(),
      timestamp: Date.now(),
      thread: [],
    };

    var doWrite = function (existing) {
      var arr = [newEntry].concat(existing);
      window.storage
        .set(SK_MSGS, JSON.stringify(arr), true)
        .then(function () {
          setMsgs(arr);
          setMsg("");
          setSent(true);
          setSending(false);
        })
        .catch(function (e) {
          setSending(false);
        });
    };
    window.storage
      .get(SK_MSGS, true)
      .then(function (r) {
        var existing = [];
        try {
          if (r && r.value) {
            var p = JSON.parse(r.value);
            if (Array.isArray(p)) existing = p;
          }
        } catch (e) {}
        doWrite(existing);
      })
      .catch(function () {
        doWrite([]);
      });
  }
  function handleReply(msgId) {
    var txt = (replyText[msgId] || "").trim();
    if (!txt) return;
    setRS(function (p) {
      return Object.assign({}, p, { [msgId]: true });
    });
    var doWrite = function (existing) {
      var updated = existing.map(function (m) {
        if (m.id !== msgId) return m;

        return;
        Object.assign({}, m, {
          thread: (m.thread || []).concat([
            { from: user, text: txt, timestamp: Date.now() },
          ]),
        });
      });
      window.storage
        .set(SK_MSGS, JSON.stringify(updated), true)
        .then(function () {
          setMsgs(updated);
          setReplyText(function (p) {
            return Object.assign({}, p, { [msgId]: "" });
          });
          setRS(function (p) {
            return Object.assign({}, p, { [msgId]: false });
          });
        })
        .catch(function () {
          setRS(function (p) {
            return Object.assign({}, p, { [msgId]: false });
          });
        });
    };
    window.storage
      .get(SK_MSGS, true)
      .then(function (r) {
        var existing = [];
        try {
          if (r && r.value) {
            var p = JSON.parse(r.value);
            if (Array.isArray(p)) existing = p;
          }
        } catch (e) {}
        doWrite(existing);
      })
      .catch(function () {
        doWrite(msgs);
      });
  }
  function handleDeleteMsg(msgId) {
    var doWrite = function (existing) {
      var updated = existing.filter(function (m) {
        return m.id !== msgId;
      });
      window.storage
        .set(SK_MSGS, JSON.stringify(updated), true)
        .then(function () {
          setMsgs(updated);
        })
        .catch(function () {});
    };
    window.storage
      .get(SK_MSGS, true)
      .then(function (r) {
        var existing = [];
        try {
          if (r && r.value) {
            var p = JSON.parse(r.value);
            if (Array.isArray(p)) existing = p;
          }
        } catch (e) {}
        doWrite(existing);
      })
      .catch(function () {
        doWrite(msgs);
      });
  }
  var myMsgs = msgs.filter(function (m) {
    return m.from === user || m.name === user;
  });
  var bg = D ? "#111827" : "#f9fafb";
  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        color: D ? "#e8ecf4" : "#111827",
      }}
      className="fade-in"
    >
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
        <button
          onClick={onBack}
          style={{
            fontSize: 13,
            color: D ? "#9ca3af" : "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          {" "}
          Back
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Contact Us
        </h2>
        <p
          style={{
            fontSize: 13,
            color: D ? "#9ca3af" : "#6b7280",
            marginBottom: 20,
          }}
        >
          Got a question, issue or suggestion? Send us a message below.
        </p>

        {isAdmin && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["send", "inbox"].map(function (t) {
              return (
                <button
                  key={t}
                  onClick={function () {
                    setTab(t);
                  }}
                  style={{
                    padding: "7px 18px",
                    borderRadius: 8,
                    border: "1.5px solid" + (tab === t ? "#6366f1" : bd),
                    background: tab === t ? "#6366f1" : "none",
                    color: tab === t ? "#fff" : D ? "#d1d5db" : "#374151",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {t === "send"
                    ? "Send Message"
                    : (function () {
                        var unread = msgs.filter(function (m) {
                          return;
                          !readIds.has(m.id);
                        }).length;
                        return (
                          "Inbox" +
                          (unread > 0
                            ? " (" + unread + "new)"
                            : "(" + msgs.length + ")")
                        );
                      })()}
                </button>
              );
            })}
          </div>
        )}

        {tab === "send" && (
          <div
            style={{
              background: D ? "#1e2537" : "#fff",
              border: "1px solid" + bd,
              borderRadius: 14,
              padding: 24,
            }}
          >
            {sent ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}> </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                  Message sent!
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: D ? "#9ca3af" : "#6b7280",
                    marginBottom: 20,
                  }}
                >
                  We'll get back to you as soon as possible.
                </div>
                <button
                  onClick={function () {
                    setSent(false);
                    setMsg("");
                  }}
                  style={{
                    padding: "8px20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#6366f1",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: D ? "#9ca3af" : "#6b7280",
                      display: "block",
                      marginBottom: 5,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Year group{" "}
                    <span style={{ fontWeight: 400, textTransform: "none" }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    value={year}
                    onChange={function (e) {
                      setYear(e.target.value);
                    }}
                    placeholder="e.g. Year 11"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid" + bd,
                      background: D ? "#161b27" : "#f9fafb",
                      color: D ? "#e8ecf4" : "#111827",
                      fontSize: 13,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: D ? "#9ca3af" : "#6b7280",
                      display: "block",
                      marginBottom: 5,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Message *
                  </label>
                  <textarea
                    value={msg}
                    onChange={function (e) {
                      setMsg(e.target.value);
                    }}
                    rows={5}
                    placeholder="Write your message here..."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid" + bd,
                      background: D ? "#161b27" : "#f9fafb",
                      color: D ? "#e8ecf4" : "#111827",
                      fontSize: 13,
                      resize: "vertical",
                    }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !msg.trim()}
                  style={{
                    padding: "10px24px",
                    borderRadius: 8,
                    border: "none",
                    background: !msg.trim() ? "#9ca3af" : "#6366f1",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: !msg.trim() || !user ? "not-allowed" : "pointer",
                  }}
                >
                  {sending ? "Sending…" : "Send Message"}
                </button>
              </div>
            )}
          </div>
        )}
        {tab === "inbox" && isAdmin && (
          <div>
            {msgs.length === 0 && (
              <p style={{ color: D ? "#9ca3af" : "#6b7280", fontSize: 13 }}>
                No messages yet.
              </p>
            )}
            {msgs.map(function (m) {
              return (
                <div
                  key={m.id}
                  style={{
                    background: D ? "#1e2537" : "#fff",
                    border: "1px solid" + bd,
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        {m.name}
                      </span>
                      {m.yearGroup && (
                        <span
                          style={{
                            fontSize: 12,
                            color: D ? "#9ca3af" : "#6b7280",
                            marginLeft: 8,
                          }}
                        >
                          {m.yearGroup}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          color: D ? "#8896b3" : "#9ca3af",
                          marginLeft: 8,
                        }}
                      >
                        @{m.from}
                      </span>
                    </div>
                    <span
                      style={{ fontSize: 11, color: D ? "#8896b3" : "#9ca3af" }}
                    >
                      {new Date(m.timestamp).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      marginBottom: 12,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.message}
                  </p>
                  {(m.thread || []).map(function (r, ri) {
                    return (
                      <div
                        key={ri}
                        style={{
                          borderLeft: "3px solid#6366f1",
                          paddingLeft: 12,
                          marginBottom: 8,
                          marginLeft: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#6366f1",
                            marginBottom: 3,
                          }}
                        >
                          {r.from} ·
                          {new Date(r.timestamp).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {r.text}
                        </p>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <textarea
                      value={replyText[m.id] || ""}
                      onChange={function (e) {
                        var v = e.target.value;
                        setReplyText(function (p) {
                          return Object.assign({}, p, { [m.id]: v });
                        });
                      }}
                      rows={2}
                      placeholder="Reply…"
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: 8,
                        border: "1px solid" + bd,
                        background: D ? "#161b27" : "#f9fafb",
                        color: D ? "#e8ecf4" : "#111827",
                        fontSize: 12,
                        resize: "none",
                      }}
                    />
                    <button
                      onClick={function () {
                        handleReply(m.id);
                      }}
                      disabled={
                        !!(
                          replyingSending[m.id] ||
                          !(replyText[m.id] || "").trim()
                        )
                      }
                      style={{
                        padding: "016px",
                        borderRadius: 8,
                        border: "none",
                        background: "#6366f1",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        alignSelf: "flex-end",
                        height: 36,
                      }}
                    >
                      {replyingSending[m.id] ? "…" : "Reply"}
                    </button>
                    <button
                      onClick={function () {
                        if (window.confirm("Delete thismessage?"))
                          handleDeleteMsg(m.id);
                      }}
                      style={{
                        padding: "0 14px",
                        borderRadius: 8,
                        border: "1px solid#ef4444",
                        background: "none",
                        color: "#ef4444",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        alignSelf: "flex-end",
                        height: 36,
                      }}
                    ></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!isAdmin && myMsgs.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
              Your messages
            </h3>
            {myMsgs.map(function (m) {
              return (
                <div
                  key={m.id}
                  style={{
                    background: D ? "#1e2537" : "#fff",
                    border: "1px solid" + bd,
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      marginBottom: m.thread && m.thread.length ? 10 : 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.message}
                  </p>
                  {(m.thread || []).map(function (r, ri) {
                    return (
                      <div
                        key={ri}
                        style={{
                          borderLeft: "3px solid #10b981",
                          paddingLeft: 12,
                          marginTop: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#10b981",
                            marginBottom: 3,
                          }}
                        >
                          Reply from {r.from}
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {r.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
