"use server";

import { backendFetch, checkUser } from "@/lib/checkUser";
import { createOpenRouterVisionCompletion } from "@/lib/openrouter";
import { headers } from "next/headers";

const scanLimiter = new Map();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_SCANS_PER_WINDOW = 5; // max 5 scans per minute

function checkRateLimit(ip) {
  const now = Date.now();
  if (!scanLimiter.has(ip)) {
    scanLimiter.set(ip, []);
  }
  const timestamps = scanLimiter.get(ip).filter((time) => now - time < LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_SCANS_PER_WINDOW) {
    return false;
  }
  timestamps.push(now);
  scanLimiter.set(ip, timestamps);
  return true;
}

function extractJsonArray(text) {
  const sanitized = String(text || "").trim();
  const firstBracket = sanitized.indexOf("[");
  const lastBracket = sanitized.lastIndexOf("]");

  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    throw new Error("Invalid JSON structure in AI response");
  }
  return JSON.parse(sanitized.slice(firstBracket, lastBracket + 1));
}

export async function scanPantryImage(formData) {
  try {
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "127.0.0.1";

    if (!checkRateLimit(ip)) {
      throw new Error("Too many image scan requests. Please wait a minute and try again.");
    }

    const userJson = formData.get("authUser");
    const user = await checkUser(userJson ? JSON.parse(userJson) : null);

    if (!user) {
      throw new Error("User not authenticated");
    }

    const imageFile = formData.get("image");
    if (!imageFile) {
      throw new Error("No image provided");
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const prompt = `Analyze this pantry/fridge image and identify visible food ingredients.

Return ONLY valid JSON array (no markdown):
[{"name": "ingredient", "quantity": "amount", "confidence": 0.9}]

Rules:
- Food only (no containers/utensils)
- Be specific (e.g., "Cheddar Cheese")
- Realistic quantities (e.g., "3 eggs", "1 cup milk")
- Confidence 0.7-1.0 only
- Max 15 items`;

    const text = await createOpenRouterVisionCompletion({
      prompt,
      base64Data: base64Image,
      mimeType: imageFile.type,
    });

    let ingredients;
    try {
      ingredients = extractJsonArray(text);
    } catch {
      throw new Error("Failed to parse ingredients from AI response. Please try again.");
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error("No ingredients detected in the image. Please try a clearer photo.");
    }

    return {
      success: true,
      ingredients: ingredients.slice(0, 15),
      message: `Found ${Math.min(ingredients.length, 15)} ingredients!`,
    };
  } catch (error) {
    console.error("OpenRouter pantry scan error:", error);
    return {
      success: false,
      ingredients: [],
      message: error.message || "Failed to scan image",
    };
  }
}

export async function saveToPantry(formData) {
  try {
    const userJson = formData.get("authUser");
    const user = await checkUser(userJson ? JSON.parse(userJson) : null);
    const ingredientsJson = formData.get("ingredients");
    const ingredients = JSON.parse(ingredientsJson);

    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!ingredients || ingredients.length === 0) {
      throw new Error("No ingredients to save");
    }

    const response = await backendFetch("/pantry/bulk", user, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save items");
    }

    return data;
  } catch (error) {
    console.error("Error saving to pantry:", error);
    return {
      success: false,
      savedItems: [],
      message: error.message || "Failed to save items",
    };
  }
}

export async function addPantryItemManually(formData) {
  try {
    const userJson = formData.get("authUser");
    const user = await checkUser(userJson ? JSON.parse(userJson) : null);
    const name = formData.get("name");
    const quantity = formData.get("quantity");

    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!name || !quantity) {
      throw new Error("Name and quantity are required");
    }

    const response = await backendFetch("/pantry", user, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        quantity: quantity.trim(),
      }),
    });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to add item to pantry");
    }

    return data;
  } catch (error) {
    console.error("Error adding item manually:", error);
    return {
      success: false,
      message: error.message || "Failed to add item",
    };
  }
}

export async function getPantryItems(user) {
  try {
    const authUser = await checkUser(user);
    const response = await backendFetch("/pantry", authUser);

    if (!response) {
      return { success: false, items: [], message: "Please sign in to view your pantry" };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load pantry");
    }

    return data;
  } catch (error) {
    console.error("Error fetching pantry:", error);
    return { success: false, items: [], message: error.message || "Failed to load pantry" };
  }
}

export async function clearAllPantryItems(formData) {
  try {
    const userJson = formData.get("authUser");
    const user = await checkUser(userJson ? JSON.parse(userJson) : null);

    const response = await backendFetch("/pantry", user, {
      method: "DELETE",
    });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to clear pantry");
    }

    return data;
  } catch (error) {
    console.error("Error clearing pantry:", error);
    throw new Error(error.message || "Failed to clear pantry");
  }
}

export async function deletePantryItem(formData) {
  try {
    const userJson = formData.get("authUser");
    const user = await checkUser(userJson ? JSON.parse(userJson) : null);
    const itemId = formData.get("itemId");

    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!itemId) {
      throw new Error("Item ID is required");
    }

    const response = await backendFetch(`/pantry/${itemId}`, user, {
      method: "DELETE",
    });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete item");
    }

    return data;
  } catch (error) {
    console.error("Error deleting pantry item:", error);
    throw new Error(error.message || "Failed to delete item");
  }
}

export async function updatePantryItem(formData) {
  try {
    const userJson = formData.get("authUser");
    const user = await checkUser(userJson ? JSON.parse(userJson) : null);
    const itemId = formData.get("itemId");
    const name = formData.get("name");
    const quantity = formData.get("quantity");

    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!itemId || !name || !quantity) {
      throw new Error("Item ID, name, and quantity are required");
    }

    const response = await backendFetch(`/pantry/${itemId}`, user, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        quantity: quantity.trim(),
      }),
    });

    if (!response) {
      throw new Error("User not authenticated");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update item");
    }

    return data;
  } catch (error) {
    console.error("Error updating pantry item:", error);
    throw new Error(error.message || "Failed to update item");
  }
}
