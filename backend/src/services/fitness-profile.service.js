const { query } = require("../db");

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 */
function calculateBMR(weight, height, age, gender) {
  if (gender === "male") {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

/**
 * Calculate TDEE based on activity level
 */
function calculateTDEE(bmr, activityLevel) {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    lightly_active: 1.375,
    moderate: 1.55,
    very_active: 1.725,
    athlete: 1.9,
  };

  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
}

/**
 * Calculate target macros based on goal and activity level
 */
function calculateTargetMacros(tdee, weight, goal, activityLevel = "moderate") {
  let calories;

  // Adjust calories based on goal
  switch (goal) {
    case "cutting":
      calories = Math.round(tdee * 0.8); // 20% deficit
      break;
    case "bulking":
      calories = Math.round(tdee * 1.15); // 15% surplus
      break;
    case "maintenance":
      calories = tdee;
      break;
    case "recomp":
      calories = tdee;
      break;
    default:
      calories = tdee;
  }

  // Calculate protein multiplier based on activity level and goal
  let proteinMultiplier;
  const isHighProteinGoal = goal === "cutting" || goal === "recomp";

  if (activityLevel === "sedentary") {
    proteinMultiplier = isHighProteinGoal ? 1.6 : 1.4;
  } else if (activityLevel === "light" || activityLevel === "lightly_active") {
    proteinMultiplier = isHighProteinGoal ? 1.8 : 1.6;
  } else if (activityLevel === "moderate") {
    proteinMultiplier = isHighProteinGoal ? 2.0 : 1.8;
  } else {
    // very_active or athlete
    proteinMultiplier = isHighProteinGoal ? 2.2 : 2.0;
  }

  const protein = Math.round(weight * proteinMultiplier);

  // Calculate fats (25% of calories)
  const fats = Math.round((calories * 0.25) / 9);

  // Calculate carbs (remaining calories)
  const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);

  return { calories, protein, carbs, fats };
}

/**
 * Get user fitness profile
 */
async function getFitnessProfile(userId) {
  const result = await query(
    `
      SELECT 
        fitness_goal,
        activity_level,
        current_weight,
        target_weight,
        height,
        age,
        gender,
        bmr,
        tdee,
        target_calories,
        target_protein,
        target_carbs,
        target_fats,
        dietary_preference
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  if (!result.rows[0]) {
    return null;
  }

  const profile = result.rows[0];

  return {
    fitnessGoal: profile.fitness_goal,
    activityLevel: profile.activity_level,
    currentWeight: profile.current_weight ? parseFloat(profile.current_weight) : null,
    targetWeight: profile.target_weight ? parseFloat(profile.target_weight) : null,
    height: profile.height,
    age: profile.age,
    gender: profile.gender,
    bmr: profile.bmr,
    tdee: profile.tdee,
    targetCalories: profile.target_calories,
    targetProtein: profile.target_protein,
    targetCarbs: profile.target_carbs,
    targetFats: profile.target_fats,
    dietaryPreference: profile.dietary_preference,
  };
}

/**
 * Update user fitness profile
 */
async function updateFitnessProfile(userId, profileData) {
  const {
    fitnessGoal,
    activityLevel,
    currentWeight,
    targetWeight,
    height,
    age,
    gender,
  } = profileData;

  // Calculate BMR and TDEE if we have all required data
  let bmr = null;
  let tdee = null;
  let targetMacros = null;

  if (currentWeight && height && age && gender) {
    bmr = calculateBMR(currentWeight, height, age, gender);
    tdee = calculateTDEE(bmr, activityLevel || "moderate");
    targetMacros = calculateTargetMacros(tdee, currentWeight, fitnessGoal || "maintenance", activityLevel || "moderate");
  }

  const result = await query(
    `
      UPDATE users
      SET 
        fitness_goal = COALESCE($2, fitness_goal),
        activity_level = COALESCE($3, activity_level),
        current_weight = COALESCE($4, current_weight),
        target_weight = COALESCE($5, target_weight),
        height = COALESCE($6, height),
        age = COALESCE($7, age),
        gender = COALESCE($8, gender),
        bmr = COALESCE($9, bmr),
        tdee = COALESCE($10, tdee),
        target_calories = COALESCE($11, target_calories),
        target_protein = COALESCE($12, target_protein),
        target_carbs = COALESCE($13, target_carbs),
        target_fats = COALESCE($14, target_fats),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      userId,
      fitnessGoal,
      activityLevel,
      currentWeight,
      targetWeight,
      height,
      age,
      gender,
      bmr,
      tdee,
      targetMacros?.calories,
      targetMacros?.protein,
      targetMacros?.carbs,
      targetMacros?.fats,
    ]
  );

  return result.rows[0];
}

/**
 * Calculate macros for user (helper endpoint)
 */
async function calculateMacrosForUser(userId, weight, height, age, gender, activityLevel, goal) {
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const macros = calculateTargetMacros(tdee, weight, goal, activityLevel);

  return {
    bmr,
    tdee,
    macros,
    breakdown: {
      proteinCalories: macros.protein * 4,
      carbCalories: macros.carbs * 4,
      fatCalories: macros.fats * 9,
      proteinPercentage: Math.round((macros.protein * 4 / macros.calories) * 100),
      carbPercentage: Math.round((macros.carbs * 4 / macros.calories) * 100),
      fatPercentage: Math.round((macros.fats * 9 / macros.calories) * 100),
    },
  };
}

module.exports = {
  getFitnessProfile,
  updateFitnessProfile,
  calculateMacrosForUser,
  calculateBMR,
  calculateTDEE,
  calculateTargetMacros,
};
