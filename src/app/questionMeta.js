

export function detectCardType(q) {
  const t = (q || "").toLowerCase();
  if (/calculat|how many|work out|find the|compute|show.*work/.test(t))
    return { label: "Calculate", color: "#7c3aed", icon: "🧮" };
  if (/why|explain|because|reason|suggest why/.test(t))
    return { label: "Explain", color: "#0891b2", icon: "💡" };
  if (/compare|difference|similar|contrast/.test(t))
    return { label: "Compare", color: "#d97706", icon: "⚖️" };
  if (/predict|suggest|what would|likely|effect of/.test(t))
    return { label: "Apply", color: "#16a34a", icon: "🔧" };
  if (/evaluat|assess|extent|justify|argue/.test(t))
    return { label: "Evaluate", color: "#dc2626", icon: "🧠" };
  return { label: "Recall", color: "#7c3aed", icon: "🧠" };
}

export const AO_COLORS = {
  AO1: {
    bg: "#dbeafe",
    txt: "#1e40af",
    bgD: "rgba(37,99,235,.2)",
    txtD: "#93c5fd",
  },
  AO2: {
    bg: "#dcfce7",
    txt: "#166534",
    bgD: "rgba(22,163,74,.2)",
    txtD: "#86efac",
  },
  AO3: {
    bg: "#fef3c7",
    txt: "#92400e",
    bgD: "rgba(245,158,11,.18)",
    txtD: "#fcd34d",
  },
};

export const CW_MAP = {
  state: {
    ao: "AO1",
    tip: "Give a factual answer only — no explanation needed.",
  },
  name: {
    ao: "AO1",
    tip: "Give a specific term or name — one word or phrase.",
  },
  identify: {
    ao: "AO1",
    tip: "Pick out the correct feature from what is given.",
  },
  define: {
    ao: "AO1",
    tip: "Give the precise scientific or technical meaning.",
  },

  describe: {
    ao: "AO1",
    tip: "Give details of what happens — key features, no 'why'.",
  },
  outline: { ao: "AO1", tip: "Brief summary covering the main points only." },
  explain: {
    ao: "AO2",
    tip: "Say WHY — link cause → effect using 'because', 'therefore', 'this means'.",
  },
  suggest: {
    ao: "AO2",
    tip: "Apply knowledge to an unfamiliar context. More than one answer may be accepted.",
  },
  calculate: {
    ao: "AO2",
    tip: "Formula → substitution → working → answer WITH units. Missing units loses marks.",
  },
  compare: {
    ao: "AO2",
    tip: "Similarity AND difference. Use 'whereas' to link directly — not two separate accounts.",
  },
  predict: {
    ao: "AO2",
    tip: "What will happen AND why — use your subject knowledge to justify.",
  },
  analyse: {
    ao: "AO3",
    tip: "Break into components. Explain significance of each part —beyond describing.",
  },
  evaluate: {
    ao: "AO3",
    tip: "Arguments for AND against, then a clear supported conclusion.Do NOT sit on the fence.",
  },
  justify: {
    ao: "AO3",
    tip: "Strong reasons for a decision — show why alternatives are weaker.",
  },
  assess: {
    ao: "AO3",
    tip: "Weigh evidence and reach a reasoned judgement about significance or validity.",
  },
  "to what extent": {
    ao: "AO3",
    tip: "Take a position: 'largely', 'to a limited extent', 'primarily'. Never just 'it depends'.",
  },
  discuss: {
    ao: "AO3",
    tip: "Multiple perspectives + evidence, evaluate their merit, then synthesise a conclusion.",
  },
};

export function detectCW(text) {
  const t = (text || "").toLowerCase();
  for (const [cw, data] of Object.entries(CW_MAP)) {
    if (
      t.startsWith(cw + " ") ||
      t.includes(" " + cw + " ") ||
      t.includes("\n" + cw + " ")
    )
      return { word: cw, ...data };
  }
  return null;
}

export function detectAOLabel(q) {
  if (q.ao && AO_COLORS[q.ao]) return q.ao;
  const cw = detectCW(q.text || "");
  if (cw) return cw.ao;
  if (q.type === "extended") return "AO3";
  if (q.type === "short") return "AO2";
  return "AO1";
}

export function autoHints(q) {
  if (q.hints && Array.isArray(q.hints) && q.hints.length >= 3) return q.hints;
  const cw = detectCW(q.text || "");

  const h1 = cw
    ? `Strategy: ${cw.tip}`
    : "Think carefully: what command word is used and what type of answer does it require?";
  const msLines = (q.markScheme || "")
    .split("\n")
    .filter((l) => l.trim() && !l.match(/^Level|^Award|^Do not/i));
  const h2 =
    msLines.length > 0
      ? `Subject clue: think about — ${msLines[0]
          .replace(/[•()\[\]0-9.]+/g, "")
          .trim()
          .slice(0, 90)}`
      : "Review your notes on this topic before attempting.";
  const h3 =
    msLines.length > 0
      ? `First mark: ${msLines[0].replace(/[•()\[\]0-9.]+/g, "").trim()}`
      : q.markScheme
        ? `Mark scheme starts: ${q.markScheme.slice(0, 100)}…`
        : "Check key definitions in your notes.";
  return [h1, h2, h3];
}
