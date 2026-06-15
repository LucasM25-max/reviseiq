import { buildAISessionPrompt, applyAISession } from "./learningEngine.js";
import { B, C } from "./ui.jsx";

export var _GROQ_KEY_ALIAS = [];

// Gemini model routing. All AI runs on Google Gemini via the /api/ai (text)
// and /api/image (image generation) serverless proxies. Models per task:
//   gemini-pro-latest        -> deep reasoning: AI Tutor, exam marking
//   gemini-flash-latest      -> balanced: question / notes / flashcard generation
//   gemini-flash-lite-latest -> fast and cheap: planning, short summaries
//   gemini-2.5-flash-image   -> image generation (AI Tutor visuals)
export const GEMINI_PRO = "gemini-pro-latest";
export const GEMINI_FLASH = "gemini-flash-latest";
export const GEMINI_FLASH_LITE = "gemini-flash-lite-latest";
export const GEMINI_IMAGE = "gemini-2.5-flash-image";

export var _GEMINI_MODELS = [GEMINI_FLASH, GEMINI_FLASH_LITE];

export const TUTOR_MODELS = [
  { model: GEMINI_PRO, label: "Gemini Pro", dailyLimit: 999 },
];

export const tutorUsageKey = function (u) {
  return (
    "gcse:tu:" +
    (u || "").replace(/\W/g, "-") +
    ":" +
    new Date().toISOString().slice(0, 10)
  );
};

export async function getTutorUsage(u) {
  try {
    var r = await window.storage.get(tutorUsageKey(u), true);
    return r && r.value ? JSON.parse(r.value) : {};
  } catch (e) {
    return {};
  }
}

export async function incTutorUsage(u, modelName) {
  try {
    var k2 = tutorUsageKey(u);
    var cur = await getTutorUsage(u);
    cur[modelName] = (cur[modelName] || 0) + 1;
    await window.storage.set(k2, JSON.stringify(cur), true);
  } catch (e) {}
}

export async function pickTutorModel(u) {
  return TUTOR_MODELS[0];
}

