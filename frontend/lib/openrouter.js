const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_VISION_MODEL =
  process.env.OPENROUTER_VISION_MODEL || "openrouter/free";

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

export async function createOpenRouterVisionCompletion({
  prompt,
  base64Data,
  mimeType,
}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://prepai.app",
      "X-Title": "PrepAI",
    },
    body: JSON.stringify({
      model: OPENROUTER_VISION_MODEL,
      temperature: 0.1,
      max_tokens: 1400,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || "OpenRouter vision request failed");
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
