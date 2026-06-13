import React, { useState } from "react";
import { _aiWithRetry, _parseAIJson, callAI } from "./aiService.js";

export function SubjMyNotesTab({
  D,
  subjId,
  ucData,
  setModal,
  deleteUCSection,
  tx2,
  mu2,
}) {
  var subjUCData = ucData[subjId] || { sections: [] };
  var bd2 = D ? "#374151" : "#ede9fe";
  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            My Notes &amp; Flashcards
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: mu2 }}>
            Private to you — only you can see this content
          </p>
        </div>
        <button
          onClick={function () {
            setModal({ mode: "uc-new-section", subjId: subjId });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#7c3aed",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ＋ New Section
        </button>
      </div>
      {subjUCData.sections.length === 0 && (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            borderRadius: 12,
            border: "1.5px dashed #7c3aed",
            background: D ? "rgba(99,102,241,.04)" : "#fafaff",
          }}
        >
          <p style={{ fontSize: 28, margin: "0 0 8px" }}> </p>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: "0 0 4px",
              color: tx2,
            }}
          >
            No personal notes yet
          </p>
          <p style={{ fontSize: 12, color: mu2, margin: 0 }}>
            Create a section to start adding your own notes, flashcards and
            questions — or use AI to generate them from text or images.
          </p>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: 12,
        }}
      >
        {subjUCData.sections.map(function (sec) {
          return (
            <div
              key={sec.id}
              style={{
                border: "1.5px solid #7c3aed",
                borderRadius: 12,
                overflow: "hidden",
                background: D ? "rgba(99,102,241,.04)" : "#fafaff",
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={function () {
                  setModal({ mode: "uc-section", subjId: subjId, sec: sec });
                }}
                onKeyDown={function (e) {
                  if (e.key === "Enter")
                    setModal({ mode: "uc-section", subjId: subjId, sec: sec });
                }}
                style={{ padding: "12px 14px", cursor: "pointer", color: tx2 }}
                onMouseEnter={function (e) {
                  e.currentTarget.style.background = D
                    ? "rgba(99,102,241,.1)"
                    : "#f5f3ff";
                }}
                onMouseLeave={function (e) {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {sec.title}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      background: "#7c3aed",
                      color: "#fff",
                      padding: "2px 6px",
                      borderRadius: 6,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    MY NOTES
                  </span>
                </div>
                <div
                  style={{ display: "flex", gap: 10, fontSize: 11, color: mu2 }}
                >
                  <span>{(sec.notes || []).length}</span>
                  <span>{(sec.flashcards || []).length}</span>
                  <span>{(sec.questions || []).length}</span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  borderTop: "1px solid" + bd2,
                  background: D ? "rgba(0,0,0,.15)" : "rgba(99,102,241,.06)",
                }}
              >
                <button
                  onClick={function () {
                    setModal({ mode: "uc-section", subjId: subjId, sec: sec });
                  }}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    fontSize: 11,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#7c3aed",
                    fontWeight: 600,
                  }}
                >
                  Open
                </button>
                <button
                  onClick={function () {
                    if (window.confirm("Delete thissection?"))
                      deleteUCSection(subjId, sec.id);
                  }}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    fontSize: 11,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#ef4444",
                    fontWeight: 600,
                    borderLeft: "1px solid " + bd2,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AppFooter({ D, onContact }) {
  var bg2 = D ? "#0d1117" : "#f9fafb";
  var border = D ? "#1c1d30" : "#e5e7eb";
  return (
    <footer
      style={{
        borderTop: "1px solid " + border,
        background: bg2,
        padding: "20px 24px",
        marginTop: 40,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: D ? "#8896b3" : "#9ca3af",
            lineHeight: 1.6,
          }}
        >
          <span style={{ fontWeight: 600, color: D ? "#9ca3af" : "#6b7280" }}>
            ReviseIQ
          </span>
          {" · "}Built with the help of{" "}
          <span style={{ color: "#f97316" }}>Claude</span>
          {", AI powered by "}
          <span style={{ color: "#10a37f" }}>Llama via Groq</span>
          {" · "}
          <span style={{ fontSize: 11 }}>
            Not affiliated with Anthropic or Groq.
          </span>
        </div>
        <button
          onClick={onContact}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#7c3aed",
            background: "none",
            border: "1px solid #7c3aed",
            borderRadius: 8,
            padding: "6px 14px",
            cursor: "pointer",
          }}
        >
          Contact Us
        </button>
      </div>
    </footer>
  );
}

export function _psId(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30) +
    "-" +
    Math.random().to;
  String(36).slice(2, 6);
}

export function CreatePersonalSubjectModal({ D, onSave, onClose }) {
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState(" ");
  const [color, setColor] = React.useState("#7c3aed");
  var icons = [
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
  ];
  var colors = [
    "#7c3aed",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#a855f7",
    "#ec4899",
    "#0f766e",
    "#d97706",
    "#3b82f6",
  ];
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
          background: D ? "#191a2b" : "#fff",
          borderRadius: 16,
          width: 440,
          maxWidth: "96vw",
          boxShadow: "0 30px 80px rgba(0,0,0,.3)",
          padding: 28,
        }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>
          New Personal Subject
        </h2>
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
            Subject Name *
          </label>
          <input
            value={name}
            onChange={function (e) {
              setName(e.target.value);
            }}
            placeholder="e.g.Spanish Vocabulary, Piano Theory…"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid" + bd,
              background: D ? "#13131f" : "#f9fafb",
              color: D ? "#e8ecf4" : "#111827",
              fontSize: 13,
            }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: D ? "#9ca3af" : "#6b7280",
              display: "block",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Icon
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {icons.map(function (ic) {
              return (
                <button
                  key={ic}
                  onClick={function () {
                    setIcon(ic);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: "2px solid" + (ic === icon ? color : bd),
                    background: ic === icon ? color + "22" : "transparent",
                    fontSize: 18,
                    cursor: "pointer",
                  }}
                >
                  {ic}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: D ? "#9ca3af" : "#6b7280",
              display: "block",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Colour
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {colors.map(function (c) {
              return (
                <button
                  key={c}
                  onClick={function () {
                    setColor(c);
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: c,
                    border:
                      c === color ? "3px solid" + c : "2px solid transparent",
                    boxShadow:
                      c === color ? "0 0 0 2px white, 0 0 0 4px" + c : "none",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 10,
              border: "1px solid" + bd,
              background: "transparent",
              color: D ? "#e5e7eb" : "#374151",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Can cel
          </button>
          <button
            disabled={!name.trim()}
            onClick={function () {
              if (!name.trim()) return;
              onSave({
                id: _psId(name),
                name: name.trim(),
                icon: icon,
                accent: color,
                light: color + "18",
                mid: color + "28",
                topics: [],
              });
            }}
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              border: "none",
              background: name.trim() ? "#7c3aed" : "#d1d5db",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            Create Subject
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddPersonalTopicModal({ D, onSave, onClose }) {
  const [title, setTitle] = React.useState("");
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
          background: D ? "#191a2b" : "#fff",
          borderRadius: 16,
          width: 380,
          maxWidth: "96vw",
          boxShadow: "0 30px 80px rgba(0,0,0,.3)",
          padding: 28,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          ＋ Add Topic
        </h2>
        <input
          autoFocus
          value={title}
          onChange={function (e) {
            setTitle(e.target.value);
          }}
          onKeyDown={function (e) {
            if (e.key === "Enter" && title.trim())
              onSave({
                id: _psId(title),
                title: title.trim(),
                notes: [],
                flashcards: [],
              });
          }}
          placeholder="Topic title…"
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid" + bd,
            background: D ? "#13131f" : "#f9fafb",
            color: D ? "#e8ecf4" : "#111827",
            fontSize: 13,
            marginBottom: 16,
          }}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 9,
              border: "1px solid" + bd,
              background: "transparent",
              color: D ? "#e5e7eb" : "#374151",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Can cel
          </button>
          <button
            disabled={!title.trim()}
            onClick={function () {
              if (title.trim())
                onSave({
                  id: _psId(title),
                  title: title.trim(),
                  notes: [],
                  flashcards: [],
                });
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 9,
              border: "none",
              background: title.trim() ? "#7c3aed" : "#d1d5db",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: title.trim() ? "pointer" : "not-allowed",
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export function PersonalSectionScreen({ D, subj, topic, user, onBack, onSave }) {
  const [noteText, setNoteText] = React.useState("");
  const [fcFront, setFcFront] = React.useState("");
  const [fcBack, setFcBack] = React.useState("");
  const [aiText, setAiText] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiErr, setAiErr] = React.useState("");
  const [tab, setTab] = React.useState("notes");
  const [flip, setFlip] = React.useState(false);
  const [fcIdx, setFcIdx] = React.useState(0);
  var bd = D ? "#374151" : "#e5e7eb";

  var tx2 = D ? "#e8ecf4" : "#111827";
  var bg = D ? "#13131f" : "#f9fafb";
  var notes = topic.notes || [];
  var flashcards = topic.flashcards || [];
  function addNote() {
    if (!noteText.trim()) return;
    var n = { id: _psId(noteText), text: noteText.trim(), created: Date.now() };
    onSave({ ...topic, notes: [...notes, n] });
    setNoteText("");
  }
  function deleteNote(id) {
    onSave({
      ...topic,
      notes: notes.filter(function (n) {
        return n.id !== id;
      }),
    });
  }
  function addFlashcard() {
    if (!fcFront.trim() || !fcBack.trim()) return;
    var fc = { id: _psId(fcFront), front: fcFront.trim(), back: fcBack.trim() };
    onSave({ ...topic, flashcards: [...flashcards, fc] });
    setFcFront("");
    setFcBack("");
  }
  function deleteFlashcard(id) {
    onSave({
      ...topic,
      flashcards: flashcards.filter(function (f) {
        return f.id !== id;
      }),
    });
    if (fcIdx >= flashcards.length - 1)
      setFcIdx(Math.max(0, flashcards.length - 2));
  }
  function generateFromText() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiErr("");
    var topicSnap = topic;
    var notesSnap = notes;
    var flashcardsSnap = flashcards;
    if (tab === "notes") {
      var pNotes =
        "You are a study assistant. The user has pasted the following text. Extract thekey facts and turn them into clear, concise bullet-point notes. Return ONLY the notes as a plaintext list, one point per line starting with •.\n\n" +
        aiText;
      _aiWithRetry(
        function () {
          return callAI(pNotes, 1200);
        },
        2,
        function () {
          return "• Notes could not be generated — try adding more content.";
        },
      )
        .then(function (result) {
          var ls = (result || "").split("\n").filter(function (l) {
            return l.trim();
          });
          var newNotes = ls.length
            ? ls
                .map(function (l) {
                  return {
                    id: _psId(l),
                    text: l.replace(/^•\s*/, "").trim(),
                    created: Date.now(),
                  };
                })
                .filter(function (n) {
                  return n.text;
                })
            : [
                {
                  id: _psId("fallback"),
                  text: "Could not generate notes — paste more content and tryagain.",
                  created: Date.now(),
                },
              ];
          onSave(
            Object.assign({}, topicSnap, { notes: notesSnap.concat(newNotes) }),
          );
          setAiText("");
          setAiLoading(false);
        })
        .catch(function (e) {
          setAiErr(e.message || "AI error — try again");
          setAiLoading(false);
        });
    } else {
      var pFc =
        'You are a study assistant. The user has pasted the following text. Create 6-10flashcard question-answer pairs covering the key facts. Return ONLY valid JSON (nomarkdown): [{"front":"question","back":"answer"}]\n\n' +
        aiText;
      _aiWithRetry(
        function () {
          return callAI(pFc, 1200).then(function (raw) {
            var parsed = _parseAIJson(raw);
            if (!Array.isArray(parsed) || !parsed.length)
              throw new Error("No flashcards returned");
            return parsed;
          });
        },
        2,
        function () {
          return [];
        },
      )
        .then(function (arr) {
          var newFcs = (arr || [])
            .map(function (item) {
              return {
                id: _psId(item.front || "fc"),
                front: (item.front || "").trim(),
                back: (item.back || "").trim(),
              };
            })
            .filter(function (f) {
              return f.front && f.back;
            });
          if (newFcs.length > 0) {
            onSave(
              Object.assign({}, topicSnap, {
                flashcards: flashcardsSnap.concat(newFcs),
              }),
            );
          } else {
            setAiErr(
              "No flashcards could be generated — try adding more detailed content.",
            );
          }
          setAiText("");
          setAiLoading(false);
        })
        .catch(function (e) {
          setAiErr(e.message || "AI error — try again");
          setAiLoading(false);
        });
    }
  }
  var curFc = flashcards[fcIdx] || null;

  return (
    <div
      style={{ minHeight: "100vh", background: bg, color: tx2 }}
      className="fade-in"
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <button
          onClick={onBack}
          style={{
            fontSize: 13,
            color: D ? "#9ca3af" : "#6b7280",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          {" "}
          Back
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: subj.accent + "22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            {subj.icon}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              {topic.title}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: D ? "#9ca3af" : "#6b7280",
                margin: 0,
              }}
            >
              {subj.name} · Personal
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderBottom: "1px solid " + bd,
            marginBottom: 20,
            gap: 2,
          }}
        >
          {[
            ["notes", "Notes"],
            ["flashcards", "Flashcards"],
          ].map(function (pair) {
            var t = pair[0],
              label = pair[1];
            return (
              <button
                key={t}
                onClick={function () {
                  setTab(t);
                  setFlip(false);
                }}
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? subj.accent : D ? "#9ca3af" : "#6b7280",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom:
                    tab === t
                      ? "2px solid" + subj.accent
                      : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        {}
        <div
          style={{
            background: D ? "#191a2b" : "#fff",
            border: "1px solid" + bd,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: D ? "#9ca3af" : "#6b7280",
              marginBottom: 8,
            }}
          >
            AI Generate {tab === "notes" ? "Notes" : "Flashcards"} from Text
          </div>
          <textarea
            value={aiText}
            onChange={function (e) {
              setAiText(e.target.value);
            }}
            placeholder={
              "Paste any text, paragraphs or notes here and AI will generate " +
              (tab === "notes" ? "bullet-point notes" : "flashcard pairs") +
              " from it…"
            }
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid" + bd,
              background: D ? "#13131f" : "#f9fafb",
              color: tx2,
              fontSize: 12,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          {aiErr && (
            <p style={{ fontSize: 12, color: "#ef4444", margin: "6px 0 0" }}>
              {aiErr}
            </p>
          )}
          <button
            disabled={!aiText.trim() || aiLoading}
            onClick={generateFromText}
            style={{
              marginTop: 8,
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: aiText.trim() && !aiLoading ? subj.accent : "#d1d5db",
              color: "#fff",
              fontWeight: 600,
              fontSize: 12,
              cursor: aiText.trim() && !aiLoading ? "pointer" : "not-allowed",
            }}
          >
            {aiLoading ? "Generating…" : "Generate"}
          </button>
        </div>

        {tab === "notes" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                value={noteText}
                onChange={function (e) {
                  setNoteText(e.target.value);
                }}
                onKeyDown={function (e) {
                  if (e.key === "Enter") addNote();
                }}
                placeholder="Add a note…"
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid" + bd,
                  background: D ? "#13131f" : "#f9fafb",
                  color: tx2,
                  fontSize: 13,
                }}
              />
              <button
                disabled={!noteText.trim()}
                onClick={addNote}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: noteText.trim() ? subj.accent : "#d1d5db",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: noteText.trim() ? "pointer" : "not-allowed",
                }}
              >
                Add
              </button>
            </div>
            {notes.length === 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: D ? "#9ca3af" : "#6b7280",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                No notes yet. Add one above or use AI to generate from text.
              </p>
            )}
            {notes.map(function (n) {
              return (
                <div
                  key={n.id}
                  style={{
                    background: D ? "#191a2b" : "#fff",
                    border: "1px solid" + bd,
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.7,
                      margin: 0,
                      flex: 1,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {n.text}
                  </p>
                  <button
                    onClick={function () {
                      deleteNote(n.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 14,
                      flexShrink: 0,
                      padding: "0 4px",
                    }}
                  ></button>
                </div>
              );
            })}
          </div>
        )}
        {tab === "flashcards" && (
          <div>
            {curFc ? (
              <div style={{ marginBottom: 20 }}>
                <div
                  onClick={function () {
                    setFlip(function (f) {
                      return !f;
                    });
                  }}
                  style={{
                    cursor: "pointer",
                    background: D ? "#191a2b" : "#fff",
                    border: "2px solid" + subj.accent,
                    borderRadius: 16,
                    padding: "32px 24px",
                    textAlign: "center",
                    minHeight: 140,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    userSelect: "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: subj.accent,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 8,
                    }}
                  >
                    {flip ? "Answer" : "Question"}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {flip ? curFc.back : curFc.front}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: D ? "#8896b3" : "#9ca3af",
                      marginTop: 10,
                    }}
                  >
                    Tap to flip
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <button
                    disabled={fcIdx === 0}
                    onClick={function () {
                      setFcIdx(function (i) {
                        return i - 1;
                      });
                      setFlip(false);
                    }}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 8,
                      border: "1px solid" + bd,
                      background: "transparent",
                      color: D ? "#e5e7eb" : "#374151",
                      cursor: fcIdx === 0 ? "not-allowed" : "pointer",
                      opacity: fcIdx === 0 ? 0.4 : 1,
                    }}
                  >
                    {" "}
                    Prev
                  </button>
                  <span
                    style={{ fontSize: 12, color: D ? "#9ca3af" : "#6b7280" }}
                  >
                    {fcIdx + 1} /{flashcards.length}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={function () {
                        deleteFlashcard(curFc.id);
                      }}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 8,
                        border: "1px solid #ef4444",
                        background: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Delete
                    </button>
                    <button
                      disabled={fcIdx >= flashcards.length - 1}
                      onClick={function () {
                        setFcIdx(function (i) {
                          return i + 1;
                        });
                        setFlip(false);
                      }}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 8,
                        border: "1px solid" + bd,
                        background: "transparent",
                        color: D ? "#e5e7eb" : "#374151",
                        cursor:
                          fcIdx >= flashcards.length - 1
                            ? "not-allowed"
                            : "pointer",
                        opacity: fcIdx >= flashcards.length - 1 ? 0.4 : 1,
                      }}
                    >
                      Next{" "}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: D ? "#9ca3af" : "#6b7280",
                  textAlign: "center",
                  padding: "24px 0",
                }}
              >
                No flashcards yet. Add some below or use AI to generate from
                text.
              </p>
            )}
            <div
              style={{
                background: D ? "#191a2b" : "#fff",
                border: "1px solid" + bd,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: D ? "#9ca3af" : "#6b7280",
                  marginBottom: 10,
                }}
              >
                ＋ Add Flashcard
              </div>
              <input
                value={fcFront}
                onChange={function (e) {
                  setFcFront(e.target.value);
                }}
                placeholder="Front (question / term)"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 7,
                  border: "1px solid" + bd,
                  background: D ? "#13131f" : "#f9fafb",
                  color: tx2,
                  fontSize: 13,
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
              />
              <input
                value={fcBack}
                onChange={function (e) {
                  setFcBack(e.target.value);
                }}
                placeholder="Back (answer / definition)"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 7,
                  border: "1px solid" + bd,
                  background: D ? "#13131f" : "#f9fafb",
                  color: tx2,
                  fontSize: 13,
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
              />
              <button
                disabled={!fcFront.trim() || !fcBack.trim()}
                onClick={addFlashcard}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    fcFront.trim() && fcBack.trim() ? subj.accent : "#d1d5db",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor:
                    fcFront.trim() && fcBack.trim() ? "pointer" : "notallowed",
                }}
              >
                Add Flashcard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PersonalSubjectScreen({
  D,
  subj,
  personalSubjects,
  onBack,
  onSaveSubjects,
  user,
}) {
  const [addTopicOpen, setAddTopicOpen] = React.useState(false);
  const [activeTopic, setActiveTopic] = React.useState(null);
  const [editingName, setEditingName] = React.useState(false);
  const [newName, setNewName] = React.useState(subj.name);
  var bd = D ? "#374151" : "#e5e7eb";
  var bg = D ? "#13131f" : "#f9fafb";
  var tx2 = D ? "#e8ecf4" : "#111827";
  if (activeTopic) {
    function saveTopicData(updated) {
      var newSubj = {
        ...subj,
        topics: subj.topics.map(function (t) {
          return t.id === updated.id ? updated : t;
        }),
      };
      var newPs = personalSubjects.map(function (s) {
        return s.id === subj.id ? newSubj : s;
      });
      onSaveSubjects(newPs);
    }
    return (
      <PersonalSectionScreen
        D={D}
        subj={subj}
        topic={activeTopic}
        user={user}
        onBack={function () {
          setActiveTopic(null);
        }}
        onSave={saveTopicData}
      />
    );
  }

  function deleteSelf() {
    if (
      window.confirm(
        "Delete subject " +
          subj.name +
          " and all its content? This cannot beundone.",
      )
    )
      onSaveSubjects(
        personalSubjects.filter(function (s) {
          return s.id !== subj.id;
        }),
      );
  }
  function deleteTopic(id) {
    var newSubj = {
      ...subj,
      topics: subj.topics.filter(function (t) {
        return t.id !== id;
      }),
    };
    onSaveSubjects(
      personalSubjects.map(function (s) {
        return s.id === subj.id ? newSubj : s;
      }),
    );
  }
  return (
    <div
      style={{ minHeight: "100vh", background: bg, color: tx2 }}
      className="fade-in"
    >
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
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
          My Subjects
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: subj.accent + "22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            {subj.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <input
                autoFocus
                value={newName}
                onChange={function (e) {
                  setNewName(e.target.value);
                }}
                onBlur={function () {
                  if (newName.trim()) {
                    var ns = { ...subj, name: newName.trim() };
                    onSaveSubjects(
                      personalSubjects.map(function (s) {
                        return s.id === subj.id ? ns : s;
                      }),
                    );
                  }
                  setEditingName(false);
                }}
                onKeyDown={function (e) {
                  if (e.key === "Enter") {
                    if (newName.trim()) {
                      var ns = { ...subj, name: newName.trim() };
                      onSaveSubjects(
                        personalSubjects.map(function (s) {
                          return s.id === subj.id ? ns : s;
                        }),
                      );
                    }
                    setEditingName(false);
                  }
                  if (e.key === "Escape") setEditingName(false);
                }}
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  border: "2px solid" + subj.accent,
                  borderRadius: 8,
                  padding: "4px 10px",
                  background: "transparent",
                  color: tx2,
                  width: "100%",
                }}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                  {subj.name}
                </h2>
                <button
                  onClick={function () {
                    setEditingName(true);
                    setNewName(subj.name);
                  }}
                  style={{
                    background: "none",
                    border: "1px solid #9ca3af",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#9ca3af",
                    padding: "3px 8px",
                  }}
                >
                  {" "}
                </button>
              </div>
            )}

            <p
              style={{
                fontSize: 12,
                color: D ? "#9ca3af" : "#6b7280",
                margin: "4px 0 0",
              }}
            >
              Personal Subject · Only visible to you
            </p>
          </div>
          <button
            onClick={deleteSelf}
            style={{
              padding: "7px 14px",
              borderRadius: 9,
              border: "1px solid #ef4444",
              background: "none",
              color: "#ef4444",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Dele te Subject
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Topics</h3>
          <button
            onClick={function () {
              setAddTopicOpen(true);
            }}
            style={{
              padding: "7px 16px",
              borderRadius: 9,
              border: "none",
              background: subj.accent,
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ＋ Add Topic
          </button>
        </div>
        {subj.topics.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: D ? "#9ca3af" : "#6b7280",
              fontSize: 13,
            }}
          >
            No topics yet — add one above to get started.
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
            gap: 12,
          }}
        >
          {subj.topics.map(function (t) {
            return (
              <div key={t.id} style={{ position: "relative" }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={function () {
                    setActiveTopic(t);
                  }}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1.5px solid" + bd,
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all .15s",
                    color: tx2,
                  }}
                  onMouseEnter={function (e) {
                    e.currentTarget.style.borderColor = subj.accent;
                    e.currentTarget.style.background = subj.accent + "12";
                  }}
                  onMouseLeave={function (e) {
                    e.currentTarget.style.borderColor = bd;
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      marginBottom: 6,
                      paddingRight: 28,
                    }}
                  >
                    {t.title}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span
                      style={{ fontSize: 11, color: D ? "#9ca3af" : "#6b7280" }}
                    >
                      {(t.notes || []).length}
                    </span>
                    <span
                      style={{ fontSize: 11, color: D ? "#9ca3af" : "#6b7280" }}
                    >
                      {(t.flashcards || []).length}
                    </span>
                  </div>
                </div>
                <button
                  onClick={function () {
                    deleteTopic(t.id);
                  }}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "#fee2e2",
                    border: "1.5px solid📝🃏#ef4444",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontSize: 10,
                    color: "#ef4444",
                    padding: "2px 6px",
                    fontWeight: 700,
                  }}
                ></button>
              </div>
            );
          })}
        </div>
        {addTopicOpen && (
          <AddPersonalTopicModal
            D={D}
            onClose={function () {
              setAddTopicOpen(false);
            }}
            onSave={function (t) {
              var newSubj = { ...subj, topics: [...subj.topics, t] };
              onSaveSubjects(
                personalSubjects.map(function (s) {
                  return s.id === subj.id ? newSubj : s;
                }),
              );
              setAddTopicOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
