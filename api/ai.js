// Vercel serverless function - proxies chat requests to Google Gemini.
// The browser calls /api/ai (same origin); this function calls Gemini with the
// server-side GEMINI_API_KEY, so the key is never exposed to the browser.
//
// Accepts an OpenAI-style body { model, messages, max_tokens, temperature } and
// returns an OpenAI-style response { choices: [{ message: { content } }] } so
// the existing frontend keeps working unchanged.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

function dataUrlToInline(url) {
  var m = /^data:([^;]+);base64,(.*)$/.exec(url || "");
  if (!m) return null;
  return { mimeType: m[1], data: m[2] };
}

function toGeminiParts(content) {
  if (typeof content === "string") return [{ text: content }];
  if (Array.isArray(content)) {
    var parts = [];
    for (var i = 0; i < content.length; i++) {
      var p = content[i];
      if (!p) continue;
      if (p.type === "text" && p.text) parts.push({ text: p.text });
      else if (p.type === "image_url" && p.image_url && p.image_url.url) {
        var inl = dataUrlToInline(p.image_url.url);
        if (inl) parts.push({ inlineData: inl });
      }
    }
    return parts.length ? parts : [{ text: "" }];
  }
  return [{ text: String(content || "") }];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({
      error:
        "GEMINI_API_KEY not set. Add it in Vercel - Settings - Environment Variables.",
    });
  }
  try {
    var body = req.body || {};
    var model = body.model || "gemini-flash-latest";
    var messages = Array.isArray(body.messages) ? body.messages : [];

    var systemText = "";
    var contents = [];
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      if (!m) continue;
      if (m.role === "system") {
        var st =
          typeof m.content === "string"
            ? m.content
            : toGeminiParts(m.content)
                .map(function (p) { return p.text || ""; })
                .join("\n");
        systemText += (systemText ? "\n\n" : "") + st;
        continue;
      }
      var role = m.role === "assistant" ? "model" : "user";
      contents.push({ role: role, parts: toGeminiParts(m.content) });
    }
    if (!contents.length)
      contents.push({ role: "user", parts: [{ text: "Hello" }] });

    var payload = {
      contents: contents,
      generationConfig: {
        temperature:
          typeof body.temperature === "number" ? body.temperature : 0.7,
        maxOutputTokens:
          body.max_tokens && body.max_tokens > 0 ? body.max_tokens : 1500,
      },
    };
    if (systemText) payload.systemInstruction = { parts: [{ text: systemText }] };

    var url =
      GEMINI_BASE + encodeURIComponent(model) + ":generateContent?key=" + key;
    var gRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    var data = await gRes.json();

    if (!gRes.ok) {
      var em =
        (data && data.error && data.error.message) ||
        "Gemini error " + gRes.status;
      return res.status(gRes.status).json({ error: { message: em } });
    }

    var cand = data && data.candidates && data.candidates[0];
    var text = "";
    if (cand && cand.content && Array.isArray(cand.content.parts)) {
      text = cand.content.parts
        .map(function (p) { return p && p.text ? p.text : ""; })
        .join("");
    }
    if (!text) {
      var reason =
        (cand && cand.finishReason) ||
        (data && data.promptFeedback && data.promptFeedback.blockReason) ||
        "empty";
      return res
        .status(200)
        .json({ error: { message: "Empty Gemini response (" + reason + ")" } });
    }

    return res.status(200).json({
      choices: [{ message: { role: "assistant", content: text } }],
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { message: e.message || "Failed to reach Gemini" } });
  }
}