export async function _aiRequest(systemPrompt, messages, maxTokens, model) {
  var tokLimit = maxTokens && maxTokens > 0 ? maxTokens : 1500;
  var msgs = [];
  if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });

  var hasImages = false;
  for (var ci = 0; ci < messages.length; ci++) {
    var cm = messages[ci];
    if (cm._d && cm._d.files && Array.isArray(cm._d.files)) {
      for (var fi2 = 0; fi2 < cm._d.files.length; fi2++) {
        if (cm._d.files[fi2].isImage || (cm._d.files[fi2].isPdf && cm._d.files[fi2].data)) hasImages = true;
      }
    }
  }
  for (var i = 0; i < messages.length; i++) {
    var m = messages[i];
    var role = m.role === "assistant" ? "assistant" : "user";
    var txt = "";
    if (m._d && typeof m._d.text === "string") txt = m._d.text;
    else if (typeof m.content === "string") txt = m.content;
    else if (Array.isArray(m.content)) {
      txt = m.content
        .filter(function (p) {
          return p.type === "text";
        })
        .map(function (p) {
          return p.text || "";
        })
        .join("\n");
    }

    if (m._d && m._d.files && Array.isArray(m._d.files)) {
      var fileParts = [];
      for (var fi = 0; fi < m._d.files.length; fi++) {
        var f = m._d.files[fi];

        if (f.isText && f.textContent)
          fileParts.push(
            "[Uploaded text file:" + f.name + "]\n" + f.textContent,
          );
        else if (f.isPdf) {
          if (!f.data)
            fileParts.push("[Uploaded PDF: " + f.name + " — content unavailable]");
        }
        else if (f.isImage) {
        } else if (f.unsupported) {
          fileParts.push("[Uploaded file: " + f.name + "]");
        }
      }
      if (fileParts.length)
        txt = txt
          ? txt + "\n\n" + fileParts.join("\n\n")
          : fileParts.join("\n\n");
    }
    if (
      !txt.trim() &&
      !(
        m._d &&
        m._d.files &&
        m._d.files.some(function (f) {
          return f.isImage || (f.isPdf && f.data);
        })
      )
    )
      continue;

    var msgContent;
    if (
      m._d &&
      m._d.files &&
      m._d.files.some(function (f) {
        return f.isImage || (f.isPdf && f.data);
      })
    ) {
      var contentArr = [];
      if (txt.trim()) contentArr.push({ type: "text", text: txt });
      for (var ii = 0; ii < m._d.files.length; ii++) {
        var imgF = m._d.files[ii];
        if (imgF.isImage && imgF.data) {
          contentArr.push({
            type: "image_url",
            image_url: { url: "data:" + imgF.type + ";base64," + imgF.data },
          });
        } else if (imgF.isPdf && imgF.data) {
          contentArr.push({
            type: "image_url",
            image_url: { url: "data:application/pdf;base64," + imgF.data },
          });
        }
      }
      msgContent = contentArr;
    } else {
      msgContent = txt;
    }

    if (
      typeof msgContent === "string" &&
      msgs.length > 0 &&
      msgs[msgs.length - 1].role === role &&
      typeof msgs[msgs.length - 1].content === "string"
    ) {
      msgs[msgs.length - 1].content += "\n" + msgContent;
    } else {
      msgs.push({ role: role, content: msgContent });
    }
  }
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") {
    msgs.push({ role: "user", content: "Hello" });
  }

  // Every Gemini model is multimodal, so image inputs need no special model.
  // Use the requested model first, then fall back through the tiers.
  var primary = model || (hasImages ? GEMINI_PRO : GEMINI_FLASH);
  var modelList = [primary].concat(
    [GEMINI_PRO, GEMINI_FLASH, GEMINI_FLASH_LITE].filter(function (m) {
      return m !== primary;
    }),
  );
  var lastErr = new Error("AI unavailable.");
  for (var mi = 0; mi < modelList.length; mi++) {
    try {
      var resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelList[mi],
          messages: msgs,
          max_tokens: tokLimit,
          temperature: 0.7,
        }),
      });
      var dat = await resp.json();
      if (dat.error) {
        var errMsg =
          typeof dat.error === "string"
            ? dat.error
            : dat.error.message || "AI error";
        var el = errMsg.toLowerCase();

        var shouldRetry =
          el.indexOf("model") !== -1 ||
          el.indexOf("not found") !== -1 ||
          el.indexOf("does not exist") !== -1 ||
          el.indexOf("vision") !== -1 ||
          el.indexOf("image") !== -1 ||
          el.indexOf("multimodal") !== -1 ||
          el.indexOf("unsupported") !== -1 ||
          el.indexOf("429") !== -1 ||
          el.indexOf("rate") !== -1;
        if (shouldRetry) {
          lastErr = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }
      var text =
        dat.choices &&
        dat.choices[0] &&
        dat.choices[0].message &&
        dat.choices[0].message.content;
      if (!text) {
        lastErr = new Error("Empty response from AI");
        continue;
      }
      return text;
    } catch (ex) {
      lastErr = ex;
      continue;
    }
  }
  throw lastErr;
}

export async function callAI(prompt, maxTokens, model) {
  return _aiRequest(
    null,
    [{ role: "user", content: prompt }],
    maxTokens || 1500,
    model,
  );
}

export async function callAIChat(systemPrompt, messages, maxTokens, model) {
  return _aiRequest(systemPrompt || null, messages, maxTokens || 1500, model);
}

export var callGeminiSimple = callAI;

export var callGeminiChat = function (_ignored, systemPrompt, messages) {
  return callAIChat(systemPrompt, messages);
};

// Generate an educational illustration with gemini-2.5-flash-image.
// Returns a data: URL string, or null if generation is unavailable.
export async function generateTutorImage(prompt) {
  try {
    var resp = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: GEMINI_IMAGE, prompt: prompt }),
    });
    var dat = await resp.json();
    if (dat && dat.image) return dat.image;
  } catch (e) {}
  return null;
}

export function _aiClamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, Number(v) || 0));
}

export function _aiArr(v) {
  return Array.isArray(v) ? v : [];
}

export function _aiStr(v, fb) {
  return typeof v === "string" && v.trim() ? v.trim() : fb || "";
}

