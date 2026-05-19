"use server";

import { backendFetch, checkUser } from "@/lib/checkUser";
import { createOpenRouterVisionCompletion } from "@/lib/openrouter";

export async function scanPantryImage(formData) {
  try {
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
      ingredients = JSON.parse(
        text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim(),
      );
    } catch {
      throw new Error("Failed to parse ingredients. Please try again.");
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
