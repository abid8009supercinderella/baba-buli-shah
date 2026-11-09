import { GoogleGenAI } from "@google/genai";

export const config = { runtime: "nodejs" };

function extractText(interaction) {
  // SDK versions may expose a convenience output_text field or structured steps.
  if (typeof interaction?.output_text === "string" && interaction.output_text.trim()) {
    return interaction.output_text.trim();
  }

  const steps = Array.isArray(interaction?.steps) ? interaction.steps : [];
  return steps
    .filter(step => step?.type === "model_output")
    .flatMap(step => Array.isArray(step.content) ? step.content : [])
    .filter(part => part?.type === "text" && typeof part.text === "string")
    .map(part => part.text)
    .join("\n")
    .trim();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Send a POST request to this endpoint." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing. Add it in Vercel → Project Settings → Environment Variables, then redeploy."
    });
  }

  try {
    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "Please enter a message." });
    if (message.length > 10000) {
      return res.status(400).json({ error: "Message is too long. Please shorten it." });
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const transcript = history
      .slice(-10)
      .filter(item => item && ["user", "model"].includes(item.role) && typeof item.text === "string")
      .map(item => `${item.role === "user" ? "User" : "Assistant"}: ${item.text.slice(0, 3500)}`)
      .join("\n\n");

    const input = `${transcript ? `Previous conversation:\n${transcript}\n\n` : ""}User: ${message}`;

    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input,
      system_instruction:
        "You are Bilal Abid AI, a helpful general-purpose assistant. Give accurate, clear, friendly answers. Explain difficult topics simply. If uncertain, say so."
    });

    const answer = extractText(interaction);
    if (!answer) {
      console.error("Gemini interaction returned no text:", JSON.stringify({
        status: interaction?.status,
        steps: interaction?.steps?.map(s => s?.type)
      }));
      return res.status(502).json({
        error: "Gemini completed the request but returned no text. Check the Vercel Function Logs."
      });
    }

    return res.status(200).json({ answer, model: "gemini-3.8-flash" });
  } catch (error) {
    console.error("Gemini Interactions API error:", error);
    const status = Number(error?.status) || Number(error?.code) || 500;
    const detail = String(error?.message || "").slice(0, 350);

    if (status === 401 || status === 403) {
      return res.status(502).json({ error: "Google rejected the API key. Check GEMINI_API_KEY in Vercel." });
    }
    if (status === 429) {
      return res.status(429).json({ error: "Gemini API quota or rate limit reached. Check your Google AI Studio usage." });
    }
    if (status === 404) {
      return res.status(502).json({ error: `Gemini could not find this model/API for your key: ${detail}` });
    }
    return res.status(502).json({ error: `Gemini request failed: ${detail || "Check Vercel Function Logs."}` });
  }
}