export function _parseAIJson(raw) {
  if (!raw) return null;
  var text = String(raw)
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  var s = text.indexOf("{"),
    e = text.lastIndexOf("}");
  if (s >= 0 && e > s) {
    try {
      return JSON.parse(text.slice(s, e + 1));
    } catch (_) {}
  }

  var as = text.indexOf("["),
    ae = text.lastIndexOf("]");
  if (as >= 0 && ae > as) {
    try {
      return JSON.parse(text.slice(as, ae + 1));
    } catch (_) {}
  }

  try {
    var openCount = 0;
    var inStr = false;
    var esc = false;
    for (var ci = 0; ci < text.length; ci++) {
      var ch = text[ci];
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === "\\" && inStr) {
        esc = true;
        continue;
      }
      if (ch === '"') {
        inStr = !inStr;
        continue;
      }
      if (!inStr) {
        if (ch === "{") openCount++;
        else if (ch === "}") openCount--;
      }
    }
    var repaired = text + "}".repeat(Math.max(0, openCount));
    return JSON.parse(repaired);
  } catch (_) {
    return null;
  }
}

export async function _aiWithRetry(fn, attempts, fallbackFn) {
  var lastErr;
  for (var i = 0; i < (attempts || 2); i++) {
    try {
      var r = await fn();
      if (r != null) return r;
    } catch (e) {
      lastErr = e;
      if (i < (attempts || 2) - 1)
        await new Promise(function (res) {
          setTimeout(res, 700 * (i + 1));
        });
    }
  }
  return typeof fallbackFn === "function" ? fallbackFn() : fallbackFn;
}

export async function buildAIPersonalisedSession(
  ctx,
  allSections,
  stats,
  fcHist,
  fallbackPlan,
) {
  if (!ctx || !ctx.hasEnoughData) return fallbackPlan;
  const prompt = buildAISessionPrompt(ctx, allSections, stats, fcHist);
  try {
    const raw = await callAI(prompt, 800, GEMINI_FLASH_LITE);
    const parsed = _parseAIJson(raw);
    return applyAISession(parsed, fallbackPlan);
  } catch (_) {
    return fallbackPlan;
  }
}

export function _rubricFallback(q, ans) {
  var hasAns = (ans || "").trim().length > 20;
  var maxM = Number(q.marks) || 1;

  var score = hasAns ? Math.max(1, Math.ceil(maxM * 0.35)) : 0;
  var ms = q.markScheme || q.sampleAnswer || "";
  var firstPoint =
    ms.split("\n").filter(function (l) {
      return l.trim();
    })[0] || "See mark scheme";
  return {
    score: score,
    band:
      score === 0
        ? "Not attempted"
        : score >= maxM * 0.7
          ? "Achieving"
          : "Developing",
    feedback: hasAns
      ? "AI marking is temporarily unavailable. Self-mark using the mark scheme — check eachbullet point against your answer."
      : "No answer submitted — attempt the question before submitting.",
    missedPoints: hasAns ? [firstPoint] : [],
    strengths: hasAns ? ["Attempted the question"] : [],
    examTip:
      "Re-read the command word and check you have addressed it directly.",
    modelAnswer: _aiStr(q.sampleAnswer || q.markScheme, ""),
    errorType: null,
    annotatedAnswer: [],
    comparisonTable: [],
    structureDiagram: ["Point", "Evidence", "Explanation", "Application"],
    workedSolution: _aiStr(q.sampleAnswer || q.markScheme, ""),
  };
}

