const { env } = require("../config/env");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 30000;

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

function isRetryable(status) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

async function attemptWithModel({
  messages,
  model,
  temperature,
  max_tokens,
}) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(errorText || "OpenRouter request failed");
        error.status = response.status;
        error.statusText = response.statusText;
        lastError = error;

        if (isRetryable(response.status) && attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(
            `[OpenRouter] Attempt ${attempt}/${MAX_RETRIES} failed with ${response.status}. Retrying in ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }

        throw error;
      }

      const payload = await response.json();
      const content = extractContent(payload);

      if (!content) {
        lastError = new Error("OpenRouter returned an empty response");

        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(
            `[OpenRouter] Attempt ${attempt}/${MAX_RETRIES} returned empty. Retrying in ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }

        throw lastError;
      }

      if (attempt > 1) {
        console.log(`[OpenRouter] Succeeded on attempt ${attempt}/${MAX_RETRIES}`);
      }

      return content;
    } catch (error) {
      lastError = error;

      if (error.name === "AbortError") {
        lastError = new Error("OpenRouter request timed out after 30s");
        lastError.status = 504;
      }

      if (attempt < MAX_RETRIES && (error.name === "AbortError" || isRetryable(error.status))) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(
          `[OpenRouter] Attempt ${attempt}/${MAX_RETRIES} error: ${lastError.message}. Retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

const FALLBACK_MODELS = [
  "google/gemma-3-27b-it:free",
  "mistralai/pixtral-12b:free",
  "qwen/qwen-2-7b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "openrouter/free" // Final catch-all
];

async function createOpenRouterChatCompletion({
  messages,
  model,
  temperature = 0.2,
  max_tokens = 1400,
}) {
  if (!env.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  // Build list of models to try: primary first, then all fallbacks
  const modelsToTry = [model];
  for (const fm of FALLBACK_MODELS) {
    if (fm !== model && !modelsToTry.includes(fm)) {
      modelsToTry.push(fm);
    }
  }

  let lastError = null;

  for (const currentModel of modelsToTry) {
    try {
      const result = await attemptWithModel({
        messages,
        model: currentModel,
        temperature,
        max_tokens,
      });
      return result;
    } catch (error) {
      lastError = error;
      console.log(
        `[OpenRouter] Model "${currentModel}" failed: ${error.message}. ${
          currentModel !== modelsToTry[modelsToTry.length - 1]
            ? "Trying fallback model..."
            : "No more fallbacks."
        }`
      );
    }
  }

  throw lastError || new Error("All models and retry attempts failed");
}

module.exports = { createOpenRouterChatCompletion };
