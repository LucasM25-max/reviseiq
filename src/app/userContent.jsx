import React, { useState } from "react";
import { _aiRequest, _aiWithRetry, _parseAIJson, aiServiceQuestionGenerator, callAI } from "./aiService.js";
import { DiagramRenderer } from "./diagrams.jsx";
import { B, C, I, mu, showToast, tx } from "./ui.jsx";

export function UCNewSectionModal({ D, onClose, onSave }) {
  var [name, setName] = React.useState("");
  var bd2 = D ? "#262844" : "#e5e7eb";
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        background: "rgba(0,0,0,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          ...C(D),
          padding: 28,
          maxWidth: 420,
          width: "100%",
          borderRadius: 16,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 4,
            color: tx(D),
          }}
        >
          New Personal Section
        </h3>

        <p style={{ fontSize: 12, color: mu(D), marginBottom: 18 }}>
          Private to your account — only you can see it.
        </p>
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: mu(D),
            display: "block",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Section Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={function (e) {
            setName(e.target.value);
          }}
          placeholder="e.g. Cell Biology, Algebra, Macbeth"
          onKeyDown={function (e) {
            if (e.key === "Enter" && name.trim()) onSave(name);
            if (e.key === "Escape") onClose();
          }}
          style={{ ...I(D), marginBottom: 18 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={function () {
              if (name.trim()) onSave(name);
            }}
            disabled={!name.trim()}
            style={{
              flex: 1,
              ...B("#7c3aed", false, {
                padding: "10px 0",
                fontSize: 13,
                fontWeight: 700,
                opacity: name.trim() ? 1 : 0.5,
              }),
            }}
          >
            Create Section
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              ...B("transparent", true, {
                padding: "10px 0",
                fontSize: 13,
                borderColor: bd2,
                color: mu(D),
              }),
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function UCSectionModal({
  D,
  user,
  subjId,
  sec,
  subjects,
  onSaveSection,
  onClose,
}) {
  var [tab, setTab] = React.useState("notes");
  var [flip, setFlip] = React.useState(false);
  var [fcIdx, setFcIdx] = React.useState(0);
  var [qIdx, setQIdx] = React.useState(0);

  var [noteHead, setNoteHead] = React.useState("");
  var [noteBody, setNoteBody] = React.useState("");

  var [fcFront, setFcFront] = React.useState("");
  var [fcBack, setFcBack] = React.useState("");

  var [qType, setQType] = React.useState("short");
  var [qText, setQText] = React.useState("");
  var [qMS, setQMS] = React.useState("");
  var [qMarks, setQMarks] = React.useState(2);
  var [qOptions, setQOptions] = React.useState(["", "", "", ""]);
  var [qAns, setQAns] = React.useState(0);

  var [showAI, setShowAI] = React.useState(false);
  var [aiText, setAiText] = React.useState("");
  var [aiMode, setAiMode] = React.useState("notes");
  var [aiLoading, setAiLoading] = React.useState(false);
  var [aiErr, setAiErr] = React.useState("");
  var [imgLoading, setImgLoading] = React.useState(false);
  var bd2 = D ? "#262844" : "#e5e7eb";
  var subj =
    subjects.find(function (s) {
      return s.id === subjId;
    }) || subjects[0];

  if (!sec) return null;
  var notes = sec.notes || [];
  var fcs = sec.flashcards || [];
  var qs = sec.questions || [];
  var curFC = fcs[Math.min(fcIdx, fcs.length - 1)] || null;
  var curQ = qs[Math.min(qIdx, qs.length - 1)] || null;
  function uid2() {
    return Math.random().toString(36).slice(2, 10);
  }
  function saveNote() {
    if (!noteHead.trim()) return;
    var n = {
      id: uid2(),
      heading: noteHead.trim(),
      body: noteBody.trim() || noteHead.trim(),
      images: [],
      _userCreated: true,
    };
    onSaveSection(subjId, { ...sec, notes: [...notes, n] });
    setNoteHead("");
    setNoteBody("");

    if (noteBody.trim().length > 60) {
      var textContent = noteHead + ": " + noteBody.slice(0, 400);
      callAI(
        "You are a GCSE revision diagram designer. Analyse this note and return ONLY validJSON (no markdown) for the best diagram, or return null if no diagram is appropriate.\n\nNote:" +
          textContent +
          '\n\nChoose ONE type: process, cycle, hierarchy, comparison, structure,timeline.\nReturn JSON or the exact word:null\n{"type":"process","accent":"#059669","data":{"steps":[{"id":"1","label":"Step"}]}}',
        500,
      )
        .then(function (raw) {
          if (!raw || raw.trim() === "null") return;
          var diagram = _parseAIJson(raw);
          if (diagram && diagram.type) {
            var updated = { ...n, diagram };
            onSaveSection(subjId, { ...sec, notes: [...notes, updated] });
            showToast("Diagram added to your note", "success", 2000);
          }
        })
        .catch(function () {});
    }
  }
  function deleteNote(id) {
    onSaveSection(subjId, {
      ...sec,
      notes: notes.filter(function (n) {
        return n.id !== id;
      }),
    });
  }
  function saveFC() {
    if (!fcFront.trim() || !fcBack.trim()) return;
    var fc = {
      id: uid2(),
      q: fcFront.trim(),
      a: fcBack.trim(),
      _userCreated: true,
    };
    onSaveSection(subjId, { ...sec, flashcards: [...fcs, fc] });
    setFcFront("");
    setFcBack("");
  }
  function deleteFC(id) {
    onSaveSection(subjId, {
      ...sec,
      flashcards: fcs.filter(function (f) {
        return f.id !== id;
      }),
    });
    setFcIdx(function (i) {
      return Math.max(0, Math.min(i, fcs.length - 2));
    });
  }
  function saveQ() {
    if (!qText.trim()) return;
    var q = {
      id: uid2(),
      type: qType,
      text: qText.trim(),
      markScheme: qMS.trim(),
      marks: Number(qMarks) || 2,
      options: qType === "mcq" ? qOptions : [],
      answer: qType === "mcq" ? qAns : 0,
      _userCreated: true,
    };
    onSaveSection(subjId, { ...sec, questions: [...qs, q] });
    setQText("");
    setQMS("");
    setQMarks(2);
    setQOptions(["", "", "", ""]);
    setQAns(0);
  }
  function deleteQ(id) {
    onSaveSection(subjId, {
      ...sec,
      questions: qs.filter(function (q) {
        return q.id !== id;
      }),
    });
    setQIdx(function (i) {
      return Math.max(0, Math.min(i, qs.length - 2));
    });
  }
  function handleImageUpload(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    setImgLoading(true);
    setAiErr("");
    var reader = new FileReader();
    reader.onload = function (ev) {
      var dataUrl = ev.target.result;
      var b64 = dataUrl.split(",")[1];
      var mediaType = file.type || "image/jpeg";

      _aiRequest(
        "You are a GCSE revision assistant. The student has uploaded an image of revisionmaterial — a textbook page, handwritten notes, a diagram, or a past paper. Extract ALL visiblecontent: headings, key terms, definitions, equations, labels, bullet points, dates, processes.Format your response as structured revision notes using ## headings for each section and •bullet points for each fact. Do not skip anything.",
        [
          {
            role: "user",
            _d: {
              text: "Please extract all revision content from this image and format it as structured notes with ## headings and • bullet points.",
              files: [
                {
                  isImage: true,
                  data: b64,
                  type: mediaType,
                  name: file.name || "upload.jpg",
                },
              ],
            },
          },
        ],
        1800,
      )
        .then(function (text) {
          if (text && text.trim()) {
            setAiText(text.trim());
            setAiMode("notes");
            setImgLoading(false);
            setShowAI(true);
            setAiErr("");
          } else {
            throw new Error("Empty response");
          }
        })
        .catch(function () {
          var imgNote = {
            id: uid2(),
            heading: "" + (file.name || "Uploaded image"),
            body: "",
            images: [{ image: dataUrl, annotations: [] }],
            _userCreated: true,
          };
          var updatedSec = { ...sec, notes: [...notes, imgNote] };
          onSaveSection(subjId, updatedSec);
          setAiErr(
            "AI text extraction unavailable — image saved directly to your notes instead. You can add notes manually in the ＋ Add tab.",
          );
          setImgLoading(false);
          setTab("notes");
        });
    };
    reader.readAsDataURL(file);
  }

  function generateFromText() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiErr("");
    var subjectName = subj ? subj.name : "GCSE";
    var secSnap = sec;
    var notesSnap = notes;
    var fcsSnap = fcs;
    var qsSnap = qs;
    if (aiMode === "notes") {
      var notesPrompt =
        "You are a GCSE " +
        subjectName +
        " teacher creating revision notes. " +
        "From the following content, produce well-structured revision notes with:\n" +
        "- ## headings for each main topic/section\n" +
        "- Bullet points (•) for key facts under each heading\n" +
        "- Bold (**term**) for key terms\n" +
        "- Keep each bullet concise but complete\n" +
        "- Include all definitions, equations, processes and key facts\n\n" +
        "Content:\n" +
        aiText;
      _aiWithRetry(
        function () {
          return callAI(notesPrompt, 1600);
        },
        2,
        function () {
          return "## AI Generated Notes\n• Notes could not be generated — paste yourtext and try again.";
        },
      )
        .then(function (raw) {
          var noteBody =
            (raw || "").trim() ||
            "## Notes\n• Could not generate — try rephrasing yourcontent.";
          var n = {
            id: uid2(),
            heading: "AI Generated Notes —" + secSnap.title,
            body: noteBody,
            images: [],
            _userCreated: true,
          };
          onSaveSection(subjId, { ...secSnap, notes: [...notesSnap, n] });
          setTab("notes");
          setAiText("");
          setAiLoading(false);
          setShowAI(false);
        })
        .catch(function (err) {
          setAiErr(err.message || "AI error");
          setAiLoading(false);
        });
    } else if (aiMode === "flashcards") {
      var fcPrompt =
        "You are a GCSE " +
        subjectName +
        " teacher. Create 8-12 high-qualityflashcard question-answer pairs from the following content. " +
        "Questions should test key facts, definitions, and processes. " +
        'Return ONLY valid JSON array (no markdown): [{"q":"question text","a":"answertext"}]\n\n' +
        "Content:\n" +
        aiText;
      _aiWithRetry(
        function () {
          return callAI(fcPrompt, 1600).then(function (raw) {
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
          var newFCs = (arr || [])
            .map(function (x) {
              return {
                id: uid2(),
                q: (x.q || x.front || "").trim(),
                a: (x.a || x.back || "").trim(),
                _userCreated: true,
              };
            })
            .filter(function (f) {
              return f.q && f.a;
            });

          var existingQs = new Set(
            (fcsSnap || []).map(function (f) {
              return (f.q || f.front || "").toLowerCase().trim();
            }),
          );
          var dedupedFCs = newFCs.filter(function (f) {
            return !existingQs.has(f.q.toLowerCase());
          });
          onSaveSection(subjId, {
            ...secSnap,
            flashcards: [...fcsSnap, ...dedupedFCs],
          });
          if (dedupedFCs.length > 0) {
            showToast(
              "✓ Added " +
                dedupedFCs.length +
                "flashcard" +
                (dedupedFCs.length !== 1 ? "s" : "") +
                (newFCs.length > dedupedFCs.length
                  ? " (" +
                    (newFCs.length - dedupedFCs.length) +
                    " duplicates skipped)"
                  : ""),
            );
          } else {
            setAiErr(
              "No new flashcards generated — try adding more detailed content.",
            );
          }
          setTab("flashcards");
          setAiText("");
          setAiLoading(false);
          setShowAI(false);
        })
        .catch(function (err) {
          setAiErr(err.message || "AI error — please try again");
          setAiLoading(false);
        });
    } else {
      var needed = [
        { count: 3, type: "short", marks: 3 },
        { count: 1, type: "extended", marks: 6 },
      ];
      aiServiceQuestionGenerator(subjectName, "GCSE", aiText, needed, "")
        .then(function (validated) {
          var newQs = validated.map(function (q) {
            return Object.assign({}, q, { id: uid2(), _userCreated: true });
          });

          var existingTexts = new Set(
            (qsSnap || []).map(function (q) {
              return (q.text || "").toLowerCase().trim();
            }),
          );
          var dedupedQs = newQs.filter(function (q) {
            return !existingTexts.has((q.text || "").toLowerCase());
          });
          onSaveSection(subjId, {
            ...secSnap,
            questions: [...qsSnap, ...dedupedQs],
          });
          if (dedupedQs.length > 0) {
            showToast(
              "✓ Added " +
                dedupedQs.length +
                " question" +
                (dedupedQs.length !== 1 ? "s" : ""),
            );
          } else {
            setAiErr(
              "No new questions generated — content may be too similar to existingquestions.",
            );
          }

          setTab("questions");
          setAiText("");
          setAiLoading(false);
          setShowAI(false);
        })
        .catch(function (err) {
          setAiErr(err.message || "AI error — please try again");
          setAiLoading(false);
        });
    }
  }
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        background: D ? "rgba(0,0,0,.85)" : "rgba(0,0,0,.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "20px 16px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          ...C(D),
          width: "100%",
          maxWidth: 800,
          borderRadius: 18,
          overflow: "hidden",
          marginTop: 20,
          marginBottom: 40,
        }}
      >
        {}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid" + bd2,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: D ? "#0d1117" : "#fff",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#7c3aed" + "22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            {subj.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: tx(D) }}>
              {sec.title}
            </div>
            <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>
              {subj.name} · My Notes (Private)
            </div>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid " + bd2,
              cursor: "pointer",
              fontSize: 12,
              color: mu(D),
            }}
          >
            {imgLoading ? "Reading…" : "Image"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
              disabled={imgLoading}
            />
          </label>
          <button
            onClick={function () {
              setShowAI(function (v) {
                return !v;
              });
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #7c3aed",
              background: showAI
                ? D
                  ? "rgba(99,102,241,.2)"
                  : "#f5f3ff"
                : "transparent",
              color: "#7c3aed",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            AI Generate
          </button>
          <button
            onClick={onClose}
            style={{
              fontSize: 18,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: mu(D),
              padding: "4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {}
        {showAI && (
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid" + bd2,
              background: D ? "#0a0f1a" : "#f8f9ff",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              {[
                ["notes", "Notes"],
                ["flashcards", "Flashcards"],
                ["questions", "Questions"],
              ].map(function (p) {
                return (
                  <button
                    key={p[0]}
                    onClick={function () {
                      setAiMode(p[0]);
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 7,
                      border:
                        "1.5px solid" + (aiMode === p[0] ? "#7c3aed" : bd2),
                      background:
                        aiMode === p[0]
                          ? D
                            ? "rgba(99,102,241,.15)"
                            : "#f5f3ff"
                          : "transparent",
                      color: aiMode === p[0] ? "#7c3aed" : mu(D),
                      fontSize: 12,
                      fontWeight: aiMode === p[0] ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {p[1]}
                  </button>
                );
              })}
            </div>
            <textarea
              value={aiText}
              onChange={function (e) {
                setAiText(e.target.value);
              }}
              rows={5}
              placeholder="Paste text, notes, or textbook content here — or upload an image above to auto-populate…"
              style={{
                ...I(D, { resize: "vertical", marginBottom: 8, fontSize: 12 }),
              }}
            />
            {aiErr && (
              <p style={{ fontSize: 12, color: "#ef4444", margin: "0 0 8px" }}>
                {aiErr}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={generateFromText}
                disabled={!aiText.trim() || aiLoading}
                style={{
                  ...B("#7c3aed", false, {
                    padding: "9px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    opacity: !aiText.trim() || aiLoading ? 0.4 : 1,
                  }),
                }}
              >
                {aiLoading ? "Generating…" : "Generate " + aiMode}
              </button>
              <button
                onClick={function () {
                  setShowAI(false);
                  setAiText("");
                  setAiErr("");
                }}
                style={{
                  ...B("transparent", true, {
                    padding: "9px 16px",
                    fontSize: 13,
                    borderColor: bd2,
                    color: mu(D),
                  }),
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid " + bd2,
            padding: "0 22px",
          }}
        >
          {[
            ["notes", "Notes (" + notes.length + ")"],
            ["flashcards", "Flashcards(" + fcs.length + ")"],
            ["questions", "Questions (" + qs.length + ")"],
            ["add", "＋Add"],
          ].map(function (pair) {
            return (
              <button
                key={pair[0]}
                onClick={function () {
                  setTab(pair[0]);
                  setFlip(false);
                }}
                style={{
                  padding: "11px 14px",
                  fontSize: 12,
                  fontWeight: tab === pair[0] ? 600 : 400,
                  color: tab === pair[0] ? "#7c3aed" : mu(D),
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom:
                    tab === pair[0]
                      ? "2px solid #7c3aed"
                      : "2px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                }}
              >
                {pair[1]}
              </button>
            );
          })}
        </div>

        <div
          style={{ padding: "20px 22px", maxHeight: "55vh", overflowY: "auto" }}
        >
          {}
          {tab === "notes" && (
            <div>
              {notes.length === 0 && (
                <p
                  style={{
                    fontSize: 13,
                    color: mu(D),
                    textAlign: "center",
                    padding: "30px 0",
                  }}
                >
                  No notes yet — use ＋ Add or AI Generate.
                </p>
              )}
              {notes.map(function (n) {
                return (
                  <div
                    key={n.id}
                    style={{ ...C(D), padding: "14px 16px", marginBottom: 10 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                        marginBottom:
                          (n.body && n.body !== n.heading) ||
                          (n.images && n.images.length > 0)
                            ? 8
                            : 0,
                      }}
                    >
                      <div
                        style={{ fontWeight: 700, fontSize: 14, color: tx(D) }}
                      >
                        {n.heading || n.text || ""}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: 9,
                            background: "#7c3aed",
                            color: "#fff",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          MY NOTE
                        </span>
                        <button
                          onClick={function () {
                            deleteNote(n.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontSize: 14,
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {(n.images || []).map(function (img, ii) {
                      return img && img.image ? (
                        <img
                          key={ii}
                          src={img.image}
                          alt="note image"
                          style={{
                            maxWidth: "100%",
                            borderRadius: 8,
                            display: "block",
                            marginBottom: 8,
                            border: "1px solid" + (D ? "#374151" : "#e5e7eb"),
                          }}
                        />
                      ) : null;
                    })}
                    {n.body && n.body !== n.heading && n.body !== n.text && (
                      <div
                        style={{
                          fontSize: 13,
                          color: tx(D),
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {n.body}
                      </div>
                    )}
                    {n.text && !n.heading && (
                      <div
                        style={{ fontSize: 13, color: tx(D), lineHeight: 1.65 }}
                      >
                        {n.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {}
          {tab === "flashcards" && (
            <div>
              {fcs.length === 0 && (
                <p
                  style={{
                    fontSize: 13,
                    color: mu(D),
                    textAlign: "center",
                    padding: "30px 0",
                  }}
                >
                  No flashcards yet — use ＋ Add or AI Generate.
                </p>
              )}
              {curFC && (
                <div>
                  <div
                    onClick={function () {
                      setFlip(function (f) {
                        return !f;
                      });
                    }}
                    style={{
                      ...C(D),
                      padding: 40,
                      textAlign: "center",
                      cursor: "pointer",
                      minHeight: 130,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                      borderColor: "#7c3aed",
                      borderWidth: 1.5,
                    }}
                  >
                    <div style={{ width: "100%" }}>
                      {(curFC.cardImage || curFC.diagram) && (
                        <div style={{ marginBottom: 10, opacity: 0.85 }}>
                          {curFC.cardImage ? (
                            <img
                              src={curFC.cardImage}
                              alt=""
                              style={{
                                maxWidth: "100%",
                                maxHeight: 120,
                                borderRadius: 8,
                                display: "block",
                                margin: "0 auto",
                              }}
                            />
                          ) : (
                            <DiagramRenderer
                              diagram={curFC.diagram}
                              D={D}
                              width={360}
                            />
                          )}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: mu(D),
                          marginBottom: 8,
                          textTransform: "uppercase",
                        }}
                      >
                        {flip ? "Answer" : "Question"} — click to flip
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          lineHeight: 1.5,
                        }}
                      >
                        {flip
                          ? curFC.a || curFC.back || ""
                          : curFC.q || curFC.front || ""}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <button
                      onClick={function () {
                        setFcIdx(function (i) {
                          return (i - 1 + fcs.length) % fcs.length;
                        });
                        setFlip(false);
                      }}
                      style={{
                        ...B("transparent", true, {
                          padding: "8px 16px",
                          fontSize: 13,
                          borderColor: bd2,
                          color: mu(D),
                        }),
                      }}
                    ></button>
                    <span
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 12,
                        color: mu(D),
                      }}
                    >
                      {fcIdx + 1} /{fcs.length}
                    </span>
                    <button
                      onClick={function () {
                        setFcIdx(function (i) {
                          return (i + 1) % fcs.length;
                        });
                        setFlip(false);
                      }}
                      style={{
                        ...B("transparent", true, {
                          padding: "8px 16px",
                          fontSize: 13,
                          borderColor: bd2,
                          color: mu(D),
                        }),
                      }}
                    ></button>
                    <button
                      onClick={function () {
                        deleteFC(curFC.id);
                      }}
                      style={{
                        ...B("transparent", true, {
                          padding: "8px 12px",
                          fontSize: 11,
                          borderColor: "#ef4444",
                          color: "#ef4444",
                        }),
                      }}
                    >
                      {" "}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {}
          {tab === "questions" && (
            <div>
              {qs.length === 0 && (
                <p
                  style={{
                    fontSize: 13,
                    color: mu(D),
                    textAlign: "center",
                    padding: "30px 0",
                  }}
                >
                  No questions yet — use ＋ Add or AI Generate.
                </p>
              )}

              {curQ && (
                <div style={{ ...C(D), padding: 18, marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 11, color: mu(D) }}>
                      Q{qIdx + 1}/{qs.length} · {curQ.type} ·{curQ.marks} marks
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 9,
                          background: "#7c3aed",
                          color: "#fff",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        MY Q
                      </span>
                      <button
                        onClick={function () {
                          deleteQ(curQ.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                          fontSize: 14,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: 1.55,
                      marginBottom: curQ.markScheme ? 10 : 0,
                    }}
                  >
                    {curQ.text}
                  </p>
                  {curQ.markScheme && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: D ? "rgba(16,185,129,.08)" : "#f0fdf4",
                        fontSize: 12,
                        color: D ? "#6ee7b7" : "#15803d",
                        lineHeight: 1.6,
                      }}
                    >
                      <strong>Mark scheme:</strong> {curQ.markScheme}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      onClick={function () {
                        setQIdx(function (i) {
                          return (i - 1 + qs.length) % qs.length;
                        });
                      }}
                      style={{
                        ...B("transparent", true, {
                          padding: "6px 14px",
                          fontSize: 12,
                          borderColor: bd2,
                          color: mu(D),
                        }),
                      }}
                    ></button>
                    <button
                      onClick={function () {
                        setQIdx(function (i) {
                          return (i + 1) % qs.length;
                        });
                      }}
                      style={{
                        ...B("transparent", true, {
                          padding: "6px 14px",
                          fontSize: 12,
                          borderColor: bd2,
                          color: mu(D),
                        }),
                      }}
                    ></button>
                  </div>
                </div>
              )}
            </div>
          )}
          {}
          {tab === "add" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {}
              <div style={{ ...C(D), padding: 18 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 12,
                    color: tx(D),
                  }}
                >
                  Add Note
                </div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Heading *
                </label>

                <input
                  value={noteHead}
                  onChange={function (e) {
                    setNoteHead(e.target.value);
                  }}
                  placeholder="e.g. Mitosis"
                  style={{ ...I(D), marginBottom: 8 }}
                />
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Content (optional — supports ## headings and • bullets)
                </label>
                <textarea
                  value={noteBody}
                  onChange={function (e) {
                    setNoteBody(e.target.value);
                  }}
                  rows={4}
                  placeholder={
                    "## Section heading\n• Key fact one\n• Key fact two\n\n## Anothersection\n• More content…"
                  }
                  style={{
                    ...I(D, {
                      resize: "vertical",
                      marginBottom: 10,
                      fontSize: 12,
                      fontFamily: "inherit",
                    }),
                  }}
                />
                <button
                  onClick={saveNote}
                  disabled={!noteHead.trim()}
                  style={{
                    ...B("#7c3aed", false, {
                      padding: "9px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: noteHead.trim() ? 1 : 0.4,
                    }),
                  }}
                >
                  Save Note
                </button>
              </div>
              {}
              <div style={{ ...C(D), padding: 18 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 12,
                    color: tx(D),
                  }}
                >
                  Add Flashcard
                </div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Question (front)
                </label>
                <input
                  value={fcFront}
                  onChange={function (e) {
                    setFcFront(e.target.value);
                  }}
                  placeholder="e.g. What is osmosis?"
                  style={{ ...I(D), marginBottom: 8 }}
                />
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Answer (back)
                </label>
                <input
                  value={fcBack}
                  onChange={function (e) {
                    setFcBack(e.target.value);
                  }}
                  placeholder="e.g. Movement of water molecules from high to low concentration…"
                  style={{ ...I(D), marginBottom: 10 }}
                />
                <button
                  onClick={saveFC}
                  disabled={!fcFront.trim() || !fcBack.trim()}
                  style={{
                    ...B("#7c3aed", false, {
                      padding: "9px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: fcFront.trim() && fcBack.trim() ? 1 : 0.4,
                    }),
                  }}
                >
                  Save Flashcard
                </button>
              </div>
              {}
              <div style={{ ...C(D), padding: 18 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 12,
                    color: tx(D),
                  }}
                >
                  Add Question
                </div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Type
                </label>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {[
                    ["short", "Short Answer"],
                    ["extended", "Extended"],
                  ].map(function (p) {
                    return (
                      <button
                        key={p[0]}
                        onClick={function () {
                          setQType(p[0]);
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 7,
                          border:
                            "1.5px solid" + (qType === p[0] ? "#7c3aed" : bd2),
                          background:
                            qType === p[0]
                              ? D
                                ? "rgba(99,102,241,.15)"
                                : "#f5f3ff"
                              : "transparent",
                          color: qType === p[0] ? "#7c3aed" : mu(D),
                          fontSize: 12,
                          fontWeight: qType === p[0] ? 600 : 400,
                          cursor: "pointer",
                        }}
                      >
                        {p[1]}
                      </button>
                    );
                  })}
                </div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Question Text *
                </label>
                <textarea
                  value={qText}
                  onChange={function (e) {
                    setQText(e.target.value);
                  }}
                  rows={2}
                  placeholder="Enter the question…"
                  style={{ ...I(D, { resize: "vertical", marginBottom: 8 }) }}
                />
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Mark Scheme
                </label>
                <textarea
                  value={qMS}
                  onChange={function (e) {
                    setQMS(e.target.value);
                  }}
                  rows={2}
                  placeholder="Model answer / mark scheme…"
                  style={{ ...I(D, { resize: "vertical", marginBottom: 8 }) }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: mu(D),
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={qMarks}
                    onChange={function (e) {
                      setQMarks(Number(e.target.value));
                    }}
                    style={{ ...I(D, { width: 60 }) }}
                  />
                </div>
                <button
                  onClick={saveQ}
                  disabled={!qText.trim()}
                  style={{
                    ...B("#7c3aed", false, {
                      padding: "9px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: qText.trim() ? 1 : 0.4,
                    }),
                  }}
                >
                  Save Question
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UserContentScreen({
  D,
  user,
  subjects,
  ucData,
  onSaveSection,
  onDeleteSection,
  onBack,
}) {
  var [selSubj, setSelSubj] = React.useState(subjects[0]?.id || "");
  var [modal, setModal] = React.useState(null);
  var bd2 = D ? "#262844" : "#e5e7eb";
  var subj =
    subjects.find(function (s) {
      return s.id === selSubj;
    }) || subjects[0];

  var subjUC = ucData[selSubj] || { sections: [] };
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      <button
        onClick={onBack}
        style={{
          fontSize: 13,
          color: mu(D),
          background: "none",
          border: "none",
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        {" "}
        Back
      </button>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        My Notes &amp; Flashcards
      </h2>
      <p style={{ fontSize: 13, color: mu(D), marginBottom: 20 }}>
        Private to your account — create sections to organise your notes.
      </p>
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}
      >
        {subjects
          .filter(function (s) {
            return !s._politics;
          })
          .map(function (s) {
            var cnt = (ucData[s.id] || { sections: [] }).sections.length;
            return (
              <button
                key={s.id}
                onClick={function () {
                  setSelSubj(s.id);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1.5px solid" + (selSubj === s.id ? s.accent : bd2),
                  background: selSubj === s.id ? s.accent : "transparent",
                  color: selSubj === s.id ? "#fff" : mu(D),
                  fontSize: 12,
                  fontWeight: selSubj === s.id ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                {s.icon} {s.name}
                {cnt ? " (" + cnt + ")" : ""}
              </button>
            );
          })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15 }}>{subj.name}</span>
        <button
          onClick={function () {
            setModal({ mode: "new" });
          }}
          style={{
            ...B("#7c3aed", false, {
              padding: "7px 16px",
              fontSize: 12,
              fontWeight: 600,
            }),
          }}
        >
          ＋ New Section
        </button>
      </div>
      {subjUC.sections.length === 0 && (
        <div
          style={{ ...C(D), padding: 40, textAlign: "center", color: mu(D) }}
        >
          <p style={{ fontSize: 24, marginBottom: 8 }}> </p>
          <p style={{ fontSize: 13 }}>
            No sections yet for
            {subj.name}.
          </p>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: 10,
        }}
      >
        {subjUC.sections.map(function (sec) {
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
              <button
                onClick={function () {
                  setModal({ mode: "section", sec: sec });
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "14px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: tx(D),
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  {sec.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    fontSize: 11,
                    color: mu(D),
                  }}
                >
                  <span>{(sec.notes || []).length}</span>
                  <span>{(sec.flashcards || []).length}</span>
                  <span>{(sec.questions || []).length}</span>
                </div>
              </button>

              <div
                style={{
                  display: "flex",
                  borderTop: "1px solid " + (D ? "#374151" : "#ede9fe"),
                }}
              >
                <button
                  onClick={function () {
                    setModal({ mode: "section", sec: sec });
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
                    if (window.confirm("Delete?"))
                      onDeleteSection(selSubj, sec.id);
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
                    borderLeft: "1px solid " + (D ? "#374151" : "#ede9fe"),
                  }}
                >
                  {" "}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {modal?.mode === "new" && (
        <UCNewSectionModal
          D={D}
          onClose={function () {
            setModal(null);
          }}
          onSave={function (title) {
            var sec = {
              id: Math.random().toString(36).slice(2),
              title: title.trim(),
              notes: [],
              flashcards: [],
              questions: [],
              created: Date.now(),
            };
            onSaveSection(selSubj, sec);
            setModal({ mode: "section", sec: sec });
          }}
        />
      )}
      {modal?.mode === "section" && (
        <UCSectionModal
          D={D}
          user={user}
          subjId={selSubj}
          sec={
            (ucData[selSubj] || { sections: [] }).sections.find(function (s) {
              return s.id === modal.sec.id;
            }) || modal.sec
          }
          subjects={subjects}
          onSaveSection={onSaveSection}
          onClose={function () {
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