export function _validateRubric(raw, q) {
  if (!raw || typeof raw !== "object") return null;
  var maxM = Number(q.marks) || 1;
  var score = _aiClamp(raw.score, 0, maxM);
  var band = _aiStr(
    raw.band,
    score >= maxM * 0.8
      ? "Exceeding"
      : score >= maxM * 0.5
        ? "Achieving"
        : "Developing",
  );
  var fb = _aiStr(raw.feedback, "See mark scheme for guidance.");

  if (score > 0 && /not attempted|no answer/i.test(fb)) {
    fb = fb.replace(/not attempted|no answer/gi, "partially completed");
  }

  var msLines = _aiArr(raw.missedPoints)
    .map(function (p) {
      return _aiStr(p, "");
    })
    .filter(Boolean)
    .slice(0, 8);
  return {
    score: score,
    band: band,
    feedback: fb,
    missedPoints: msLines,
    strengths: _aiArr(raw.strengths)
      .map(function (p) {
        return _aiStr(p, "");
      })
      .filter(Boolean)
      .slice(0, 4),
    examTip: _aiStr(
      raw.examTip || raw.exam_tip,
      "Check command word requirements.",
    ),

    modelAnswer: _aiStr(
      raw.modelAnswer || raw.model_answer,
      _aiStr(q.sampleAnswer, ""),
    ),
    errorType:
      raw.errorType ||
      detectErrorType(q.text || "", "", q.markScheme || "", msLines),
    annotatedAnswer: _aiArr(raw.annotatedAnswer).slice(0, 14),
    comparisonTable: _aiArr(raw.comparisonTable).slice(0, 6),
    structureDiagram:
      _aiArr(raw.structureDiagram).length >= 2
        ? raw.structureDiagram
        : ["Point", "Evidence", "Explanation", "Application"],
    workedSolution: _aiStr(
      raw.workedSolution || raw.modelAnswer,
      _aiStr(q.sampleAnswer, ""),
    ),
  };
}

export async function aiServiceFeedbackRubric(q, studentAnswer) {
  var maxM = Number(q.marks) || 1;
  var isMath = /calculat|show.*work|find the|work out|compute/i.test(
    q.text || "",
  );
  var isExtd = q.type === "extended" || maxM >= 6;
  var board = _aiStr(q.board, "GCSE");
  var ms = _aiStr(
    q.markScheme || q.sampleAnswer,
    "Award marks for accurate, relevantcontent.",
  );
  var schemaLines = [
    '"score": integer 0–' + maxM,
    '"band": "Not attempted" | "Developing" | "Achieving" | "Exceeding"',
    '"feedback": "2-3 sentence examiner comment — specific not generic"',
    '"missedPoints": ["key mark-scheme point the student omitted (max 6)"]',
    '"strengths": ["specific correct point the student made (max 3)"]',
    '"examTip": "one concrete ' + board + ' exam technique tip"',
    '"modelAnswer": "complete ideal answer"',
    '"errorType": "Knowledge Gap"|"Application Error"|"Command Word Error"|"Communication Error"|null',
    '"annotatedAnswer": [{"text":"sentence from modelanswer","type":"point"|"evidence"|"explanation"|"application"}]',
    '"comparisonTable": [{"student":"excerpt from student answer","expectation":"mark point theymissed"}]',
    '"structureDiagram": ' +
      (isMath
        ? '["Formula","Substitution","Working","Answer+Units"]'
        : '["Point","Evidence","Explanation","Application"]'),
    '"workedSolution": "' +
      (isMath
        ? "full step-by-step working with units"
        : "complete modelanswer") +
      '"',
  ];
  var rulesBlock = [
    "- Score ONLY marks genuinely earned vs the mark scheme — do not be generous",
    "- Score 0 for blank, irrelevant, or completely incorrect answers",
    isMath
      ? "- Award method marks (M1) for correct method even if arithmetic is wrong"
      : "- Forextended: use level descriptors if present in mark scheme",

    isExtd
      ? "- Identify the HIGHEST level fully met — partial level = lower band"
      : "- Short answer:1 mark per distinct accurate point matching the mark scheme",
    "- errorType must be the PRIMARY reason marks were lost (not secondary)",
    "- annotatedAnswer: label each sentence of your modelAnswer by function",
    "- comparisonTable: map student phrases to the closest mark scheme expectations",
  ].join("\n");
  var prompt =
    "You are an experienced " +
    board +
    " GCSE examiner. Mark this answer withprecision.\n\n" +
    "QUESTION: " +
    (q.text || "") +
    "\n" +
    "MAX MARKS: " +
    maxM +
    "\n" +
    "MARK SCHEME:\n" +
    ms +
    "\n" +
    "STUDENT ANSWER:\n" +
    (studentAnswer || "(blank — student did not answer)") +
    "\n\n" +
    "MARKING RULES:\n" +
    rulesBlock +
    "\n\n" +
    "Respond ONLY with valid JSON — no markdown, no backticks, no extra text:\n" +
    "{\n " +
    schemaLines.join(",\n ") +
    "\n}";
  return _aiWithRetry(
    async function () {
      var raw = await callAI(prompt, 1400, GEMINI_PRO);
      var parsed = _parseAIJson(raw);
      var validated = _validateRubric(parsed, q);
      if (!validated) throw new Error("Rubric validation failed");
      return validated;
    },
    2,
    function () {
      return _rubricFallback(q, studentAnswer);
    },
  );
}

