// Vercel serverless function — proxies requests to Groq API
// Browser calls /api/ai (same origin), this function calls Groq with the env var key
// No CORS issues, key is never exposed to the browser

export default async function handler(req, res) {
  // Allow POST only
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({
      error: "GROQ_API_KEY not set. Add it in Vercel → Settings → Environment Variables."
    });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key,
      },
      body: JSON.stringify(req.body),
    });
    const data = await groqRes.json();
    return res.status(groqRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Failed to reach Groq" });
  }
}
