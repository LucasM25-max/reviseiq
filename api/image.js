// Vercel serverless function - generates an educational image with
// gemini-2.5-flash-image. The browser calls /api/image with { prompt };
// returns { image: "data:<mime>;base64,<data>" } or { error }.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

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
    var prompt = (body.prompt || "").toString().slice(0, 1500);
    var model = body.model || "gemini-2.5-flash-image";
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    var instruction =
      "Create a clear, accurate, labelled educational illustration suitable " +
      "for a GCSE revision app. Use a clean diagram style with a plain " +
      "background and legible labels. Subject of the illustration: " +
      prompt;

    var payload = {
      contents: [{ role: "user", parts: [{ text: instruction }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    };

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
      return res.status(gRes.status).json({ error: em });
    }

    var parts =
      (data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts) ||
      [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p && p.inlineData && p.inlineData.data) {
        var mime = p.inlineData.mimeType || "image/png";
        return res
          .status(200)
          .json({ image: "data:" + mime + ";base64," + p.inlineData.data });
      }
    }
    return res.status(200).json({ error: "No image returned" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to reach Gemini" });
  }
}