export function _blurtFallback(blurtText) {
  var wc = (blurtText || "").trim().split(/\s+/).filter(Boolean).length;
  return {
    score: wc > 80 ? 55 : wc > 40 ? 35 : wc > 15 ? 18 : 5,
    remembered:
      wc > 10
        ? ["Some content recalled — check accuracy against your notes"]
        : [],
    missed: [
      "AI analysis unavailable — manually compare your blurt against revision notes",
    ],
    partial: [],
    feedback:
      "AI is temporarily offline. Compare your blurt directly against your notes: tickcorrect points, circle gaps, highlight partial recalls. This comparison is itself a powerful retrievalexercise.",
    misconceptions: [],
  };
}

export function _validateBlurt(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    score: _aiClamp(raw.score, 0, 100),
    remembered: _aiArr(raw.remembered)
      .map(function (s) {
        return _aiStr(s, "");
      })
      .filter(Boolean)
      .slice(0, 12),
    missed: _aiArr(raw.missed)
      .map(function (s) {
        return _aiStr(s, "");
      })
      .filter(Boolean)
      .slice(0, 12),
    partial: _aiArr(raw.partial)
      .map(function (s) {
        return _aiStr(s, "");
      })
      .filter(Boolean)
      .slice(0, 8),
    feedback: _aiStr(
      raw.feedback,
      "Compare your blurt to your notes and identify the gaps.",
    ),
    misconceptions: _aiArr(raw.misconceptions)
      .map(function (s) {
        return _aiStr(s, "");
      })
      .filter(Boolean)
      .slice(0, 6),
  };
}

export async function aiServiceMisconceptionExtractor(notesText, blurtText) {
  var prompt =
    "You are a GCSE revision coach running a blurting exercise analysis.\n\n" +
    "REVISION NOTES (ground truth — treat as authoritative):\n" +
    (notesText || "(no notes provided)").slice(0, 2200) +
    "\n\n" +
    "STUDENT'S BLURT (written purely from memory — do not penalise spelling or grammar):\n" +
    (blurtText || "").slice(0, 1600) +
    "\n\n" +
    "ANALYSIS RULES:\n" +
    '- "remembered": key concepts/facts accurately demonstrated (specific, not vague)\n' +
    '- "missed": important concepts from the notes not mentioned at all\n' +
    '- "partial": concepts mentioned but inaccurately, incompletely, or too vaguely\n' +
    '- "misconceptions": factually WRONG statements — these are the highest priority to flag\n' +
    '- "score": 0–100, % of key note concepts demonstrated (realistic — most students score30–65%)\n' +
    '- "feedback": 2-sentence warm encouragement + single most important gap to addressnext\n\n' +
    "Respond ONLY with valid JSON (no markdown, no backticks):\n" +
    '{"score":50,"remembered":["specific point"],"missed":["specific point"],' +
    '"partial":["specific point"],"feedback":"...","misconceptions":["wrong claim"]}';
  return _aiWithRetry(
    async function () {
      var raw = await callAI(prompt, 1300, GEMINI_FLASH);
      var parsed = _parseAIJson(raw);
      var validated = _validateBlurt(parsed);
      if (!validated) throw new Error("Blurt validation failed");

      return validated;
    },
    2,
    function () {
      return _blurtFallback(blurtText);
    },
  );
}

