import React, { useState, useEffect, useCallback, useRef } from "react";
import { computeDerivedSocraticLevel } from "./learningEngine.js";
import { TUTOR_MODELS, _aiRequest, buildTutorSystemPrompt, incTutorUsage, pickTutorModel } from "./aiService.js";
import { MD } from "./richText.jsx";
import { mergeTopics } from "./social.jsx";
import { B, I, mu, stripHtml, trackEvent, tx } from "./ui.jsx";

export function TutorImage({ query, D }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    const term = query.trim().replace(/\s+/g, "_");
    fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.thumbnail?.source) setImgSrc(d.thumbnail.source);
      })
      .catch(() => {})
      .finally(() => setTried(true));
  }, [query]);
  if (!tried)
    return (
      <div
        style={{
          fontSize: 11,
          color: mu(D),
          fontStyle: "italic",
          padding: "4px 0",
        }}
      >
        Loading image: {query}…
      </div>
    );
  if (!imgSrc)
    return (
      <div
        style={{
          fontSize: 11,
          color: mu(D),
          fontStyle: "italic",
          padding: "4px 2px",
          background: D ? "rgba(99,102,241,.08)" : "#f5f3ff",
          borderRadius: 6,
          display: "inline-block",
        }}
      >
        {query}
      </div>
    );
  return (
    <div style={{ margin: "8px 0" }}>
      <img
        src={imgSrc}
        alt={query}
        style={{
          maxWidth: "100%",
          maxHeight: 260,
          borderRadius: 8,
          display: "block",
        }}
      />
      <div
        style={{
          fontSize: 10,
          color: mu(D),
          marginTop: 2,
          fontStyle: "italic",
        }}
      >
        {query} (Wikipedia)
      </div>
    </div>
  );
}

export function parseTutorContent(text, D) {
  const parts = text.split(/\[IMG:\s*([^\]]+)\]/g);

  if (parts.length === 1) return <MD text={text} D={D} />;
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i].trim()) out.push(<MD key={i} text={parts[i]} D={D} />);
    } else {
      out.push(<TutorImage key={i} query={parts[i].trim()} D={D} />);
    }
  }
  return <>{out}</>;
}

