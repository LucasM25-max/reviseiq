import React, { useState } from "react";
import { _aiWithRetry, _parseAIJson, callAI } from "./aiService.js";
import { DiagramRenderer } from "./diagrams.jsx";
import { RichEditor } from "./richText.jsx";
import { B, C, I, mu, showToast, stripHtml, tx, uid } from "./ui.jsx";

export function CreateModal({ mode, D, subjects, onClose, onSave, initialItem }) {
  const isEdit = !!initialItem;
  const def = {
    title: "",
    subjectId: subjects[0]?.id || "",
    topicId: "",
    heading: "",
    body: "",
    q: "",
    a: "",
    type: "mcq",
    text: "",
    marks: 1,
    options: ["", "", "", ""],
    answer: 0,
    explanation: "",
    markScheme: "",
    sampleAnswer: "",
    year: "",
    images: [],
    diagram: null,
    cardImage: null,
    cardImageCaption: "",
    cardType: "standard",
  };
  const [f, setF] = useState(() =>
    !initialItem
      ? def
      : {
          ...def,
          ...initialItem,
          options: initialItem.options || ["", "", "", ""],
          images: initialItem.images || [],
          marks: initialItem.marks ?? 1,
          diagram: initialItem.diagram || null,
          cardImage: initialItem.cardImage || null,
          cardImageCaption: initialItem.cardImageCaption || "",
          cardType: initialItem.cardType || "standard",
        },
  );
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valid = () => {
    if (mode === "section") return f.title.trim() && f.subjectId;
    if (mode === "subtopic") return f.title.trim();
    if (mode === "note") return f.heading.trim() && stripHtml(f.body);
    if (mode === "flashcard") return stripHtml(f.q) && stripHtml(f.a);
    if (mode === "question") return;
    stripHtml(f.text) &&
      f.marks > 0 &&
      (f.type !== "mcq" || f.options.every((o) => o.trim()));
    if (mode === "paper")
      return f.year.trim() && (f.paperUrl?.trim() || f.markSchemeUrl?.trim());
    return false;
  };
  const save = () => {
    if (!valid()) return;
    if (isEdit) {
      if (mode === "note")
        onSave({
          ...initialItem,
          heading: f.heading,
          body: f.body,
          images: f.images,
          diagram: f.diagram || null,
        });
      else if (mode === "flashcard")
        onSave({
          ...initialItem,
          q: f.q,
          a: f.a,
          images: f.images,
          cardImage: f.cardImage || null,
          cardImageCaption: f.cardImageCaption || "",
          diagram: f.diagram || null,
          cardType: f.cardType || "standard",
        });
      else if (mode === "question") {
        const base = {
          ...initialItem,
          type: f.type,
          text: f.text,
          marks: Number(f.marks),
          year: f.year,
          images: f.images,
        };
        if (f.type === "mcq")
          onSave({
            ...base,
            options: f.options,
            answer: f.answer,
            explanation: f.explanation,
          });
        else
          onSave({
            ...base,
            markScheme: f.markScheme,
            sampleAnswer: f.sampleAnswer,
          });
      }
      return;
    }
    const id = `${mode.slice(0, 2)}-${uid()}`;
    if (mode === "section")
      onSave({
        id,
        src: "admin",
        subjectId: f.subjectId,
        topicId: f.topicId,
        title: f.title,
        notes: [],
        flashcards: [],
        questions: [],
        subtopics: [],
      });
    else if (mode === "subtopic")
      onSave({ id, title: f.title, notes: [], flashcards: [], questions: [] });
    else if (mode === "note")
      onSave({
        id,
        heading: f.heading,
        body: f.body,
        images: f.images,
        diagram: f.diagram || null,
      });
    else if (mode === "flashcard")
      onSave({
        id,
        q: f.q,
        a: f.a,
        images: f.images,
        cardImage: f.cardImage || null,
        cardImageCaption: f.cardImageCaption || "",
        diagram: f.diagram || null,
        cardType: f.cardType || "standard",
      });
    else if (mode === "question") {
      const base = {
        id,
        type: f.type,
        text: f.text,
        marks: Number(f.marks),
        year: f.year,
        images: f.images,
      };
      if (f.type === "mcq")
        onSave({
          ...base,
          options: f.options,
          answer: f.answer,
          explanation: f.explanation,
        });
      else
        onSave({
          ...base,
          markScheme: f.markScheme,
          sampleAnswer: f.sampleAnswer,
        });
    } else if (mode === "paper")
      onSave({
        id,
        year: f.year,
        title: f.title,
        paperUrl: f.paperUrl || "",
        markSchemeUrl: f.markSchemeUrl || "",
        examinerUrl: f.examinerUrl || "",
      });
  };
  const Lbl = ({ c }) => (
    <label
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: mu(D),
        display: "block",
        marginBottom: 5,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {c}
    </label>
  );
  const Inp = (k, ph) => (
    <input
      style={I(D)}
      placeholder={ph}
      value={f[k] || ""}
      onChange={(e) => set(k, e.target.value)}
    />
  );
  const TA = (k, ph, rows = 4) => (
    <textarea
      style={{ ...I(D, { resize: "vertical" }) }}
      rows={rows}
      placeholder={ph}
      value={f[k] || ""}
      onChange={(e) => set(k, e.target.value)}
    />
  );
  const Sel = (k, opts, cb) => (
    <select
      style={I(D)}
      value={f[k] || ""}
      onChange={(e) => {
        set(k, e.target.value);
        cb && cb(e.target.value);
      }}
    >
      {opts.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  );
  const titles = {
    section: isEdit ? "Edit Topic" : "New Topic",
    note: isEdit ? "Edit Note" : "NewNote",
    flashcard: isEdit ? "Edit Flashcard" : "New Flashcard",
    question: isEdit ? "Edit Question" : "NewQuestion",
    paper: "Add Past Paper",
    subtopic: isEdit ? "Edit Sub-topic" : "New Sub-topic",
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          ...C(D),
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflow: "auto",
          padding: 28,
        }}
        className="slide-up"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 16, color: tx(D) }}>
            {titles[mode] || mode}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: mu(D),
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "section" && (
            <>
              <div>
                <Lbl c="Subject" />
                {Sel(
                  "subjectId",
                  subjects.map((s) => ({
                    v: s.id,
                    l: `${s.icon}
${s.name}`,
                  })),
                  (v) => set("topicId", ""),
                )}
              </div>
              <div>
                <Lbl c="Topic ID (optional)" />
                {Inp("topicId", "e.g. bio-t1")}
              </div>
              <div>
                <Lbl c="Topic Title" />
                {Inp("title", "e.g. Cell Biology")}
              </div>
            </>
          )}
          {mode === "subtopic" && (
            <>
              <div>
                <Lbl c="Sub-topic Title" />
                {Inp("title", "e.g. 4.1.4 Stem Cells")}
              </div>
            </>
          )}
          {mode === "note" && (
            <>
              <div>
                <Lbl c="Heading" />
                {Inp("heading", "e.g. Types of Stem Cells")}
              </div>

              <div>
                <Lbl c="Content" />
                <RichEditor
                  value={f.body || ""}
                  onChange={(v) => set("body", v)}
                  D={D}
                  placeholder="Write revision notes…"
                  minHeight={140}
                />
              </div>
              <div>
                <Lbl c="Diagram" />
                {f.diagram ? (
                  <div style={{ ...C(D), padding: 12, marginBottom: 4 }}>
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
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#6366f1",
                        }}
                      >
                        {f.diagram.type}
                        diagram
                      </span>
                      <button
                        onClick={() => set("diagram", null)}
                        style={{
                          fontSize: 11,
                          color: "#ef4444",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <DiagramRenderer diagram={f.diagram} D={D} width={480} />
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      if (!f.body || !stripHtml(f.body).trim()) {
                        showToast("Add note content first", "warn");
                        return;
                      }
                      showToast("Generating diagram…");
                      try {
                        const prompt = `You are a GCSE revision diagram designer. Analyse this note
content and return ONLY valid JSON (no markdown) for the most appropriate SVG diagram
template.
Content: ${stripHtml(f.body).slice(0, 600)}
Choose ONE type from: process, cycle, hierarchy, comparison, timeline.
Return: {"type":"process","accent":"#059669","data":{"steps":[{"id":"1","label":"Step
name","sublabel":"optional detail"}]}}
For cycle: data.steps array.
For hierarchy: data.root with {label,children:[{label,children?}]}.
For comparison:
data.rows=[{id,label}],data.columns=[{id,label}],data.cells={"rowId:colId":true/false/"partial"}.
For timeline: data.events=[{id,label,date,sublabel?,important?}].
Keep labels short (2-4 words). Maximum 8 items. Use appropriate accent colour.`;

                        const parsed = await _aiWithRetry(
                          async () => {
                            const raw = await callAI(prompt, 800);
                            const p = _parseAIJson(raw);
                            if (!p || !p.type) throw new Error("No diagram");
                            return p;
                          },
                          2,
                          null,
                        );

                        if (parsed) set("diagram", parsed);
                        else
                          showToast(
                            "Could not generate diagram — try again",
                            "error",
                          );
                      } catch (err) {
                        showToast(
                          "Diagram generation failed: " + err.message,
                          "error",
                        );
                      }
                    }}
                    style={{
                      ...B("#6366f1", true, {
                        fontSize: 12,
                        padding: "7px 14px",
                      }),
                    }}
                  >
                    Generate Diagram
                  </button>
                )}
              </div>
              <div>
                <Lbl c="Images (appear inline with content)" />
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {(f.images || []).map((img, ii) => (
                    <div
                      key={ii}
                      style={{ position: "relative", width: 56, height: 56 }}
                    >
                      <img
                        src={img.image}
                        alt=""
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: `1px solid ${D ? "#2a3347" : "#e5e7eb"}`,
                        }}
                      />
                      <button
                        onClick={() =>
                          set(
                            "images",
                            (f.images || []).filter((_, idx) => idx !== ii),
                          )
                        }
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 16,
                          height: 16,
                          fontSize: 10,
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
                  ))}
                  <label
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 6,
                      border: `1.5px dashed ${D ? "#374151" : "#d1d5db"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 20,
                      color: mu(D),
                    }}
                  >
                    +
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        Array.from(e.target.files || []).forEach((file) => {
                          const r = new FileReader();
                          r.onload = (ev) =>
                            set("images", [
                              ...(f.images || []),
                              { image: ev.target.result, annotations: [] },
                            ]);
                          r.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <p style={{ fontSize: 11, color: mu(D), marginTop: 4 }}>
                  Images appear directly after the note content.
                </p>
              </div>
            </>
          )}
          {mode === "flashcard" && (
            <>
              <div>
                <Lbl c="Question" />
                <RichEditor
                  value={f.q || ""}
                  onChange={(v) => set("q", v)}
                  D={D}
                  placeholder="Question…"
                  minHeight={100}
                />
              </div>
              <div>
                <Lbl c="Answer" />
                <RichEditor
                  value={f.a || ""}
                  onChange={(v) => set("a", v)}
                  D={D}
                  placeholder="Answer…"
                  minHeight={100}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mu(D),
                    display: "block",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Shared Visual (shown on both sides)
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      ...B("#6366f1", true, {
                        fontSize: 12,
                        padding: "6px 12px",
                        cursor: "pointer",
                      }),
                    }}
                  >
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const r = new FileReader();
                        r.onload = (ev) => {
                          set("cardImage", ev.target.result);
                          set("cardType", "dual-coded");
                        };
                        r.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    onClick={async () => {
                      const content =
                        stripHtml(f.q || "") + " " + stripHtml(f.a || "");
                      if (!content.trim()) {
                        showToast("Add question and answer first", "warn");
                        return;
                      }
                      showToast("Generating diagram…");
                      try {
                        const prompt = `You are a GCSE revision diagram designer. Analyse this flashcard