export function _qFallback(subjName, needed) {
  var total =
    (needed || []).reduce(function (a, n) {
      return a + (n.count || 1);
    }, 0) || 3;
  return Array.from({ length: Math.min(total, 4) }, function (_, i) {
    return {
      id: "fallback-q-" + i + "-" + Date.now(),
      type: i === 0 ? "mcq" : "short",
      text: "Explain one key concept from " + (subjName || "this topic") + ".",
      marks: i === 0 ? 1 : 2,
      markScheme:
        "Award 1 mark per accurate, relevant point up to the maximum.",
      sampleAnswer:
        "A strong answer includes a key term, its definition, and its significance.",
      year: "AI Generated",
      options:
        i === 0 ? ["Option A", "Option B", "Option C", "Option D"] : undefined,
      answer: i === 0 ? 0 : undefined,
      explanation: i === 0 ? "Option A is most accurate." : undefined,
    };
  });
}

export function _validateQItem(q) {
  if (!q || typeof q !== "object" || !(q.text || "").trim()) return null;
  var marks = _aiClamp(q.marks, 1, 25);
  var type = ["mcq", "short", "extended"].includes(q.type) ? q.type : "short";
  var out = {
    id: _aiStr(q.id, "ai-" + Math.random().toString(36).slice(2, 9)),
    type: type,
    text: _aiStr(q.text, "Explain this concept."),
    marks: marks,
    markScheme: _aiStr(
      q.markScheme || q.mark_scheme,
      "Award marks for accurate, relevantcontent.",
    ),
    sampleAnswer: _aiStr(q.sampleAnswer || q.model_answer || q.modelAnswer, ""),
    year: _aiStr(q.year, "AI Generated"),
  };
  if (type === "mcq") {
    var opts = _aiArr(q.options).map(function (o) {
      return _aiStr(o, "Option");
    });

    while (opts.length < 4)
      opts.push("Option " + String.fromCharCode(65 + opts.length));
    out.options = opts.slice(0, 4);
    out.answer = _aiClamp(q.answer, 0, 3);
    out.explanation = _aiStr(
      q.explanation,
      "The correct option is the most accurate statement.",
    );
  }
  return out;
}

export async function aiServiceQuestionGenerator(
  subjName,
  board,
  notes,
  needed,
  markDist,
) {
  var needPart = (needed || [])
    .map(function (n) {
      return (
        "- " +
        n.count +
        " × " +
        n.type +
        " question(s), " +
        n.marks +
        " mark(s) each"
      );
    })
    .join("\n");
  var prompt =
    "You are an expert " +
    (board || "GCSE") +
    " " +
    (subjName || "subject") +
    "examiner.\n" +
    "Generate exam-quality questions:\n" +
    needPart +
    "\n\n" +
    (markDist ? "Mark distribution: " + markDist + "\n\n" : "") +
    "Content context:\n" +
    ((notes || "").slice(0, 3000) ||
      "Standard " +
        (board || "GCSE") +
        " " +
        (subjName || "subject") +
        " content") +
    "\n\n" +
    "RULES:\n" +
    "- Use authentic " +
    (board || "GCSE") +
    " command words (state, describe, explain, evaluate,calculate, compare)\n" +
    "- Do NOT include mark allocations in question text\n" +
    "- Short answer mark schemes: one bullet per mark\n" +
    "- Extended mark schemes: level descriptors L1/L2/L3 with indicative content\n" +
    "- MCQ: 4 options (A–D), exactly one correct, include explanation of why correct\n" +
    "- sampleAnswer: complete model answer for short/extended\n\n" +
    "Respond ONLY with a valid JSON array — no markdown, no backticks:\n" +
    '[{"type":"mcq"|"short"|"extended","text":"...","marks":N,' +
    '"markScheme":"...","sampleAnswer":"...","year":"AI Generated",' +
    '"options":["A...","B...","C...","D..."],"answer":0,"explanation":"..."}]';
  return _aiWithRetry(
    async function () {
      var raw = await callAI(prompt, 5000, GEMINI_FLASH);
      var parsed = _parseAIJson(raw);
      if (!Array.isArray(parsed) || !parsed.length)
        throw new Error("No questions returned");
      var validated = parsed.map(_validateQItem).filter(Boolean);
      if (!validated.length) throw new Error("All questions failed validation");
      return validated;
    },
    3,
    function () {
      return _qFallback(subjName, needed);
    },
  );
}