export function AITutorScreen({
  D,
  subjects,
  allSections,
  boardSels,
  boardData,
  user,
  googleKey,
  calibrationData = {},
  stats = {},
  onBack,
}) {
  const [selSubj, setSS] = useState(subjects[0]?.id || "");
  const [selBoard, setSB] = useState("AQA");
  const [selSec, setSec] = useState("");
  const [mode, setMode] = useState("tutor");
  const [messages, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [activeModel, setActiveModel] = useState(TUTOR_MODELS[0]);
  const [listening, setListening] = useState(false);
  const [quizzing, setQuizzing] = useState(false);

  const [socraticLevel, setSocraticLevel] = useState(2);
  const chatRef = useRef(null);
  const fileRef = useRef(null);
  const subj = subjects.find(function (s) {
    return s.id === selSubj;
  });
  const secList = allSections.filter(function (s) {
    return s.subjectId === selSubj;
  });
  const bd2 = D ? "#262844" : "#e5e7eb";
  var memKey =
    "gcse:tutor-mem:" + (user || "anon") + ":" + selSubj + ":" + selBoard;

  useEffect(
    function () {
      (function () {
        window.storage
          .get(memKey)
          .then(function (r) {
            try {
              if (r && r.value) {
                var saved = JSON.parse(r.value);
                if (Array.isArray(saved) && saved.length) setMsgs(saved);
              }
            } catch (e) {}
          })
          .catch(function () {});
      })();
    },
    [memKey],
  );
  var saveMemory = function (msgs) {
    try {
      var slim = msgs.slice(-20).map(function (m) {
        var files = ((m._d && m._d.files) || []).map(function (f) {
          if (f.isImage) return { name: f.name, type: f.type, isImage: true };
          if (f.isPdf) return { name: f.name, type: f.type, isPdf: true };
          return { name: f.name, type: f.type };
        });
        return {
          role: m.role,
          content:
            typeof m.content === "string"
              ? m.content
              : (m._d && m._d.text) || "",
          _d: {
            text: (m._d && m._d.text) || "",
            files: files,
            stag: m._d && m._d.stag,
            chips: (m._d && m._d.chips) || [],
          },
        };
      });
      window.storage.set(memKey, JSON.stringify(slim)).catch(function () {});
    } catch (e) {}
  };

  useEffect(
    function () {
      if (chatRef.current)
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    },
    [messages, sending],
  );
  const reset = function () {
    setMsgs([]);
    setInput("");
    setFiles([]);
    setErr("");
    setSocraticLevel(2);
    try {
      window.storage.delete(memKey);
    } catch (e) {}
  };
  const buildCtx = useCallback(() => {
    const bd3 = boardData[`${selSubj}:${selBoard}`] || {
      custom: [],
      extras: {},
      papers: [],
    };
    const subjectDef = subjects.find((s) => s.id === selSubj);
    const merged = mergeTopics(
      subjectDef?.topics || [],
      bd3.custom,
      bd3.extras,
    );
    const secs = selSec
      ? merged.flatMap((t) => t.sections).filter((s) => s.id === selSec)
      : merged.flatMap((t) => t.sections);
    const notes = secs
      .flatMap((s) =>
        (s.notes || []).map(
          (n) => `###
${n.heading}\n${stripHtml(n.body)}`,
        ),
      )
      .slice(0, 20)
      .join("\n\n");
    const fcs = secs
      .flatMap((s) =>
        (s.flashcards || []).map(
          (f) => `Q: ${stripHtml(f.q)}\nA:
${stripHtml(f.a)}`,
        ),
      )
      .slice(0, 30)
      .join("\n");
    const qs = secs
      .flatMap((s) =>
        (s.questions || []).map(
          (q) => `Q(${q.marks}mk):
${stripHtml(q.text)}\nMS:
${stripHtml(q.markScheme || q.sampleAnswer || "")}`,
        ),
      )
      .slice(0, 20)
      .join("\n\n");
    return { notes, fcs, qs, hasContent: !!(notes || fcs || qs) };
  }, [selSubj, selBoard, selSec, boardData, subjects]);

  const buildSys = () => {
    const { notes, fcs, qs } = buildCtx();

    const ctx = { notes, fcs, qs };
    const sec = allSections.find((s) => s.id === selSec);
    const topicLabel = sec
      ? sec.title
      : `${subj?.name || "Unknown"} (${selBoard})`;

    const effectiveLevel =
      messages.length >= 12 ? Math.max(0, socraticLevel - 1) : socraticLevel;
    return buildTutorSystemPrompt(
      ctx,
      mode,
      selBoard,
      subj?.name || "",
      topicLabel,
      effectiveLevel,
    );
  };
  const readFile = (file) =>
    new Promise((res) => {
      const r = new FileReader();
      if (file.type.startsWith("image/")) {
        r.onload = (ev) =>
          res({
            name: file.name,
            type: file.type,
            data: ev.target.result.split(",")[1],
            preview: ev.target.result,
            isImage: true,
          });
        r.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        r.onload = (ev) =>
          res({
            name: file.name,
            type: "application/pdf",
            data: ev.target.result.split(",")[1],
            preview: null,
            isPdf: true,
          });
        r.readAsDataURL(file);
      } else if (file.type.startsWith("text/")) {
        r.onload = (ev) =>
          res({
            name: file.name,
            type: "text",
            textContent: ev.target.result,
            preview: null,
            isText: true,
          });
        r.readAsText(file);
      } else {
        res({
          name: file.name,
          type: file.type,
          unsupported: true,
          preview: null,
        });
      }
    });
  const addFiles = async (e) => {
    const newFiles = await Promise.all(
      Array.from(e.target.files || []).map(readFile),
    );
    setFiles((p) => [...p, ...newFiles]);
    e.target.value = "";
  };
  const buildApiContent = (text, attachedFiles) => {
    const parts = [];
    for (const f of attachedFiles) {
      if (f.isImage)
        parts.push({
          type: "image",
          source: { type: "base64", media_type: f.type, data: f.data },
        });
      else if (f.isPdf)
        parts.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: f.data,
          },
        });
      else if (f.isText)
        parts.push({
          type: "text",
          text: `[Uploaded text file: ${f.name}]\n${f.textContent}`,
        });
      else
        parts.push({
          type: "text",
          text: `[Uploaded file: ${f.name} — type not directly readable; the
student has shared this file with you]`,
        });
    }
    parts.push({
      type: "text",
      text: text || "Please help me with the uploaded file(s).",
    });
    return parts.length === 1 && !attachedFiles.length ? text : parts;
  };

  const tutorCall = async function (modelDef, systemPrompt, hist) {
    return _aiRequest(systemPrompt || null, hist, 1500);
  };

  const callAILocal = async function (modelDef, systemPrompt, hist) {
    return tutorCall(modelDef, systemPrompt, hist);
  };
  const send = async () => {
    if ((!input.trim() && !files.length) || sending) return;
    setSending(true);
    setErr("");
    try {
      trackEvent("tutor_message_sent", { subjectId: selSubj });
      const userText = input || "Please help me with the uploaded file(s).";
      const newMsg = {
        role: "user",
        content: userText,
        _d: { text: userText, files: [...files] },
      };
      const hist = [...messages, newMsg];
      setMsgs(hist);
      setInput("");
      setFiles([]);

      const chosenModel = await pickTutorModel(user);
      setActiveModel(chosenModel);
      const startIdx = TUTOR_MODELS.findIndex(function (m) {
        return m.model === chosenModel.model;
      });
      const tryOrder = [
        ...TUTOR_MODELS.slice(startIdx < 0 ? 0 : startIdx),
        ...TUTOR_MODELS.slice(0, startIdx < 0 ? 0 : startIdx),
      ];
      var responseText = null;
      var lastErr = "AI unavailable";
      for (var ti = 0; ti < tryOrder.length; ti++) {
        var modelDef = tryOrder[ti];
        try {
          responseText = await tutorCall(modelDef, buildSys(), hist);
          await incTutorUsage(user, modelDef.model);
          setActiveModel(modelDef);

          break;
        } catch (e) {
          lastErr = e.message || "AI error";

          var isQuota =
            lastErr.toLowerCase().includes("quota") ||
            lastErr.toLowerCase().includes("429") ||
            lastErr.toLowerCase().includes("rate") ||
            lastErr.toLowerCase().includes("resource_exhausted");
          if (!isQuota) break;
        }
      }
      if (responseText) {
        var hcNow = buildCtx();
        var stag = hcNow.hasContent ? "notes" : "general";
        var newMsgsArr = [
          ...hist,
          {
            role: "assistant",
            content: responseText,
            _d: {
              text: responseText,
              stag: stag,
              chips: [],
              socraticLevel: socraticLevel,
            },
          },
        ];
        setMsgs(newMsgsArr);
        saveMemory(newMsgsArr);

        var userMsgCount = newMsgsArr.filter(function (m) {
          return m.role === "user";
        }).length;
        var _secForTutor = allSections.find(function (s) {
          return s.id === selSec;
        });
        var _qPctForTutor = _secForTutor
          ? (function () {
              var wq = stats && stats.weakQ && stats.weakQ[_secForTutor.id];
              return wq && wq.total > 0
                ? Math.round(((wq.total - wq.wrong) / wq.total) * 100)
                : null;
            })()
          : null;
        var _brierForTutor =
          ((calibrationData && calibrationData[selSubj]) || []).length >= 3
            ? (function () {
                var arr = calibrationData[selSubj];
                return (
                  arr.reduce(function (a, p) {
                    return a + Math.pow((p.pred || 0.5) - (p.outcome || 0), 2);
                  }, 0) / arr.length
                );
              })()
            : null;
        var newSocraticLevel = computeDerivedSocraticLevel(
          userMsgCount,
          _qPctForTutor,
          _brierForTutor,
          mode === "homework",
        );
        if (newSocraticLevel !== socraticLevel)
          setSocraticLevel(newSocraticLevel);

        var chipModel = TUTOR_MODELS[TUTOR_MODELS.length - 1];
        tutorCall(
          chipModel,
          "Return ONLY a JSON array of 3 short follow-up questions (max 9words each). No preamble.",
          [
            {
              role: "user",
              content:
                "Suggest 3 follow-ups for: " + responseText.slice(0, 400),
            },
          ],
        )
          .then(function (raw) {
            try {
              var s = raw.indexOf("["),
                e2 = raw.lastIndexOf("]");
              if (s < 0 || e2 < 0) return;

              var arr = JSON.parse(raw.slice(s, e2 + 1));
              if (!Array.isArray(arr)) return;
              var chipsArr = arr.slice(0, 3).map(function (x) {
                return String(x).slice(0, 70);
              });
              setMsgs(function (p) {
                return p.map(function (m, i) {
                  return i === p.length - 1
                    ? Object.assign({}, m, {
                        _d: Object.assign({}, m._d, { chips: chipsArr }),
                      })
                    : m;
                });
              });
            } catch (ex) {}
          })
          .catch(function () {});
      } else {
        setErr(lastErr);
        setMsgs(messages);
      }
    } catch (e) {
      setErr(e.message || "Unexpected error");
      setMsgs(messages);
    } finally {
      setSending(false);
    }
  };
  const { hasContent } = buildCtx();
  var quizMe = function () {
    if (sending || quizzing) return;
    setQuizzing(true);
    setErr("");
    var ctx = buildCtx();
    var sec = allSections.find(function (s) {
      return s.id === selSec;
    });
    var topic = sec
      ? sec.title || "this topic"
      : subj
        ? subj.name + " (" + selBoard + ")"
        : "this topic";
    var promptText =
      "Generate 3 rapid-fire GCSE " +
      selBoard +
      ' exam-style questions on"' +
      topic +
      '". ' +
      (ctx.hasContent
        ? "Use this content: " +
          ctx.notes.slice(0, 800) +
          " " +
          ctx.fcs.slice(0, 400)
        : " Usegeneral GCSE knowledge.") +
      " Format: 1. [Q] (Answer: [A]) 2. [Q] (Answer: [A]) 3. [Q] (Answer: [A]) Mix question types.Max 25 words each.";
    var userMsg = {
      role: "user",
      content: "Quiz me on this topic!",
      _d: { text: "Quiz me on this topic!", files: [], stag: null, chips: [] },
    };
    var hist2 = [...messages, userMsg];
    setMsgs(hist2);
    pickTutorModel(user)
      .then(function (chosenModel) {
        return tutorCall(
          chosenModel,
          buildSys(),
          [{ role: "user", content: promptText }],
          null,
        ).then(function (rt) {
          incTutorUsage(user, chosenModel.model);
          setActiveModel(chosenModel);
          var nm = [
            ...hist2,
            {
              role: "assistant",
              content: rt,
              _d: {
                text: rt,
                stag: ctx.hasContent ? "notes" : "general",
                chips: [
                  "What is the answer to Q1?",
                  "Explain Q2 further",
                  "Give me 3 more questions",
                ],
              },
            },
          ];
          setMsgs(nm);
          saveMemory(nm);
          setQuizzing(false);
        });
      })
      .catch(function (e) {
        setErr("Quiz failed:" + e.message);
        setMsgs(messages);
        setQuizzing(false);
      });
  };
  var startVoice = function () {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setErr("Voice not supported in this browser.");
      return;
    }
    var rec = new SR();
    rec.lang = "en-GB";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = function () {
      setListening(true);
    };
    rec.onend = function () {
      setListening(false);
    };
    rec.onerror = function () {
      setListening(false);
    };
    rec.onresult = function (ev) {
      var t =
        (ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript) ||
        "";
      if (t)
        setInput(function (p) {
          return p ? p + " " + t : t;
        });
    };
    rec.start();
  };

  const fileIcon = (f) =>
    f.isImage
      ? " "
      : f.isPdf
        ? " "
        : f.isText
          ? " "
          : f.name?.endsWith(".pptx") || f.name?.endsWith(".ppt")
    ? " "
    : f.name?.endsWith(".docx") || f.name?.endsWith(".doc")
      ? " "
      : " ";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: D ? "radial-gradient(1200px 820px at 12% -12%, rgba(124,58,237,.20), transparent 60%), radial-gradient(1000px 720px at 102% 4%, rgba(217,70,239,.14), transparent 55%), radial-gradient(900px 700px at 50% 120%, rgba(59,130,246,.10), transparent 55%), #0a0a14" : "radial-gradient(1100px 780px at 10% -10%, rgba(124,58,237,.10), transparent 60%), radial-gradient(940px 660px at 104% 2%, rgba(217,70,239,.08), transparent 55%), radial-gradient(820px 640px at 50% 116%, rgba(59,130,246,.06), transparent 55%), #f6f6fc",
        display: "flex",
        flexDirection: "column",
        color: tx(D),
      }}
      className="fade-in"
    >
      {}
      <div
        style={{
          borderBottom: `1px solid ${bd2}`,
          background: D ? "#0d1117" : "#fff",
          padding: "10px 16px",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <button
              onClick={onBack}
              style={{
                fontSize: 13,
                color: mu(D),
                background: "none",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {" "}
              Back
            </button>
            <h2
              style={{ fontSize: 16, fontWeight: 700, color: tx(D), flex: 1 }}
            >
              ReviseIQ AI Tutor
            </h2>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                ["tutor", "Tutor"],
                ["homework", "Homework Help"],
              ].map(([m, lbl]) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    reset();
                  }}
                  style={{
                    fontSize: 11,
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: `1.5px solid ${mode === m ? "#7c3aed" : bd2}`,

                    background: mode === m ? "#7c3aed" : "transparent",
                    color: mode === m ? "#fff" : mu(D),
                    cursor: "pointer",
                    fontWeight: mode === m ? 700 : 400,
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              style={{ ...I(D, { flex: 1, minWidth: 110, maxWidth: 190 }) }}
              value={selSubj}
              onChange={(e) => {
                setSS(e.target.value);
                setSec("");
                reset();
              }}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
            <select
              style={{ ...I(D, { width: 92 }) }}
              value={selBoard}
              onChange={(e) => {
                setSB(e.target.value);
                reset();
              }}
            >
              {["AQA", "Edexcel", "OCR", "Eduqas", "WJEC"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              style={{ ...I(D, { flex: 1, minWidth: 120 }) }}
              value={selSec}
              onChange={(e) => {
                setSec(e.target.value);
                reset();
              }}
            >
              <option value="">All topics</option>
              {secList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginLeft: "auto",
              }}
            >
              <span
                title={`Responding with: ${activeModel.label}`}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 10,
                  background: D ? "rgba(16,185,129,.15)" : "#ecfdf5",
                  color: "#059669",
                  cursor: "default",
                }}
              >
                {activeModel.label}
              </span>
              {}
              <span
                title={
                  socraticLevel === 2
                    ? "Socratic: asks guiding questions before explaining"
                    : socraticLevel === 1
                      ? "Guided: explains then prompts recall"
                      : "Direct: gives answersimmediately"
                }
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background:
                    socraticLevel === 2
                      ? D
                        ? "rgba(99,102,241,.2)"
                        : "#f5f3ff"
                      : socraticLevel === 1
                        ? D
                          ? "rgba(245,158,11,.15)"
                          : "#fffbeb"
                        : D
                          ? "rgba(16,185,129,.12)"
                          : "#ecfdf5",
                  color:
                    socraticLevel === 2
                      ? "#7c3aed"
                      : socraticLevel === 1
                        ? "#d97706"
                        : "#059669",
                }}
                onClick={() =>
                  setSocraticLevel(function (v) {
                    return v > 0 ? v - 1 : 2;
                  })
                }
              >
                {socraticLevel === 2
                  ? "Socratic"
                  : socraticLevel === 1
                    ? "Guided"
                    : "Direct"}
              </span>
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  style={{
                    fontSize: 11,
                    color: mu(D),
                    background: "none",
                    border: `1px solid ${bd2}`,
                    borderRadius: 8,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  {" "}
                  New chat
                </button>
              )}
            </div>
          </div>
          {!hasContent && (
            <div
              style={{
                marginTop: 8,
                padding: "6px 12px",
                borderRadius: 8,
                background: D ? "rgba(245,158,11,.08)" : "#fffbeb",
                border: "1px solid #f59e0b",
                fontSize: 11,
                color: D ? "#fcd34d" : "#92400e",
              }}
            >
              No revision notes added for this selection — tutor will use
              general GCSE knowledge.
            </div>
          )}
        </div>
      </div>
      {}
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minHeight: 0,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: mu(D),
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 12 }}> </div>
            <p
              style={{
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 8,
                color: tx(D),
              }}
            >
              ReviseIQ AI Tutor
            </p>
            <p style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
              {mode === "tutor"
                ? "Start by telling me what you already know about the topic — I'll guide you to fill the gaps."
                : "Share your homework by uploading a photo, PDF or file, or paste the question below.I'll ask guiding questions to help you reach the answer yourself."}
            </p>
            <p style={{ fontSize: 11, color: mu(D), marginBottom: 6 }}>
              {hasContent
                ? "Drawing from yourrevision notes and flashcards."
                : "Using general GCSE knowledge."}
            </p>
            <p style={{ fontSize: 10, color: mu(D) }}>
              {socraticLevel === 2
                ? "Socratic mode — I'll ask what you know first"
                : socraticLevel === 1
                  ? "Guided mode — I'll explain then prompt recall"
                  : "Direct mode — I'll give complete answers"}
            </p>
          </div>
        )}
        {messages.map(function (m, i) {
          var isU = m.role === "user";
          var stag = m._d && m._d.stag;
          var chips = (m._d && m._d.chips) || [];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isU ? "flex-end" : "flex-start",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: isU ? "flex-end" : "flex-start",
                  gap: 8,
                  width: "100%",
                }}
              >
                {!isU && (
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "#7c3aed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {" "}
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: isU
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    background: isU ? "#7c3aed" : D ? "#191a2b" : "#f3f4f6",
                    color: isU ? "#fff" : tx(D),
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  {m._d &&
                    m._d.files &&
                    m._d.files.map(function (f, fi) {
                      return f.isImage ? (
                        <img
                          key={fi}
                          src={f.preview}
                          alt={f.name}
                          style={{
                            maxWidth: "100%",
                            maxHeight: 180,
                            borderRadius: 6,
                            marginBottom: 6,
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          key={fi}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 8px",
                            borderRadius: 6,
                            background: "rgba(255,255,255,.15)",
                            marginBottom: 5,
                            fontSize: 11,
                          }}
                        >
                          <span>{fileIcon(f)}</span>
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {f.name}
                          </span>
                        </div>
                      );
                    })}
                  {isU ? (
                    <p style={{ margin: 0 }}>{(m._d && m._d.text) || ""}</p>
                  ) : (
                    parseTutorContent((m._d && m._d.text) || m.content || "", D)
                  )}
                  {!isU && stag && (
                    <div
                      style={{
                        marginTop: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 600,
                        background:
                          stag === "notes"
                            ? D
                              ? "rgba(16,185,129,.12)"
                              : "#d1fae5"
                            : D
                              ? "rgba(99,102,241,.12)"
                              : "#ede9fe",
                        color: stag === "notes" ? "#059669" : "#7c3aed",
                      }}
                    >
                      {stag === "notes" ? "Your notes" : "General knowledge"}
                    </div>
                  )}
                </div>
                {isU && (
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: D ? "#374151" : "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {" "}
                  </div>
                )}
              </div>
              {!isU && chips.length > 0 && (
                <div
                  style={{
                    paddingLeft: 38,
                    display: "flex",
                    gap: 5,
                    flexWrap: "wrap",
                  }}
                >
                  {chips.map(function (q, qi) {
                    return (
                      <button
                        key={qi}
                        onClick={function () {
                          setInput(q);
                        }}
                        style={{
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 14,
                          border: "1px solid" + (D ? "#374151" : "#d1d5db"),
                          background: D ? "#191a2b" : "#fff",
                          color: mu(D),
                          cursor: "pointer",
                        }}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {sending && (
          <div
            style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {" "}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: "16px 16px 16px 4px",
                background: D ? "#191a2b" : "#f3f4f6",
                fontSize: 13,
                color: mu(D),
              }}
            >
              <span>Thinking</span>
              <span style={{ animation: "none" }}>…</span>
            </div>
          </div>
        )}
      </div>
      {}
      <div
        style={{
          borderTop: `1px solid ${bd2}`,
          background: D ? "#0d1117" : "#fff",
          padding: "10px 16px",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {}
          {files.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              {files.map((f, fi) => (
                <div
                  key={fi}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 8px",
                    borderRadius: 8,
                    background: D ? "#191a2b" : "#f3f4f6",
                    border: `1px solid ${bd2}`,
                    maxWidth: 160,
                  }}
                >
                  {f.isImage && (
                    <img
                      src={f.preview}
                      alt=""
                      style={{
                        height: 28,
                        width: 28,
                        objectFit: "cover",
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {!f.isImage && (
                    <span style={{ fontSize: 14, flexShrink: 0 }}>
                      {fileIcon(f)}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      color: mu(D),
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.name}
                  </span>
                  <button
                    onClick={() =>
                      setFiles((p) => p.filter((_, i) => i !== fi))
                    }
                    style={{
                      flexShrink: 0,
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 14,
                      height: 14,
                      fontSize: 9,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {err && (
            <p style={{ fontSize: 11, color: "#ef4444", marginBottom: 6 }}>
              {err}
            </p>
          )}
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <button
              onClick={quizMe}
              disabled={sending || quizzing}
              style={{
                ...B("#f59e0b", false, {
                  fontSize: 11,
                  padding: "4px 12px",
                  fontWeight: 700,
                  opacity: sending || quizzing ? 0.5 : 1,
                  cursor: sending || quizzing ? "not-allowed" : "pointer",
                }),
              }}
            >
              {quizzing ? "Generating…" : "Quiz Me"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <input
              ref={fileRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={addFiles}
            />
            <button
              onClick={function () {
                if (fileRef.current) fileRef.current.click();
              }}
              title="Upload files"
              style={{
                ...B("transparent", true, {
                  fontSize: 16,
                  padding: "7px 10px",
                  borderColor: bd2,
                  color: mu(D),
                  flexShrink: 0,
                }),
              }}
            >
              {" "}
            </button>
            <button
              onClick={startVoice}
              title={listening ? "Listening…" : "Voice input"}
              style={{
                ...B(listening ? "#ef4444" : "transparent", !listening, {
                  fontSize: 16,
                  padding: "7px 10px",
                  flexShrink: 0,
                  borderColor: listening ? "#ef4444" : bd2,
                  color: listening ? "#ef4444" : mu(D),
                }),
              }}
            >
              {listening ? "●" : " "}
            </button>
            <textarea
              value={input}
              onChange={function (e) {
                setInput(e.target.value);
              }}
              rows={2}
              onKeyDown={function (e) {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={
                listening
                  ? "Listening…"
                  : mode === "homework"
                    ? "Ask a question or describe your homework…"
                    : "Ask about this topic…"
              }
              style={{
                ...I(D, {
                  flex: 1,
                  resize: "none",
                  lineHeight: 1.6,
                  padding: "8px 12px",
                }),
              }}
            />
            <button
              onClick={send}
              disabled={sending || (!input.trim() && !files.length)}
              style={{
                ...B("#7c3aed", false, {
                  padding: "9px 16px",
                  flexShrink: 0,
                  fontSize: 16,
                  opacity:
                    sending || (!input.trim() && !files.length) ? 0.4 : 1,
                  cursor:
                    sending || (!input.trim() && !files.length)
                      ? "not-allowed"
                      : "pointer",
                }),
              }}
            ></button>
          </div>
          <p
            style={{
              fontSize: 10,
              color: mu(D),
              marginTop: 5,
              textAlign: "center",
            }}
          >
            Using
            <strong>{activeModel.label}</strong> · May make mistakes — verify
            with your teacher
          </p>
        </div>
      </div>
    </div>
  );
}
