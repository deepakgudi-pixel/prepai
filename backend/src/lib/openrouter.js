const { env } = require("../config/env");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

function extractContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        return part?.text || "";
      })
      .join("")
      .trim();
  }

  return "";
}

async function createOpenRouterChatCompletion({
  messages,
  model,
  temperature = 0.2,
  max_tokens = 1400,
}) {
  if (!env.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openrouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://prepai.app",
      "X-Title": "PrepAI",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || "OpenRouter request failed");
    error.status = response.status;
    error.statusText = response.statusText;
    throw error;
  }

  const payload = await response.json();
  const content = extractContent(payload);

  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  return content;
}

module.exports = { createOpenRouterChatCompletion };
