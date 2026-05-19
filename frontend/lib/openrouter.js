const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

// Fast vision models in order of preference
const VISION_MODELS = [
  "openrouter/auto",
  "google/gemini-flash-1.5-8b",
  "anthropic/claude-3-5-haiku",
  "qwen/qwen-2-vl-7b-instruct:free"
];

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 45000; // 45 seconds max

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptVisionRequest({ model, prompt, base64Data, mimeType }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://prepai.app",
        "X-Title": "PrepAI",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 800, // Reduced for faster response
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
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(errorText || "OpenRouter vision request failed");
      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const content = extractContent(payload);

    if (!content) {
      throw new Error("Empty response from model");
    }

    return content;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      throw new Error("Request timed out after 45 seconds");
    }
    throw error;
  }
}

export async function createOpenRouterVisionCompletion({
  prompt,
  base64Data,
  mimeType,
}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  let lastError = null;

  // Try each model with retries
  for (const model of VISION_MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Vision] Trying ${model} (attempt ${attempt}/${MAX_RETRIES})...`);

        const content = await attemptVisionRequest({
          model,
          prompt,
          base64Data,
          mimeType,
        });

        console.log(`[Vision] Success with ${model}!`);
        return content;
      } catch (error) {
        lastError = error;
        console.log(`[Vision] ${model} attempt ${attempt} failed: ${error.message}`);

        // If not last attempt, wait before retry
        if (attempt < MAX_RETRIES) {
          await sleep(1000);
        }
      }
    }

    // Try next model
    console.log(`[Vision] ${model} failed, trying next model...`);
  }

  throw lastError || new Error("All vision models failed");
}
