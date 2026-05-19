const { query } = require("../db");
const { generateRecipeSuggestions } = require("./recipes.service");

function parseMeal(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return JSON.parse(value);
  }

  return value;
}

function parseJson(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return JSON.parse(value);
  }

  return value;
}

function toPositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

let groceryListColumnsReadyPromise = null;

function ensureGroceryListColumns() {
  if (!groceryListColumnsReadyPromise) {
    groceryListColumnsReadyPromise = query(`
      ALTER TABLE meal_plans
        ADD COLUMN IF NOT EXISTS grocery_list JSONB,
        ADD COLUMN IF NOT EXISTS grocery_list_generated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS grocery_list_total_meals INTEGER,
        ADD COLUMN IF NOT EXISTS grocery_list_fallback_used BOOLEAN NOT NULL DEFAULT false
    `);
  }

  return groceryListColumnsReadyPromise;
}

/**
 * Serialize meal plan
 */
function serializeMealPlan(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    targetCalories: row.target_calories,
    targetProtein: row.target_protein,
    targetCarbs: row.target_carbs,
    targetFats: row.target_fats,
    isActive: row.is_active,
    groceryListGeneratedAt: row.grocery_list_generated_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeGroceryList(row, { cached = false } = {}) {
  const groceryList = parseJson(row.grocery_list, []);
  const hasGroceryList = Array.isArray(groceryList) && groceryList.length > 0;

  return {
    success: true,
    hasGroceryList,
    saved: hasGroceryList,
    cached,
    groceryList: hasGroceryList ? groceryList : [],
    mealPlan: serializeMealPlan(row),
    totalMeals: row.grocery_list_total_meals || 0,
    generatedAt: row.grocery_list_generated_at || null,
    fallbackUsed: row.grocery_list_fallback_used || false,
    message: hasGroceryList ? "Saved grocery list loaded" : "No saved grocery list yet",
  };
}

async function clearGroceryListForPlan(userId, mealPlanId) {
  await ensureGroceryListColumns();

  await query(
    `
      UPDATE meal_plans
      SET
        grocery_list = NULL,
        grocery_list_generated_at = NULL,
        grocery_list_total_meals = NULL,
        grocery_list_fallback_used = false,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `,
    [mealPlanId, userId]
  );
}

/**
 * Serialize meal plan day
 */
function serializeMealPlanDay(row) {
  return {
    id: String(row.id),
    mealPlanId: String(row.meal_plan_id),
    dayNumber: row.day_number,
    date: row.date,
    meals: {
      breakfast: parseMeal(row.breakfast_meal),
      lunch: parseMeal(row.lunch_meal),
      dinner: parseMeal(row.dinner_meal),
      snacks: parseMeal(row.snacks_meal),
      preWorkout: parseMeal(row.pre_workout_meal),
      postWorkout: parseMeal(row.post_workout_meal),
    },
    totals: {
      calories: row.total_calories || 0,
      protein: row.total_protein || 0,
      carbs: row.total_carbs || 0,
      fats: row.total_fats || 0,
    },
    isWorkoutDay: row.is_workout_day || false,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new meal plan
 */
async function createMealPlan(userId, data) {
  const { name, startDate, endDate, targetCalories, targetProtein, targetCarbs, targetFats } = data;

  // Deactivate other active plans
  await query(
    `UPDATE meal_plans SET is_active = false WHERE user_id = $1 AND is_active = true`,
    [userId]
  );

  const result = await query(
    `
      INSERT INTO meal_plans (
        user_id, name, start_date, end_date,
        target_calories, target_protein, target_carbs, target_fats,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `,
    [userId, name, startDate, endDate, targetCalories, targetProtein, targetCarbs, targetFats]
  );

  return serializeMealPlan(result.rows[0]);
}

/**
 * Get user's meal plans
 */
async function getMealPlans(userId, includeInactive = false) {
  const whereClause = includeInactive ? "" : "AND is_active = true";

  const result = await query(
    `
      SELECT *
      FROM meal_plans
      WHERE user_id = $1 ${whereClause}
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows.map(serializeMealPlan);
}

/**
 * Get meal plan by ID
 */
async function getMealPlanById(userId, mealPlanId) {
  const result = await query(
    `SELECT * FROM meal_plans WHERE id = $1 AND user_id = $2`,
    [mealPlanId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return serializeMealPlan(result.rows[0]);
}

/**
 * Get active meal plan
 */
async function getActiveMealPlan(userId) {
  const result = await query(
    `SELECT * FROM meal_plans WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return serializeMealPlan(result.rows[0]);
}

/**
 * Update meal plan
 */
async function updateMealPlan(userId, mealPlanId, data) {
  const { name, targetCalories, targetProtein, targetCarbs, targetFats, isActive } = data;

  const result = await query(
    `
      UPDATE meal_plans
      SET 
        name = COALESCE($3, name),
        target_calories = COALESCE($4, target_calories),
        target_protein = COALESCE($5, target_protein),
        target_carbs = COALESCE($6, target_carbs),
        target_fats = COALESCE($7, target_fats),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [mealPlanId, userId, name, targetCalories, targetProtein, targetCarbs, targetFats, isActive]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return serializeMealPlan(result.rows[0]);
}

/**
 * Delete meal plan
 */
async function deleteMealPlan(userId, mealPlanId) {
  // Delete all meal plan days first
  await query(`DELETE FROM meal_plan_days WHERE meal_plan_id = $1`, [mealPlanId]);

  // Delete meal plan
  const result = await query(
    `DELETE FROM meal_plans WHERE id = $1 AND user_id = $2 RETURNING *`,
    [mealPlanId, userId]
  );

  return result.rows.length > 0;
}

/**
 * Get meal plan days
 */
async function getMealPlanDays(userId, mealPlanId) {
  // Verify ownership
  const plan = await getMealPlanById(userId, mealPlanId);
  if (!plan) {
    throw new Error("Meal plan not found");
  }

  const result = await query(
    `
      SELECT *
      FROM meal_plan_days
      WHERE meal_plan_id = $1
      ORDER BY day_number ASC
    `,
    [mealPlanId]
  );

  return result.rows.map(serializeMealPlanDay);
}

/**
 * Get meal plan day by date
 */
async function getMealPlanDayByDate(userId, mealPlanId, date) {
  // Verify ownership
  const plan = await getMealPlanById(userId, mealPlanId);
  if (!plan) {
    throw new Error("Meal plan not found");
  }

  const result = await query(
    `SELECT * FROM meal_plan_days WHERE meal_plan_id = $1 AND date = $2`,
    [mealPlanId, date]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return serializeMealPlanDay(result.rows[0]);
}

/**
 * Add or update meal to plan day
 */
async function addMealToPlan(
  userId,
  mealPlanId,
  dayNumber,
  date,
  mealType,
  mealData,
  options = {}
) {
  const { clearCachedGroceryList = true } = options;

  // Verify ownership
  const plan = await getMealPlanById(userId, mealPlanId);
  if (!plan) {
    throw new Error("Meal plan not found");
  }

  // Validate meal type
  const validMealTypes = ["breakfast", "lunch", "dinner", "snacks", "pre_workout", "post_workout"];
  if (!validMealTypes.includes(mealType)) {
    throw new Error(`Invalid meal type: ${mealType}`);
  }

  // Check if day exists
  let dayResult = await query(
    `SELECT * FROM meal_plan_days WHERE meal_plan_id = $1 AND day_number = $2`,
    [mealPlanId, dayNumber]
  );

  const mealColumn = `${mealType}_meal`;
  const mealJson = JSON.stringify(mealData);

  if (dayResult.rows.length === 0) {
    // Create new day
    dayResult = await query(
      `
        INSERT INTO meal_plan_days (meal_plan_id, day_number, date, ${mealColumn})
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [mealPlanId, dayNumber, date, mealJson]
    );
  } else {
    // Update existing day
    dayResult = await query(
      `
        UPDATE meal_plan_days
        SET ${mealColumn} = $3, date = $4, updated_at = NOW()
        WHERE meal_plan_id = $1 AND day_number = $2
        RETURNING *
      `,
      [mealPlanId, dayNumber, mealJson, date]
    );
  }

  // Recalculate totals
  await recalculateDayTotals(mealPlanId, dayNumber);

  if (clearCachedGroceryList) {
    await clearGroceryListForPlan(userId, mealPlanId);
  }

  // Get updated day
  const updatedDay = await query(
    `SELECT * FROM meal_plan_days WHERE meal_plan_id = $1 AND day_number = $2`,
    [mealPlanId, dayNumber]
  );

  return serializeMealPlanDay(updatedDay.rows[0]);
}

/**
 * Remove meal from plan day
 */
async function removeMealFromPlan(userId, mealPlanId, dayNumber, mealType) {
  // Verify ownership
  const plan = await getMealPlanById(userId, mealPlanId);
  if (!plan) {
    throw new Error("Meal plan not found");
  }

  const mealColumn = `${mealType}_meal`;

  await query(
    `
      UPDATE meal_plan_days
      SET ${mealColumn} = NULL, updated_at = NOW()
      WHERE meal_plan_id = $1 AND day_number = $2
    `,
    [mealPlanId, dayNumber]
  );

  // Recalculate totals
  await recalculateDayTotals(mealPlanId, dayNumber);

  await clearGroceryListForPlan(userId, mealPlanId);

  // Get updated day
  const updatedDay = await query(
    `SELECT * FROM meal_plan_days WHERE meal_plan_id = $1 AND day_number = $2`,
    [mealPlanId, dayNumber]
  );

  return serializeMealPlanDay(updatedDay.rows[0]);
}

/**
 * Recalculate day totals
 */
async function recalculateDayTotals(mealPlanId, dayNumber) {
  const result = await query(
    `SELECT * FROM meal_plan_days WHERE meal_plan_id = $1 AND day_number = $2`,
    [mealPlanId, dayNumber]
  );

  if (result.rows.length === 0) {
    return;
  }

  const day = result.rows[0];
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  const mealTypes = [
    "breakfast_meal",
    "lunch_meal",
    "dinner_meal",
    "snacks_meal",
    "pre_workout_meal",
    "post_workout_meal",
  ];

  mealTypes.forEach((mealType) => {
    if (day[mealType]) {
      const meal = typeof day[mealType] === 'string' ? JSON.parse(day[mealType]) : day[mealType];
      totalCalories += meal.calories || 0;
      totalProtein += meal.protein || 0;
      totalCarbs += meal.carbs || 0;
      totalFats += meal.fats || 0;
    }
  });

  await query(
    `
      UPDATE meal_plan_days
      SET 
        total_calories = $3,
        total_protein = $4,
        total_carbs = $5,
        total_fats = $6,
        updated_at = NOW()
      WHERE meal_plan_id = $1 AND day_number = $2
    `,
    [mealPlanId, dayNumber, totalCalories, totalProtein, totalCarbs, totalFats]
  );
}

/**
 * Mark day as workout day
 */
async function markDayAsWorkout(userId, mealPlanId, dayNumber, isWorkoutDay = true) {
  // Verify ownership
  const plan = await getMealPlanById(userId, mealPlanId);
  if (!plan) {
    throw new Error("Meal plan not found");
  }

  const result = await query(
    `
      UPDATE meal_plan_days
      SET is_workout_day = $3, updated_at = NOW()
      WHERE meal_plan_id = $1 AND day_number = $2
      RETURNING *
    `,
    [mealPlanId, dayNumber, isWorkoutDay]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return serializeMealPlanDay(result.rows[0]);
}

/**
 * Generate weekly meal plan using AI
 */
async function generateWeeklyPlan(userId, preferences = {}) {
  // Get user's fitness profile
  const userResult = await query(
    `
      SELECT 
        target_calories,
        target_protein,
        target_carbs,
        target_fats,
        fitness_goal,
        dietary_preference
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult.rows[0];
  const targetCalories = toPositiveNumber(user.target_calories, 2000);
  const targetProtein = toPositiveNumber(user.target_protein, 150);
  const targetCarbs = toPositiveNumber(user.target_carbs, 200);
  const targetFats = toPositiveNumber(user.target_fats, 65);
  const {
    workoutDays = [1, 3, 5], // Monday, Wednesday, Friday
    mealsPerDay = 3,
    includeSnacks = true,
    cuisinePreferences = [],
  } = preferences;

  // Create meal plan
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // 7 days

  const mealPlan = await createMealPlan(userId, {
    name: `Weekly Plan - ${startDate.toLocaleDateString()}`,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFats,
  });

  // Generate meals for each day
  for (let day = 0; day < 7; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    const dayNumber = day + 1;
    const isWorkoutDay = workoutDays.includes(dayNumber);

    // Adjust calories for workout days (10% more)
    const dayCalories = isWorkoutDay
      ? Math.round(targetCalories * 1.1)
      : targetCalories;

    const includeSnackSlot = includeSnacks || mealsPerDay >= 4;
    const snackCalories = includeSnackSlot ? Math.round(dayCalories * 0.1) : 0;
    const coreMealTypes = ["breakfast", "lunch", "dinner"];
    const remainingCalories = dayCalories - snackCalories;

    // Distribute macros across meals
    const caloriesPerMeal = Math.round(remainingCalories / coreMealTypes.length);
    const proteinPerMeal = Math.round(targetProtein / coreMealTypes.length);
    const carbsPerMeal = Math.round(targetCarbs / coreMealTypes.length);
    const fatsPerMeal = Math.round(targetFats / coreMealTypes.length);
    const planDate = dayDate.toISOString().split("T")[0];

    for (const mealType of coreMealTypes) {
      await addMealToPlan(userId, mealPlan.id, dayNumber, planDate, mealType, {
        name: mealType.charAt(0).toUpperCase() + mealType.slice(1),
        calories: caloriesPerMeal,
        protein: proteinPerMeal,
        carbs: carbsPerMeal,
        fats: fatsPerMeal,
        description: "Macro-balanced meal",
      }, { clearCachedGroceryList: false });
    }

    // Add snacks if requested
    if (includeSnackSlot) {
      await addMealToPlan(userId, mealPlan.id, dayNumber, planDate, "snacks", {
        name: "Snacks",
        calories: snackCalories,
        protein: Math.round(snackCalories * 0.3 / 4),
        carbs: Math.round(snackCalories * 0.4 / 4),
        fats: Math.round(snackCalories * 0.3 / 9),
        description: "Healthy snacks",
      }, { clearCachedGroceryList: false });
    }

    // Mark workout days
    if (isWorkoutDay) {
      await markDayAsWorkout(userId, mealPlan.id, dayNumber, true);
    }
  }

  // Get complete meal plan with days
  const days = await getMealPlanDays(userId, mealPlan.id);

  return {
    mealPlan,
    days,
  };
}

/**
 * Optimize meal plan to hit macro targets
 */
async function optimizeMealPlan(userId, mealPlanId) {
  // Get meal plan
  const plan = await getMealPlanById(userId, mealPlanId);
  if (!plan) {
    throw new Error("Meal plan not found");
  }

  // Get all days
  const days = await getMealPlanDays(userId, mealPlanId);

  const optimizationResults = [];

  for (const day of days) {
    const totals = day.totals;
    const targets = {
      calories: plan.targetCalories,
      protein: plan.targetProtein,
      carbs: plan.targetCarbs,
      fats: plan.targetFats,
    };

    // Calculate differences
    const diff = {
      calories: targets.calories - totals.calories,
      protein: targets.protein - totals.protein,
      carbs: targets.carbs - totals.carbs,
      fats: targets.fats - totals.fats,
    };

    // Determine if optimization is needed (within 5% is acceptable)
    const needsOptimization =
      Math.abs(diff.calories) > targets.calories * 0.05 ||
      Math.abs(diff.protein) > targets.protein * 0.05 ||
      Math.abs(diff.carbs) > targets.carbs * 0.05 ||
      Math.abs(diff.fats) > targets.fats * 0.05;

    optimizationResults.push({
      dayNumber: day.dayNumber,
      date: day.date,
      needsOptimization,
      currentTotals: totals,
      targets,
      differences: diff,
      suggestions: needsOptimization ? generateOptimizationSuggestions(diff) : [],
    });
  }

  return {
    mealPlan: plan,
    optimizationResults,
  };
}

/**
 * Generate optimization suggestions
 */
function generateOptimizationSuggestions(diff) {
  const suggestions = [];

  if (diff.protein < -10) {
    suggestions.push("Reduce protein sources or portion sizes");
  } else if (diff.protein > 10) {
    suggestions.push("Add protein-rich foods (chicken, fish, tofu, protein shake)");
  }

  if (diff.carbs < -20) {
    suggestions.push("Reduce carb sources (rice, pasta, bread)");
  } else if (diff.carbs > 20) {
    suggestions.push("Add complex carbs (oats, rice, sweet potato, quinoa)");
  }

  if (diff.fats < -10) {
    suggestions.push("Reduce fat sources (oils, nuts, avocado)");
  } else if (diff.fats > 10) {
    suggestions.push("Add healthy fats (avocado, nuts, olive oil, salmon)");
  }

  if (diff.calories < -100) {
    suggestions.push("Reduce overall portion sizes");
  } else if (diff.calories > 100) {
    suggestions.push("Add a snack or increase portion sizes");
  }

  return suggestions;
}

/**
 * Copy meal plan
 */
async function copyMealPlan(userId, mealPlanId, newName) {
  // Get original plan
  const originalPlan = await getMealPlanById(userId, mealPlanId);
  if (!originalPlan) {
    throw new Error("Meal plan not found");
  }

  // Create new plan
  const newStartDate = new Date();
  const newEndDate = new Date(newStartDate);
  const daysDiff = Math.ceil(
    (new Date(originalPlan.endDate) - new Date(originalPlan.startDate)) / (1000 * 60 * 60 * 24)
  );
  newEndDate.setDate(newEndDate.getDate() + daysDiff);

  const newPlan = await createMealPlan(userId, {
    name: newName || `${originalPlan.name} (Copy)`,
    startDate: newStartDate.toISOString().split("T")[0],
    endDate: newEndDate.toISOString().split("T")[0],
    targetCalories: originalPlan.targetCalories,
    targetProtein: originalPlan.targetProtein,
    targetCarbs: originalPlan.targetCarbs,
    targetFats: originalPlan.targetFats,
  });

  // Copy all days
  const originalDays = await getMealPlanDays(userId, mealPlanId);

  for (const day of originalDays) {
    const newDate = new Date(newStartDate);
    newDate.setDate(newDate.getDate() + (day.dayNumber - 1));

    // Copy each meal
    const mealTypes = ["breakfast", "lunch", "dinner", "snacks", "preWorkout", "postWorkout"];
    for (const mealType of mealTypes) {
      if (day.meals[mealType]) {
        await addMealToPlan(
          userId,
          newPlan.id,
          day.dayNumber,
          newDate.toISOString().split("T")[0],
          mealType === "preWorkout" ? "pre_workout" : mealType === "postWorkout" ? "post_workout" : mealType,
          day.meals[mealType],
          { clearCachedGroceryList: false }
        );
      }
    }

    // Copy workout day flag
    if (day.isWorkoutDay) {
      await markDayAsWorkout(userId, newPlan.id, day.dayNumber, true);
    }
  }

  return newPlan;
}

/**
 * Get saved grocery list for a meal plan
 */
async function getGroceryList(userId, mealPlanId) {
  await ensureGroceryListColumns();

  const result = await query(
    `SELECT * FROM meal_plans WHERE id = $1 AND user_id = $2`,
    [mealPlanId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error("Meal plan not found");
  }

  return serializeGroceryList(result.rows[0], { cached: true });
}

async function saveGroceryList(userId, mealPlanId, groceryList, metadata = {}) {
  await ensureGroceryListColumns();

  const result = await query(
    `
      UPDATE meal_plans
      SET
        grocery_list = $3::jsonb,
        grocery_list_generated_at = NOW(),
        grocery_list_total_meals = $4,
        grocery_list_fallback_used = $5,
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [
      mealPlanId,
      userId,
      JSON.stringify(groceryList),
      metadata.totalMeals || 0,
      metadata.fallbackUsed || false,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error("Meal plan not found");
  }

  return serializeGroceryList(result.rows[0], { cached: false });
}

/**
 * Generate grocery list from meal plan
 */
async function generateGroceryList(userId, mealPlanId, options = {}) {
  const { force = false } = options;
  const { env } = require("../config/env");
  const { createOpenRouterChatCompletion } = require("../lib/openrouter");
  const { listPantryItems } = require("./pantry.service");

  if (!force) {
    const savedList = await getGroceryList(userId, mealPlanId);
    if (savedList.hasGroceryList) {
      return savedList;
    }
  } else {
    await ensureGroceryListColumns();
  }

  // Get meal plan
  const plan = await getMealPlanById(userId, mealPlanId);
  if (!plan) {
    throw new Error("Meal plan not found");
  }

  // Get all days
  const days = await getMealPlanDays(userId, mealPlanId);

  // Extract all meals from the plan
  const allMeals = [];
  days.forEach((day) => {
    Object.entries(day.meals).forEach(([mealType, meal]) => {
      if (meal && meal.name) {
        allMeals.push({
          day: day.dayNumber,
          type: mealType,
          name: meal.name,
          description: meal.description || "",
        });
      }
    });
  });

  if (allMeals.length === 0) {
    return {
      success: false,
      message: "No meals in this plan to generate grocery list",
      groceryList: [],
    };
  }

  // Get user's pantry items
  const pantryItems = await listPantryItems(userId);
  const pantryIngredients = pantryItems.map((item) => item.name.toLowerCase());

  // Use AI to generate grocery list
  if (!env.openrouterApiKey) {
    // Fallback: basic grocery list without AI
    const fallbackGroceryList = [
      {
        category: "Protein",
        items: [
          { name: "Chicken Breast", quantity: "1 kg", inPantry: false },
          { name: "Eggs", quantity: "12 pieces", inPantry: false },
        ],
      },
      {
        category: "Vegetables",
        items: [
          { name: "Broccoli", quantity: "500g", inPantry: false },
          { name: "Spinach", quantity: "1 bunch", inPantry: false },
        ],
      },
      {
        category: "Grains",
        items: [
          { name: "Rice", quantity: "1 kg", inPantry: false },
          { name: "Oats", quantity: "500g", inPantry: false },
        ],
      },
    ];

    return {
      ...(await saveGroceryList(userId, mealPlanId, fallbackGroceryList, {
        totalMeals: allMeals.length,
        fallbackUsed: true,
      })),
      message: "Basic grocery list saved (AI unavailable)",
    };
  }

  const mealsList = allMeals
    .map((meal, i) => `${i + 1}. Day ${meal.day} - ${meal.type}: ${meal.name}`)
    .join("\n");

  const pantryList = pantryIngredients.length > 0
    ? `\n\nUser already has these ingredients in pantry:\n${pantryIngredients.join(", ")}`
    : "\n\nUser's pantry is empty.";

  const prompt = `
You are a meal planning assistant. Generate a comprehensive grocery shopping list for this weekly meal plan:

${mealsList}${pantryList}

IMPORTANT RULES:
1. List ALL ingredients needed for these meals
2. DO NOT include items already in the user's pantry
3. Group items by category (Protein, Vegetables, Fruits, Grains, Dairy, Spices, Other)
4. Provide realistic quantities for 1 week
5. Use Indian measurements where appropriate (kg, grams, pieces, bunches)

Return ONLY a valid JSON array (no markdown, no explanations):
[
  {
    "category": "Protein",
    "items": [
      { "name": "Chicken Breast", "quantity": "1 kg", "inPantry": false },
      { "name": "Eggs", "quantity": "12 pieces", "inPantry": false }
    ]
  },
  {
    "category": "Vegetables",
    "items": [
      { "name": "Broccoli", "quantity": "500g", "inPantry": false }
    ]
  }
]
`;

  let text = "";
  try {
    text = await createOpenRouterChatCompletion({
      model: env.openrouterTextModel,
      temperature: 0.3,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content:
            "You are a meal planning assistant. Return only valid JSON with no markdown fences or commentary.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
  } catch (error) {
    console.error("OpenRouter grocery list generation error:", error);
    throw new Error("Failed to generate grocery list. Please try again.");
  }

  let groceryList;
  try {
    const sanitized = text
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();
    const firstBracket = sanitized.indexOf("[");
    const lastBracket = sanitized.lastIndexOf("]");

    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("Invalid JSON response");
    }

    groceryList = JSON.parse(sanitized.slice(firstBracket, lastBracket + 1));
  } catch (error) {
    console.error("Grocery list parsing error:", error);
    throw new Error("Failed to parse grocery list. Please try again.");
  }

  return {
    ...(await saveGroceryList(userId, mealPlanId, groceryList, {
      totalMeals: allMeals.length,
      fallbackUsed: false,
    })),
    message: `Grocery list generated and saved for ${allMeals.length} meals!`,
  };
}

module.exports = {
  createMealPlan,
  getMealPlans,
  getMealPlanById,
  getActiveMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getMealPlanDays,
  getMealPlanDayByDate,
  addMealToPlan,
  removeMealFromPlan,
  markDayAsWorkout,
  generateWeeklyPlan,
  optimizeMealPlan,
  copyMealPlan,
  getGroceryList,
  generateGroceryList,
};