export function _reflectionFallback(reflections) {
  return {
    summary: reflections.understood
      ? "You understood: " + (reflections.understood || "").slice(0, 120)
      : "Session complete.",
    keyGap: reflections.unclear
      ? (reflections.unclear || "").slice(0, 200)
      : "Compare yourblurt against your notes to find any remaining gaps.",
    nextAction: reflections.improve
      ? (reflections.improve || "").slice(0, 200)
      : "Try a blurtingexercise on the weakest topic next time.",
    encouragement:
      "Every study session builds your long-term memory — keep the habit!",
  };
}

export async function aiServiceReflectionSummarizer(reflections, subjectName) {
  if (
    !reflections ||
    (!reflections.understood && !reflections.unclear && !reflections.improve)
  ) {
    return _reflectionFallback(reflections || {});
  }
  var prompt =
    "You are a warm, evidence-informed GCSE study coach. A student just completed a revision session on " +
    (subjectName || "their subject") +
    " and reflected as follows.\n\n" +
    "Understood well: " +
    _aiStr(reflections.understood, "Not specified") +
    "\n" +
    "Still unclear: " +
    _aiStr(reflections.unclear, "Not specified") +
    "\n" +
    "Will do differently: " +
    _aiStr(reflections.improve, "Not specified") +
    "\n\n" +
    "Give a brief coaching response. Respond ONLY with valid JSON:\n" +
    '{"summary":"1 sentence: what went well","keyGap":"most important concept to revisit",' +
    '"nextAction":"specific evidence-based technique to use next session (e.g. spaced retrieval,blurting, practice questions)",' +
    '"encouragement":"1 warm sentence"}';
  return _aiWithRetry(
    async function () {
      var raw = await callAI(prompt, 450, GEMINI_FLASH_LITE);
      var parsed = _parseAIJson(raw);
      if (!parsed || !parsed.summary)
        throw new Error("Invalid reflection output");
      return {
        summary: _aiStr(parsed.summary, ""),
        keyGap: _aiStr(parsed.keyGap, _aiStr(reflections.unclear, "")),
        nextAction: _aiStr(
          parsed.nextAction,
          _aiStr(reflections.improve, "Review your notes"),
        ),
        encouragement: _aiStr(
          parsed.encouragement,
          "Great work — keep the habit!",
        ),
      };
    },
    2,
    function () {
      return _reflectionFallback(reflections);
    },
  );
}

