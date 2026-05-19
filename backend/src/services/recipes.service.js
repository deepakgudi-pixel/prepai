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

function normalizeIngredientName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesIngredientKeyword(availableIngredients, keyword) {
  const normalizedKeyword = normalizeIngredientName(keyword);

  return availableIngredients.some(
    (ingredient) =>
      ingredient.includes(normalizedKeyword) || normalizedKeyword.includes(ingredient),
  );
}

function extractJsonArray(text) {
  const sanitized = String(text || "")
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  const firstBracket = sanitized.indexOf("[");
  const lastBracket = sanitized.lastIndexOf("]");

  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    throw new Error("Failed to generate recipe suggestions. Please try again.");
  }

  const jsonStr = sanitized.slice(firstBracket, lastBracket + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    // Try to fix common JSON issues
    let fixed = jsonStr
      // Remove trailing commas before closing braces/brackets
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix unescaped quotes in strings (basic attempt)
      .replace(/([^\\])"([^"]*)":/g, '$1\\"$2":')
      // Remove any control characters
      .replace(/[\x00-\x1F\x7F]/g, '');

    try {
      return JSON.parse(fixed);
    } catch (secondError) {
      console.error("JSON parsing failed even after fixes:", secondError.message);
      console.error("Problematic JSON:", jsonStr.substring(0, 500));
      throw new Error("Failed to generate recipe suggestions. Please try again.");
    }
  }
}

function createFallbackDescription(title, ingredients) {
  const ingredientLead = ingredients.slice(0, 3).join(", ");

  return ingredientLead
    ? `${title} built around ${ingredientLead}, designed to make practical use of what is already in your pantry.`
    : `${title} designed as a flexible pantry-first meal using common kitchen staples.`;
}