content and return ONLY valid JSON (no markdown) for the most appropriate
diagram.\n\nQuestion: ${stripHtml(f.q || "").slice(0, 200)}\nAnswer:
${stripHtml(f.a || "").slice(0, 200)}\n\nChoose ONE type: process, cycle, hierarchy, comparison,
structure, timeline.\nReturn:
{"type":"process","accent":"#059669","data":{"steps":[{"id":"1","label":"Step
name","sublabel":"optional"}]}}\nKeep labels under 4 words. Max 7 items.`;

                        const parsed = await _aiWithRetry(
                          async () => {
                            const raw = await callAI(prompt, 600);
                            const p = _parseAIJson(raw);
                            if (!p || !p.type) throw new Error("No diagram");
                            return p;
                          },
                          2,
                          null,
                        );
                        if (parsed) {
                          set("diagram", parsed);
                          set("cardType", "dual-coded");
                        } else
                          showToast("Could not generate — try again", "error");
                      } catch (err) {
                        showToast("Failed: " + err.message, "error");
                      }
                    }}
                    style={{
                      ...B("#6366f1", true, {
                        fontSize: 12,
                        padding: "6px 12px",
                      }),
                    }}
                  >
                    Generate Diagram
                  </button>
                  {(f.cardImage || f.diagram) && (
                    <button
                      onClick={() => {
                        set("cardImage", null);
                        set("diagram", null);
                        set("cardType", "standard");
                      }}
                      style={{
                        ...B("#ef4444", true, {
                          fontSize: 12,
                          padding: "6px 12px",
                        }),
                      }}
                    >
                      Remove Visual
                    </button>
                  )}
                </div>
                {f.cardImage && (
                  <div style={{ marginBottom: 8 }}>
                    <img
                      src={f.cardImage}
                      alt="card visual"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 160,
                        borderRadius: 8,
                        display: "block",
                        border: `1px solid ${D ? "#2a3347" : "#e5e7eb"}`,
                      }}
                    />
                    <input
                      style={{ ...I(D, { marginTop: 6, fontSize: 12 }) }}
                      placeholder="Caption for answerside (optional)"
                      value={f.cardImageCaption || ""}
                      onChange={(e) => set("cardImageCaption", e.target.value)}
                    />
                  </div>
                )}
                {f.diagram && !f.cardImage && (
                  <div style={{ ...C(D), padding: 12, marginBottom: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#6366f1",
                        }}
                      >
                        {f.diagram.type}
                        diagram
                      </span>
                    </div>
                    <DiagramRenderer diagram={f.diagram} D={D} width={460} />
                  </div>
                )}
                <p style={{ fontSize: 11, color: mu(D), marginTop: 4 }}>
                  The visual stays visible on both sides — the question and
                  answer change around it.
                </p>
              </div>
            </>
          )}
          {mode === "question" && (
            <>
              <div>
                <Lbl c="Type" />
                {Sel("type", [
                  { v: "mcq", l: "Multiple Choice" },
                  { v: "short", l: "ShortAnswer" },
                  { v: "extended", l: "Extended Response" },
                ])}
              </div>
              <div>
                <Lbl c="Question Text" />
                <RichEditor
                  value={f.text || ""}
                  onChange={(v) => set("text", v)}
                  D={D}
                  placeholder="Write the exam question…"
                  minHeight={100}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Lbl c="Marks" />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    style={{ ...I(D, { width: 90 }) }}
                    value={f.marks}
                    onChange={(e) => set("marks", e.target.value)}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <Lbl c="Year" />
                  {Inp("year", "e.g. 2023")}
                </div>
              </div>
              {f.type === "mcq" && (
                <>
                  {["A", "B", "C", "D"].map((ltr, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          paddingBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <input
                          type="radio"
                          name="cr"
                          checked={f.answer === i}
                          onChange={() => set("answer", i)}
                          style={{
                            accentColor: "#6366f1",
                            width: 14,
                            height: 14,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: mu(D),
                          }}
                        >
                          {ltr}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          style={I(D)}
                          placeholder={`Option ${ltr}${f.answer === i ? "✓" : ""}`}
                          value={f.options[i]}
                          onChange={(e) => {
                            const o = [...f.options];
                            o[i] = e.target.value;
                            set("options", o);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div>
                    <Lbl c="Explanation" />
                    {TA("explanation", "Why is the correct optionright?", 2)}
                  </div>
                </>
              )}
              {(f.type === "short" || f.type === "extended") && (
                <>
                  <div>
                    <Lbl c="Mark Scheme" />
                    <RichEditor
                      value={f.markScheme || ""}
                      onChange={(v) => set("markScheme", v)}
                      D={D}
                      placeholder="(1) … (2) …"
                      minHeight={100}
                    />
                  </div>
                  <div>
                    <Lbl c="Model Answer" />
                    <RichEditor
                      value={f.sampleAnswer || ""}
                      onChange={(v) => set("sampleAnswer", v)}
                      D={D}
                      placeholder="Full model answer…"
                      minHeight={100}
                    />
                  </div>
                </>
              )}
            </>
          )}
          {mode === "paper" && (
            <>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Lbl c="Year" />
                  {Inp("year", "e.g. 2023")}
                </div>
                <div style={{ flex: 2 }}>
                  <Lbl c="Title" />
                  {Inp("title", "e.g. Paper 1 Higher")}
                </div>
              </div>
              <div>
                <Lbl c="Past Paper URL" />
                {Inp("paperUrl", "https://…")}
              </div>
              <div>
                <Lbl c="Mark Scheme URL" />
                {Inp("markSchemeUrl", "https://…")}
              </div>
              <div>
                <Lbl c="Examiner Report URL" />
                {Inp("examinerUrl", "https://…")}
              </div>
            </>
          )}
          {(mode === "flashcard" || mode === "question") && (
            <div>
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
                Images
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {(f.images || []).map((img, ii) => (
                  <div
                    key={ii}
                    style={{ position: "relative", width: 56, height: 56 }}
                  >
                    <img
                      src={img.image}
                      alt=""
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: `1px solid ${D ? "#2a3347" : "#e5e7eb"}`,
                      }}
                    />
                    <button
                      onClick={() =>
                        set(
                          "images",
                          (f.images || []).filter((_, idx) => idx !== ii),
                        )
                      }
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                        fontSize: 10,
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
                ))}
                <label
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 6,
                    border: `1.5px dashed ${D ? "#374151" : "#d1d5db"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 20,
                    color: mu(D),
                  }}
                >
                  +
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      Array.from(e.target.files || []).forEach((file) => {
                        const r = new FileReader();
                        r.onload = (ev) =>
                          set("images", [
                            ...(f.images || []),
                            { image: ev.target.result, annotations: [] },
                          ]);
                        r.readAsDataURL(file);
                      });
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: `1px
solid ${D ? "#374151" : "#d1d5db"}`,
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              color: mu(D),
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!valid()}
            style={{
              ...B("#6366f1", false, {
                flex: 2,
                padding: "10px 0",
                opacity: valid() ? 1 : 0.4,
                cursor: valid() ? "pointer" : "not-allowed",
              }),
            }}
          >
            {isEdit
              ? `Update
${mode[0].toUpperCase() + mode.slice(1)}`
              : `Save
${mode[0].toUpperCase() + mode.slice(1)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
