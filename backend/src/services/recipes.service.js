const { query } = require("../db");
const { env } = require("../config/env");
const { createOpenRouterChatCompletion } = require("../lib/openrouter");

function toUserFacingAiError(error) {
  const message = error?.message || "";

  if (message.includes("429") || message.toLowerCase().includes("quota")) {
    return "AI recipe generation is temporarily unavailable. Please try again in a little while.";
  }

  if (message.includes("503") || message.toLowerCase().includes("high demand")) {
    return "AI recipe generation is temporarily unavailable. Please try again in a little while.";
  }

  return "We couldn't generate recipes right now. Please try again shortly.";
}

function normalizeTitle(title) {
  return title
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizedLookupTitle(title) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeCuisineValue(cuisine) {
  const value = cuisine?.toLowerCase()?.trim();

  if (!value) return "other";
  if (value === "middle-eastern" || value === "middle eastern") {
    return "middle - eastern";
  }

  return value;
}

async function fetchRecipeImage(recipeName) {
  try {
    if (!env.unsplashAccessKey) {
      return "";
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        recipeName,
      )}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${env.unsplashAccessKey}`,
        },
      },
    );

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    return data.results?.[0]?.urls?.regular || "";
  } catch {
    return "";
  }
}

function serializeRecipe(row) {
  return {
    id: String(row.id),
    documentId: String(row.id),
    title: row.title,
    description: row.description,
    cuisine: row.cuisine,
    category: row.category,
    ingredients: row.ingredients,
    instructions: row.instructions,
    imageUrl: row.image_url,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    nutrition: row.nutrition,
    tips: row.tips,
    substitutions: row.substitutions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findRecipeByTitle(title) {
  const result = await query(
    `
      SELECT *
      FROM recipes
      WHERE normalized_title = $1
      LIMIT 1
    `,
    [normalizedLookupTitle(title)],
  );

  return result.rows[0] || null;
}

async function isRecipeSaved(userId, recipeId) {
  const result = await query(
    `
      SELECT 1
      FROM saved_recipes
      WHERE user_id = $1 AND recipe_id = $2
      LIMIT 1
    `,
    [userId, recipeId],
  );

  return result.rowCount > 0;
}

async function insertRecipe(recipeData, userId) {
  const result = await query(
    `
      INSERT INTO recipes (
        normalized_title,
        title,
        description,
        cuisine,
        category,
        ingredients,
        instructions,
        image_url,
        prep_time,
        cook_time,
        servings,
        nutrition,
        tips,
        substitutions,
        created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14::jsonb, $15)
      RETURNING *
    `,
    [
      normalizedLookupTitle(recipeData.title),
      recipeData.title,
      recipeData.description,
      recipeData.cuisine,
      recipeData.category,
      JSON.stringify(recipeData.ingredients || []),
      JSON.stringify(recipeData.instructions || []),
      recipeData.imageUrl || "",
      Number(recipeData.prepTime || 0),
      Number(recipeData.cookTime || 0),
      Number(recipeData.servings || 1),
      JSON.stringify(recipeData.nutrition || {}),
      JSON.stringify(recipeData.tips || []),
      JSON.stringify(recipeData.substitutions || []),
      userId,
    ],
  );

  return result.rows[0];
}

async function generateRecipeDetails(recipeName, userId) {
  const existingRecipe = await findRecipeByTitle(recipeName);

  if (existingRecipe) {
    return {
      success: true,
      recipe: serializeRecipe(existingRecipe),
      recipeId: String(existingRecipe.id),
      isSaved: await isRecipeSaved(userId, existingRecipe.id),
      fromDatabase: true,
      message: "Recipe loaded from database",
    };
  }

  if (!env.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const normalizedTitle = normalizeTitle(recipeName);
  const prompt = `
You are a professional chef and recipe expert. Generate a detailed recipe for: "${normalizedTitle}"

CRITICAL: The "title" field MUST be EXACTLY: "${normalizedTitle}"

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
  "title": "${normalizedTitle}",
  "description": "Brief 2-3 sentence description of the dish",
  "category": "Must be ONE of these EXACT values: breakfast, lunch, dinner, snack, dessert",
  "cuisine": "Must be ONE of these EXACT values: italian, chinese, mexican, indian, american, thai, japanese, mediterranean, french, korean, vietnamese, spanish, greek, turkish, moroccan, brazilian, caribbean, middle-eastern, british, german, portuguese, other",
  "prepTime": "Time in minutes (number only)",
  "cookTime": "Time in minutes (number only)",
  "servings": "Number of servings (number only)",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity with unit",
      "category": "Protein|Vegetable|Spice|Dairy|Grain|Other"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "title": "Brief step title",
      "instruction": "Detailed step instruction",
      "tip": "Optional cooking tip for this step"
    }
  ],
  "nutrition": {
    "calories": "calories per serving",
    "protein": "grams",
    "carbs": "grams",
    "fat": "grams"
  },
  "tips": ["General cooking tip 1", "General cooking tip 2", "General cooking tip 3"],
  "substitutions": [
    {
      "original": "ingredient name",
      "alternatives": ["substitute 1", "substitute 2"]
    }
  ]
}
`;

  let text = "";
  try {
    text = await createOpenRouterChatCompletion({
      model: env.openrouterTextModel,
      temperature: 0.2,
      max_tokens: 1600,
      messages: [
        {
          role: "system",
          content:
            "You are a professional chef and recipe expert. Return only valid JSON with no markdown fences or commentary.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
  } catch (error) {
    console.error("OpenRouter recipe generation error:", error);
    throw new Error(toUserFacingAiError(error));
  }

  let recipeData;
  try {
    recipeData = JSON.parse(
      text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim(),
    );
  } catch {
    throw new Error("Failed to generate recipe. Please try again.");
  }

  const validCategories = ["breakfast", "lunch", "dinner", "snack", "dessert"];
  const validCuisines = [
    "italian",
    "chinese",
    "mexican",
    "indian",
    "american",
    "thai",
    "japanese",
    "mediterranean",
    "french",
    "korean",
    "vietnamese",
    "spanish",
    "greek",
    "turkish",
    "moroccan",
    "brazilian",
    "caribbean",
    "middle - eastern",
    "british",
    "german",
    "portuguese",
    "other",
  ];

  const category = validCategories.includes(recipeData.category?.toLowerCase())
    ? recipeData.category.toLowerCase()
    : "dinner";
  const normalizedCuisine = normalizeCuisineValue(recipeData.cuisine);
  const cuisine = validCuisines.includes(normalizedCuisine) ? normalizedCuisine : "other";
  const imageUrl = await fetchRecipeImage(normalizedTitle);

  const payload = {
    ...recipeData,
    title: normalizedTitle,
    category,
    cuisine,
    prepTime: Number(recipeData.prepTime || 0),
    cookTime: Number(recipeData.cookTime || 0),
    servings: Number(recipeData.servings || 1),
    imageUrl: imageUrl || "",
  };

  let createdRecipe = null;

  try {
    createdRecipe = await insertRecipe(payload, userId);
  } catch (error) {
    console.error("Failed to persist generated recipe:", error.message);
  }

  return {
    success: true,
    recipe: {
      ...payload,
      ingredients: payload.ingredients || [],
      instructions: payload.instructions || [],
      nutrition: payload.nutrition || {},
      tips: payload.tips || [],
      substitutions: payload.substitutions || [],
    },
    recipeId: createdRecipe?.id ? String(createdRecipe.id) : null,
    isSaved: false,
    fromDatabase: false,
    persisted: Boolean(createdRecipe?.id),
    message: createdRecipe?.id
      ? "Recipe generated and saved successfully!"
      : "Recipe generated successfully, but could not be saved to the database.",
  };
}

async function listRecipeSuggestions(userId, diet) {
  const pantryResult = await query(
    `
      SELECT name
      FROM pantry_items
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  if (!pantryResult.rowCount) {
    return {
      success: false,
      recipes: [],
      message: "Your pantry is empty. Add ingredients first!",
    };
  }

  if (!env.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const ingredients = pantryResult.rows.map((item) => item.name).join(", ");
  const dietRestriction =
    diet === "veg"
      ? "Strictly Vegetarian (no meat, no fish, no poultry)."
      : diet === "non-veg"
        ? "Non-Vegetarian (must include meat, poultry, or seafood)."
        : "Any (can be vegetarian or non-vegetarian).";

  const prompt = `
You are a professional chef. Given these available ingredients: ${ingredients}
DIETARY RESTRICTION: ${dietRestriction}

Suggest 5 recipes that can be made primarily with these ingredients and strictly follow the dietary restriction.

Return ONLY a valid JSON array (no markdown, no explanations):
[
  {
    "title": "Recipe name",
    "description": "Brief 1-2 sentence description",
    "matchPercentage": 85,
    "missingIngredients": ["ingredient1", "ingredient2"],
    "category": "breakfast|lunch|dinner|snack|dessert",
    "cuisine": "italian|chinese|mexican|etc",
    "prepTime": 20,
    "cookTime": 30,
    "servings": 4
  }
]
`;

  let text = "";
  try {
    text = await createOpenRouterChatCompletion({
      model: env.openrouterTextModel,
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are a professional chef. Return only valid JSON with no markdown fences or commentary.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
  } catch (error) {
    console.error("OpenRouter recipe suggestion error:", error);
    throw new Error(toUserFacingAiError(error));
  }

  let recipeSuggestions;
  try {
    recipeSuggestions = JSON.parse(
      text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim(),
    );
  } catch {
    throw new Error("Failed to generate recipe suggestions. Please try again.");
  }

  return {
    success: true,
    recipes: recipeSuggestions,
    ingredientsUsed: ingredients,
    message: `Found ${recipeSuggestions.length} recipes you can make!`,
  };
}

async function saveRecipeForUser(userId, recipeId) {
  const existing = await query(
    `
      SELECT 1
      FROM saved_recipes
      WHERE user_id = $1 AND recipe_id = $2
      LIMIT 1
    `,
    [userId, recipeId],
  );

  if (existing.rowCount) {
    return {
      success: true,
      alreadySaved: true,
      message: "Recipe is already in your collection",
    };
  }

  const result = await query(
    `
      INSERT INTO saved_recipes (user_id, recipe_id)
      VALUES ($1, $2)
      RETURNING *
    `,
    [userId, recipeId],
  );

  return {
    success: true,
    alreadySaved: false,
    savedRecipe: result.rows[0],
    message: "Recipe saved to your collection!",
  };
}

async function removeRecipeForUser(userId, recipeId) {
  await query(
    `
      DELETE FROM saved_recipes
      WHERE user_id = $1 AND recipe_id = $2
    `,
    [userId, recipeId],
  );

  return {
    success: true,
    message: "Recipe removed from your collection",
  };
}

async function listSavedRecipes(userId) {
  const result = await query(
    `
      SELECT r.*
      FROM saved_recipes sr
      INNER JOIN recipes r ON r.id = sr.recipe_id
      WHERE sr.user_id = $1
      ORDER BY sr.saved_at DESC
    `,
    [userId],
  );

  const recipes = result.rows.map(serializeRecipe);

  return {
    success: true,
    recipes,
    count: recipes.length,
  };
}

module.exports = {
  generateRecipeDetails,
  listRecipeSuggestions,
  saveRecipeForUser,
  removeRecipeForUser,
  listSavedRecipes,
};