function buildFallbackRecipeSuggestions(ingredientNames, diet) {
  const availableIngredients = ingredientNames
    .map(normalizeIngredientName)
    .filter(Boolean);

  const templates = [
    {
      title: "Garden Veggie Stir-Fry",
      category: "dinner",
      cuisine: "chinese",
      prepTime: 15,
      cookTime: 18,
      servings: 2,
      diet: "veg",
      required: ["garlic", "onion"],
      optional: ["carrot", "bell pepper", "broccoli", "cabbage", "soy sauce", "rice"],
    },
    {
      title: "Pantry Tomato Pasta",
      category: "dinner",
      cuisine: "italian",
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      diet: "veg",
      required: ["pasta", "tomato"],
      optional: ["garlic", "onion", "cheese", "basil", "olive oil"],
    },
    {
      title: "Masala Vegetable Skillet",
      category: "dinner",
      cuisine: "indian",
      prepTime: 15,
      cookTime: 22,
      servings: 3,
      diet: "veg",
      required: ["onion", "tomato"],
      optional: ["potato", "peas", "cauliflower", "garlic", "ginger", "chili"],
    },
    {
      title: "Hearty Lentil Soup",
      category: "lunch",
      cuisine: "other",
      prepTime: 10,
      cookTime: 30,
      servings: 3,
      diet: "veg",
      required: ["lentil"],
      optional: ["onion", "garlic", "carrot", "tomato", "spinach"],
    },
    {
      title: "Loaded Veggie Omelette",
      category: "breakfast",
      cuisine: "american",
      prepTime: 8,
      cookTime: 10,
      servings: 2,
      diet: "veg",
      required: ["egg"],
      optional: ["onion", "tomato", "cheese", "spinach", "mushroom", "bell pepper"],
    },
    {
      title: "Chicken Pepper Stir-Fry",
      category: "dinner",
      cuisine: "chinese",
      prepTime: 15,
      cookTime: 18,
      servings: 2,
      diet: "non-veg",
      required: ["chicken"],
      optional: ["garlic", "onion", "bell pepper", "soy sauce", "rice"],
    },
    {
      title: "Spiced Egg Fried Rice",
      category: "lunch",
      cuisine: "other",
      prepTime: 12,
      cookTime: 15,
      servings: 2,
      diet: "non-veg",
      required: ["rice", "egg"],
      optional: ["onion", "garlic", "carrot", "peas", "soy sauce"],
    },
    {
      title: "Tuna Pantry Rice Bowl",
      category: "lunch",
      cuisine: "japanese",
      prepTime: 10,
      cookTime: 12,
      servings: 2,
      diet: "non-veg",
      required: ["tuna", "rice"],
      optional: ["cucumber", "carrot", "soy sauce", "egg", "sesame"],
    },
    {
      title: "Chicken Tomato Skillet",
      category: "dinner",
      cuisine: "mediterranean",
      prepTime: 12,
      cookTime: 25,
      servings: 3,
      diet: "non-veg",
      required: ["chicken", "tomato"],
      optional: ["onion", "garlic", "bell pepper", "olive oil"],
    },
    {
      title: "Savory Chicken Egg Wrap",
      category: "lunch",
      cuisine: "american",
      prepTime: 12,
      cookTime: 12,
      servings: 2,
      diet: "non-veg",
      required: ["chicken", "egg"],
      optional: ["onion", "cheese", "bell pepper", "tortilla"],
    },
    {
      title: "Bean and Veggie Wraps",
      category: "lunch",
      cuisine: "mexican",
      prepTime: 12,
      cookTime: 10,
      servings: 2,
      diet: "veg",
      required: ["bean"],
      optional: ["onion", "tomato", "cheese", "tortilla", "lettuce", "corn"],
    },
  ];

  const filteredTemplates = templates.filter((template) => {
    if (diet === "veg") {
      return template.diet === "veg";
    }

    if (diet === "non-veg") {
      return template.diet === "non-veg";
    }

    return true;
  });

  const scoredSuggestions = filteredTemplates
    .map((template) => {
      const matchedRequired = template.required.filter((keyword) =>
        matchesIngredientKeyword(availableIngredients, keyword),
      );
      const matchedOptional = template.optional.filter((keyword) =>
        matchesIngredientKeyword(availableIngredients, keyword),
      );
      const matchCount = matchedRequired.length + matchedOptional.length;
      const totalSignals = template.required.length + template.optional.length;
      const missingIngredients = [...template.required, ...template.optional]
        .filter((keyword) => !matchesIngredientKeyword(availableIngredients, keyword))
        .slice(0, 4);

      const matchPercentage = Math.max(
        62,
        Math.min(
          96,
          Math.round((matchCount / Math.max(totalSignals, 1)) * 100),
        ),
      );

      return {
        title: template.title,
        description: createFallbackDescription(template.title, matchedOptional),
        matchPercentage,
        missingIngredients,
        category: template.category,
        cuisine: template.cuisine,
        prepTime: template.prepTime,
        cookTime: template.cookTime,
        servings: template.servings,
        _score: matchedRequired.length * 3 + matchedOptional.length,
      };
    })
    .sort((a, b) => b._score - a._score || b.matchPercentage - a.matchPercentage);

  return scoredSuggestions.slice(0, 5).map(({ _score, ...recipe }) => recipe);
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

function buildRecipePersistencePayload(recipeData, fallbackTitle) {
  const normalizedTitle = normalizeTitle(recipeData?.title || fallbackTitle || "Untitled Recipe");
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

  const category = validCategories.includes(recipeData?.category?.toLowerCase())
    ? recipeData.category.toLowerCase()
    : "dinner";
  const normalizedCuisine = normalizeCuisineValue(recipeData?.cuisine);
  const cuisine = validCuisines.includes(normalizedCuisine) ? normalizedCuisine : "other";

  return {
    ...recipeData,
    title: normalizedTitle,
    description: recipeData?.description || "",
    category,
    cuisine,
    ingredients: Array.isArray(recipeData?.ingredients) ? recipeData.ingredients : [],
    instructions: Array.isArray(recipeData?.instructions) ? recipeData.instructions : [],
    prepTime: Number(recipeData?.prepTime || 0),
    cookTime: Number(recipeData?.cookTime || 0),
    servings: Number(recipeData?.servings || 1),
    nutrition: recipeData?.nutrition && typeof recipeData.nutrition === "object"
      ? recipeData.nutrition
      : {},
    tips: Array.isArray(recipeData?.tips) ? recipeData.tips : [],
    substitutions: Array.isArray(recipeData?.substitutions) ? recipeData.substitutions : [],
    imageUrl: recipeData?.imageUrl || "",
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

  const imageUrl = await fetchRecipeImage(normalizedTitle);

  const payload = buildRecipePersistencePayload(
    {
      ...recipeData,
      imageUrl: imageUrl || "",
    },
    normalizedTitle,
  );

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

async function ensureRecipeRecord(recipeData, userId) {
  const recipeTitle = recipeData?.title;

  if (!recipeTitle) {
    throw new Error("Recipe title is required to save this recipe");
  }

  const existingRecipe = await findRecipeByTitle(recipeTitle);

  if (existingRecipe) {
    return existingRecipe;
  }

  const payload = buildRecipePersistencePayload(recipeData, recipeTitle);
  const imageUrl = payload.imageUrl || (await fetchRecipeImage(payload.title));

  return insertRecipe(
    {
      ...payload,
      imageUrl,
    },
    userId,
  );
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

  const ingredientNames = pantryResult.rows.map((item) => item.name);
  const ingredients = ingredientNames.join(", ");
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

  if (!env.openrouterApiKey) {
    const fallbackRecipes = buildFallbackRecipeSuggestions(ingredientNames, diet);

    return {
      success: true,
      recipes: fallbackRecipes,
      ingredientsUsed: ingredients,
      fallbackUsed: true,
      message: "AI was unavailable, so we created pantry-first suggestions for you.",
    };
  }

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
    const fallbackRecipes = buildFallbackRecipeSuggestions(ingredientNames, diet);

    return {
      success: true,
      recipes: fallbackRecipes,
      ingredientsUsed: ingredients,
      fallbackUsed: true,
      message: "AI was unavailable, so we created pantry-first suggestions for you.",
    };
  }

  let recipeSuggestions;
  try {
    recipeSuggestions = extractJsonArray(text);
  } catch (error) {
    console.error("Recipe suggestion parsing error:", error);
    const fallbackRecipes = buildFallbackRecipeSuggestions(ingredientNames, diet);

    return {
      success: true,
      recipes: fallbackRecipes,
      ingredientsUsed: ingredients,
      fallbackUsed: true,
      message: "AI returned an incomplete response, so we created pantry-first suggestions for you.",
    };
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

async function saveGeneratedRecipeForUser(userId, recipeData) {
  const recipeRow = await ensureRecipeRecord(recipeData, userId);
  const result = await saveRecipeForUser(userId, recipeRow.id);

  return {
    ...result,
    recipeId: String(recipeRow.id),
    recipe: serializeRecipe(recipeRow),
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

/**
 * Suggest recipes based on remaining macros
 */
async function suggestRecipesForMacros(userId, remainingMacros) {
  const { calories, protein, carbs, fats } = remainingMacros;

  // First, try to match from saved recipes
  const savedResult = await query(
    `
      SELECT r.*
      FROM saved_recipes sr
      INNER JOIN recipes r ON r.id = sr.recipe_id
      WHERE sr.user_id = $1
    `,
    [userId],
  );

  let matchingRecipes = [];

  if (savedResult.rows.length > 0) {
    // Filter recipes that fit within remaining macros (with 20% tolerance)
    const tolerance = 1.2;
    matchingRecipes = savedResult.rows
      .filter((recipe) => {
        const nutrition = recipe.nutrition || {};
        const recipeCalories = Number(nutrition.calories || 0);
        const recipeProtein = Number(nutrition.protein || 0);
        const recipeCarbs = Number(nutrition.carbs || 0);
        const recipeFats = Number(nutrition.fat || nutrition.fats || 0);

        // Recipe should fit within remaining macros (with tolerance)
        return (
          recipeCalories <= calories * tolerance &&
          recipeProtein <= protein * tolerance &&
          recipeCarbs <= carbs * tolerance &&
          recipeFats <= fats * tolerance &&
          recipeCalories > 0 // Must have nutrition data
        );
      })
      .map((recipe) => {
        const nutrition = recipe.nutrition || {};
        const recipeCalories = Number(nutrition.calories || 0);
        const recipeProtein = Number(nutrition.protein || 0);
        const recipeCarbs = Number(nutrition.carbs || 0);
        const recipeFats = Number(nutrition.fat || nutrition.fats || 0);

        // Calculate match score (how well it uses remaining macros)
        const calorieScore = Math.min(recipeCalories / calories, 1) * 100;
        const proteinScore = Math.min(recipeProtein / protein, 1) * 100;
        const carbScore = Math.min(recipeCarbs / carbs, 1) * 100;
        const fatScore = Math.min(recipeFats / fats, 1) * 100;

        // Protein is most important, then calories
        const matchScore = (proteinScore * 0.4 + calorieScore * 0.3 + carbScore * 0.15 + fatScore * 0.15);

        return {
          ...serializeRecipe(recipe),
          matchScore: Math.round(matchScore),
          macroFit: {
            calories: recipeCalories,
            protein: recipeProtein,
            carbs: recipeCarbs,
            fats: recipeFats,
          },
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  // If we have matching saved recipes, use AI to explain them
  if (matchingRecipes.length > 0 && env.openrouterApiKey) {
    const prompt = `
You are a nutrition coach. The user has these remaining macros for today:
- Calories: ${calories}
- Protein: ${protein}g
- Carbs: ${carbs}g
- Fats: ${fats}g

For each recipe below, write a brief 1-sentence explanation of why it's a good fit for their remaining macros.

Recipes:
${matchingRecipes.map((r, i) => `${i + 1}. ${r.title} (${r.macroFit.calories} cal, ${r.macroFit.protein}g protein, ${r.macroFit.carbs}g carbs, ${r.macroFit.fats}g fats)`).join("\n")}

Return ONLY a valid JSON array with explanations (no markdown, no commentary):
[
  "Explanation for recipe 1",
  "Explanation for recipe 2",
  ...
]
`;

    let explanations = [];
    try {
      const text = await createOpenRouterChatCompletion({
        model: env.openrouterTextModel,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: "You are a nutrition coach. Return only valid JSON with no markdown fences.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      explanations = extractJsonArray(text);
    } catch (error) {
      console.error("AI explanation generation error:", error);
      explanations = matchingRecipes.map((recipe) =>
        `This recipe provides ${recipe.macroFit.calories} calories and ${recipe.macroFit.protein}g protein, fitting well within your remaining daily targets.`
      );
    }

    const recipesWithExplanations = matchingRecipes.map((recipe, index) => ({
      ...recipe,
      aiExplanation: explanations[index] || `Great fit for your remaining macros!`,
    }));

    return {
      success: true,
      recipes: recipesWithExplanations,
      fromSaved: true,
      message: `Found ${recipesWithExplanations.length} recipes from your collection that fit your macros!`,
    };
  }

  // If no saved recipes or no matches, generate AI suggestions
  if (!env.openrouterApiKey) {
    return {
      success: false,
      recipes: [],
      message: "AI recipe generation is not available. Try saving some recipes first!",
    };
  }

  const prompt = `
You are a professional chef and nutrition expert. The user has these remaining macros for today:
- Calories: ${calories}
- Protein: ${protein}g
- Carbs: ${carbs}g
- Fats: ${fats}g

Suggest 5 recipes that fit within these remaining macros (with 20% tolerance). Each recipe should be practical and delicious.

Return ONLY a valid JSON array (no markdown, no explanations):
[
  {
    "title": "Recipe name",
    "description": "Brief 2-3 sentence description",
    "category": "breakfast|lunch|dinner|snack|dessert",
    "cuisine": "italian|chinese|mexican|indian|american|thai|japanese|mediterranean|french|korean|other",
    "prepTime": 20,
    "cookTime": 30,
    "servings": 2,
    "nutrition": {
      "calories": 400,
      "protein": 30,
      "carbs": 40,
      "fat": 15
    },
    "ingredients": [
      {"item": "ingredient name", "amount": "quantity", "category": "Protein|Vegetable|Grain|Other"}
    ],
    "instructions": [
      {"step": 1, "title": "Step title", "instruction": "Detailed instruction"}
    ],
    "aiExplanation": "Why this recipe fits the user's remaining macros"
  }
]
`;

  let text = "";
  try {
    text = await createOpenRouterChatCompletion({
      model: env.openrouterTextModel,
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: "You are a professional chef and nutrition expert. Return only valid JSON with no markdown fences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
  } catch (error) {
    console.error("OpenRouter recipe suggestion error:", error);
    return {
      success: false,
      recipes: [],
      message: toUserFacingAiError(error),
    };
  }

  let recipeSuggestions;
  try {
    recipeSuggestions = extractJsonArray(text);
  } catch (error) {
    console.error("Recipe suggestion parsing error:", error);
    return {
      success: false,
      recipes: [],
      message: "Failed to generate recipe suggestions. Please try again.",
    };
  }

  // Add match scores to AI-generated recipes
  const recipesWithScores = recipeSuggestions.map((recipe) => {
    const nutrition = recipe.nutrition || {};
    const recipeCalories = Number(nutrition.calories || 0);
    const recipeProtein = Number(nutrition.protein || 0);
    const recipeCarbs = Number(nutrition.carbs || 0);
    const recipeFats = Number(nutrition.fat || nutrition.fats || 0);

    const calorieScore = Math.min(recipeCalories / calories, 1) * 100;
    const proteinScore = Math.min(recipeProtein / protein, 1) * 100;
    const carbScore = Math.min(recipeCarbs / carbs, 1) * 100;
    const fatScore = Math.min(recipeFats / fats, 1) * 100;

    const matchScore = (proteinScore * 0.4 + calorieScore * 0.3 + carbScore * 0.15 + fatScore * 0.15);

    return {
      ...recipe,
      matchScore: Math.round(matchScore),
      macroFit: {
        calories: recipeCalories,
        protein: recipeProtein,
        carbs: recipeCarbs,
        fats: recipeFats,
      },
    };
  });

  return {
    success: true,
    recipes: recipesWithScores,
    fromSaved: false,
    message: `Generated ${recipesWithScores.length} AI recipe suggestions for your macros!`,
  };
}

module.exports = {
  generateRecipeDetails,
  listRecipeSuggestions,
  saveRecipeForUser,
  saveGeneratedRecipeForUser,
  removeRecipeForUser,
  listSavedRecipes,
  suggestRecipesForMacros,
};