export function buildTutorSystemPrompt(
  ctx,
  mode,
  board,
  subjName,
  topicLabel,
  socraticLevel,
) {
  var lvl = typeof socraticLevel === "number" ? socraticLevel : 2;
  var imgInstr =
    "IMAGES: When a labelled diagram or visual would genuinely aid understanding (for example a biological structure, a physics setup, or a graph), include a marker on its own line in the form [IMG: a detailed description of the educational image to generate]. An image will be generated from that description and shown to the student. Use it only when a visual materially helps comprehension - never decoratively - and at most one or two per reply.";
  var pedagogyBlock;
  if (mode === "homework") {
    pedagogyBlock =
      "HOMEWORK HELP MODE — STRICT RULES:\n" +
      "- NEVER state the final answer outright\n" +
      '- Open with "What does the question ask you to find?" or "What information is given?"\n' +
      '- After each student response, celebrate correct steps: "Exactly — now what comes next?"\n' +
      "- Guide to the method step by step; let the student reach the answer themselves\n" +
      "- Only reveal the complete worked answer if the student has made 3+ genuine attempts\n";
  } else if (lvl >= 2) {
    pedagogyBlock =
      "TEACHING APPROACH — SOCRATIC MODE (default for new conversations):\n" +
      '- For the FIRST message on any topic: ask "What do you already know about [topic]?"before explaining\n' +
      '- Use guiding questions: "What does the command word tell you?", "Which formulaapplies?", "What would happen if…?"\n' +
      "- After a student attempt, validate correct parts explicitly before correcting gaps\n" +
      "- Only give a full direct explanation after at least ONE student retrieval attempt\n" +
      "- End every substantive response with a follow-up question or a self-test prompt\n" +
      '- For misconceptions: ask "Where do you think that idea comes from?" before correcting\n';
  } else if (lvl === 1) {
    pedagogyBlock =
      "TEACHING APPROACH — GUIDED MODE:\n" +
      "- Explain concepts clearly but always connect to exam application\n" +
      '- After each explanation, add: "Now, can you explain this back in your own words?"\n' +
      "- Highlight common misconceptions about the topic\n" +
      '- Include a "Try this" question at the end of substantive explanations\n';
  } else {
    pedagogyBlock =
      "TEACHING APPROACH — DIRECT MODE:\n" +
      "- Provide clear, accurate explanations with examples and analogies\n" +
      "- Connect every explanation to " +
      board +
      " exam requirements\n";
  }
  var hasContent = !!(ctx.notes || ctx.fcs || ctx.qs);
  var contentBlock = hasContent
    ? "STUDENT'S REVISION CONTENT (primary knowledge source — prioritise this overgeneral knowledge):\n" +
      (ctx.notes ? "=== NOTES ===\n" + ctx.notes.slice(0, 1800) + "\n\n" : "") +
      (ctx.fcs ? "=== FLASHCARDS ===\n" + ctx.fcs.slice(0, 600) + "\n\n" : "") +
      (ctx.qs
        ? "=== PAST QUESTIONS ===\n" + ctx.qs.slice(0, 600) + "\n\n"
        : "") +
      "CONTENT BOUNDARY: Draw primarily from the content above. If asked about something not covered, say so clearly and offer to help with what IS in the notes. Use general " +
      board +
      "GCSE knowledge only to clarify or expand content already present in the notes."
    : "KNOWLEDGE SOURCE: No revision notes added for this selection yet. Draw on accurate " +
      board +
      " GCSE " +
      subjName +
      " knowledge. Note when content is not in the student'snotes.";
  return (
    "You are ReviseIQ AI, a warm, expert GCSE " +
    subjName +
    " tutor (" +
    board +
    ").\n" +
    'Current topic: "' +
    topicLabel +
    '"\n\n' +
    pedagogyBlock +
    "\n" +
    contentBlock +
    "\n\n" +
    "STYLE: Warm, encouraging, precise. Use ## headings and • bullets for clarity. " +
    "Reference " +
    board +
    " mark scheme language. Keep responses focused — avoidpadding.\n" +
    imgInstr
  );
}

export function getAccHash(acc) {
  return typeof acc === "string" ? acc : acc?.h;
}

export function getAccGki(acc) {
  return typeof acc === "string" ? null : (acc?.gki ?? null);
}

export function getAccDisplayName(acc) {
  return (acc && typeof acc === "object" && acc.displayName) || "";
}

// Heuristic primary-error classifier used by the rubric validator and the app.
// Returns one of the canonical error categories, or null when no clear issue.
export function detectErrorType(questionText, studentAnswer, markScheme, missedPoints) {
  const ans = (studentAnswer || "").trim();
  const missed = Array.isArray(missedPoints) ? missedPoints.length : 0;
  if (!ans) return "Knowledge Gap";
  const qt = (questionText || "").toLowerCase();
  const cmdWords = [
    "evaluate", "analyse", "analyze", "compare", "discuss",
    "explain", "justify", "assess", "to what extent",
  ];
  const hasCmd = cmdWords.some((w) => qt.indexOf(w) !== -1);
  if (missed >= 3) return "Knowledge Gap";
  if (hasCmd && ans.length < 120) return "Command Word Error";
  if (missed >= 1) return "Application Error";
  if (ans.length < 30) return "Communication Error";
  return null;
}

// Mark a single free-text answer against its mark scheme via the AI rubric.
// Returns { score, band, feedback, missedPoints, strengths, examTip,
//           modelAnswer, errorType, ... } (see _validateRubric).
export async function markAnswer(q, studentAnswer) {
  return aiServiceFeedbackRubric(q, studentAnswer);
}
