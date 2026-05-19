const { query } = require("../db");

/**
 * Serialize daily nutrition log
 */
function serializeDailyLog(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    logDate: row.log_date,
    totals: {
      calories: row.total_calories || 0,
      protein: row.total_protein || 0,
      carbs: row.total_carbs || 0,
      fats: row.total_fats || 0,
    },
    meals: {
      breakfast: {
        calories: row.breakfast_calories || 0,
        protein: row.breakfast_protein || 0,
        carbs: row.breakfast_carbs || 0,
        fats: row.breakfast_fats || 0,
      },
      lunch: {
        calories: row.lunch_calories || 0,
        protein: row.lunch_protein || 0,
        carbs: row.lunch_carbs || 0,
        fats: row.lunch_fats || 0,
      },
      dinner: {
        calories: row.dinner_calories || 0,
        protein: row.dinner_protein || 0,
        carbs: row.dinner_carbs || 0,
        fats: row.dinner_fats || 0,
      },
      snacks: {
        calories: row.snacks_calories || 0,
        protein: row.snacks_protein || 0,
        carbs: row.snacks_carbs || 0,
        fats: row.snacks_fats || 0,
      },
      preWorkout: {
        calories: row.pre_workout_calories || 0,
        protein: row.pre_workout_protein || 0,
        carbs: row.pre_workout_carbs || 0,
        fats: row.pre_workout_fats || 0,
      },
      postWorkout: {
        calories: row.post_workout_calories || 0,
        protein: row.post_workout_protein || 0,
        carbs: row.post_workout_carbs || 0,
        fats: row.post_workout_fats || 0,
      },
    },
    targetsHit: {
      calories: row.hit_calorie_target || false,
      protein: row.hit_protein_target || false,
      carbs: row.hit_carb_target || false,
      fats: row.hit_fat_target || false,
    },
    isWorkoutDay: row.is_workout_day || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get or create today's nutrition log
 */
async function getTodayLog(userId) {
  const today = new Date().toISOString().split("T")[0];

  let result = await query(
    `SELECT * FROM daily_nutrition_logs WHERE user_id = $1 AND log_date = $2`,
    [userId, today]
  );

  // Create if doesn't exist
  if (result.rows.length === 0) {
    result = await query(
      `
        INSERT INTO daily_nutrition_logs (user_id, log_date)
        VALUES ($1, $2)
        RETURNING *
      `,
      [userId, today]
    );
  }

  return serializeDailyLog(result.rows[0]);
}

/**
 * Get daily log by date
 */
async function getDailyLog(userId, date) {
  const result = await query(
    `SELECT * FROM daily_nutrition_logs WHERE user_id = $1 AND log_date = $2`,
    [userId, date]
  );

  if (result.rows.length === 0) {
    // Create empty log for that date
    const createResult = await query(
      `
        INSERT INTO daily_nutrition_logs (user_id, log_date)
        VALUES ($1, $2)
        RETURNING *
      `,
      [userId, date]
    );
    return serializeDailyLog(createResult.rows[0]);
  }

  return serializeDailyLog(result.rows[0]);
}

/**
 * Update daily log with meal data
 */
async function updateDailyLog(userId, date, mealType, macros) {
  const { calories, protein, carbs, fats } = macros;

  // Get current log
  const currentLog = await getDailyLog(userId, date);

  // Calculate new totals
  const newTotals = {
    calories: currentLog.totals.calories + calories,
    protein: currentLog.totals.protein + protein,
    carbs: currentLog.totals.carbs + carbs,
    fats: currentLog.totals.fats + fats,
  };

  // Update meal-specific columns
  const mealColumns = {
    breakfast: ["breakfast_calories", "breakfast_protein", "breakfast_carbs", "breakfast_fats"],
    lunch: ["lunch_calories", "lunch_protein", "lunch_carbs", "lunch_fats"],
    dinner: ["dinner_calories", "dinner_protein", "dinner_carbs", "dinner_fats"],
    snacks: ["snacks_calories", "snacks_protein", "snacks_carbs", "snacks_fats"],
    pre_workout: ["pre_workout_calories", "pre_workout_protein", "pre_workout_carbs", "pre_workout_fats"],
    post_workout: ["post_workout_calories", "post_workout_protein", "post_workout_carbs", "post_workout_fats"],
  };

  const columns = mealColumns[mealType];
  if (!columns) {
    throw new Error(`Invalid meal type: ${mealType}`);
  }

  const result = await query(
    `
      UPDATE daily_nutrition_logs
      SET 
        total_calories = $3,
        total_protein = $4,
        total_carbs = $5,
        total_fats = $6,
        ${columns[0]} = ${columns[0]} + $7,
        ${columns[1]} = ${columns[1]} + $8,
        ${columns[2]} = ${columns[2]} + $9,
        ${columns[3]} = ${columns[3]} + $10,
        updated_at = NOW()
      WHERE user_id = $1 AND log_date = $2
      RETURNING *
    `,
    [
      userId,
      date,
      newTotals.calories,
      newTotals.protein,
      newTotals.carbs,
      newTotals.fats,
      calories,
      protein,
      carbs,
      fats,
    ]
  );

  return serializeDailyLog(result.rows[0]);
}

/**
 * Set daily log totals directly (for manual entry)
 */
async function setDailyLogTotals(userId, date, totals) {
  const { calories, protein, carbs, fats } = totals;

  const result = await query(
    `
      UPDATE daily_nutrition_logs
      SET 
        total_calories = $3,
        total_protein = $4,
        total_carbs = $5,
        total_fats = $6,
        updated_at = NOW()
      WHERE user_id = $1 AND log_date = $2
      RETURNING *
    `,
    [userId, date, calories, protein, carbs, fats]
  );

  return serializeDailyLog(result.rows[0]);
}

/**
 * Mark as workout day
 */
async function markAsWorkoutDay(userId, date, isWorkoutDay = true) {
  const result = await query(
    `
      UPDATE daily_nutrition_logs
      SET 
        is_workout_day = $3,
        updated_at = NOW()
      WHERE user_id = $1 AND log_date = $2
      RETURNING *
    `,
    [userId, date, isWorkoutDay]
  );

  return serializeDailyLog(result.rows[0]);
}

/**
 * Get weekly logs
 */
async function getWeeklyLogs(userId, startDate) {
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const end = new Date().toISOString().split("T")[0];

  const result = await query(
    `
      SELECT *
      FROM daily_nutrition_logs
      WHERE user_id = $1 
        AND log_date >= $2 
        AND log_date <= $3
      ORDER BY log_date DESC
    `,
    [userId, start, end]
  );

  return result.rows.map(serializeDailyLog);
}

/**
 * Calculate daily progress vs targets
 */
async function calculateDailyProgress(userId, date) {
  // Get user's targets
  const userResult = await query(
    `
      SELECT 
        target_calories,
        target_protein,
        target_carbs,
        target_fats
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  if (!userResult.rows[0]) {
    throw new Error("User not found");
  }

  const targets = {
    calories: userResult.rows[0].target_calories || 2000,
    protein: userResult.rows[0].target_protein || 150,
    carbs: userResult.rows[0].target_carbs || 200,
    fats: userResult.rows[0].target_fats || 65,
  };

  // Get daily log
  const log = await getDailyLog(userId, date);

  // Calculate progress
  const progress = {
    calories: {
      current: log.totals.calories,
      target: targets.calories,
      remaining: targets.calories - log.totals.calories,
      percentage: Math.round((log.totals.calories / targets.calories) * 100),
      hit: Math.abs(log.totals.calories - targets.calories) <= targets.calories * 0.05, // Within 5%
    },
    protein: {
      current: log.totals.protein,
      target: targets.protein,
      remaining: targets.protein - log.totals.protein,
      percentage: Math.round((log.totals.protein / targets.protein) * 100),
      hit: log.totals.protein >= targets.protein * 0.95, // At least 95%
    },
    carbs: {
      current: log.totals.carbs,
      target: targets.carbs,
      remaining: targets.carbs - log.totals.carbs,
      percentage: Math.round((log.totals.carbs / targets.carbs) * 100),
      hit: Math.abs(log.totals.carbs - targets.carbs) <= targets.carbs * 0.1, // Within 10%
    },
    fats: {
      current: log.totals.fats,
      target: targets.fats,
      remaining: targets.fats - log.totals.fats,
      percentage: Math.round((log.totals.fats / targets.fats) * 100),
      hit: Math.abs(log.totals.fats - targets.fats) <= targets.fats * 0.1, // Within 10%
    },
  };

  // Update targets hit in database
  await query(
    `
      UPDATE daily_nutrition_logs
      SET 
        hit_calorie_target = $3,
        hit_protein_target = $4,
        hit_carb_target = $5,
        hit_fat_target = $6,
        updated_at = NOW()
      WHERE user_id = $1 AND log_date = $2
    `,
    [userId, date, progress.calories.hit, progress.protein.hit, progress.carbs.hit, progress.fats.hit]
  );

  return {
    log,
    targets,
    progress,
    allTargetsHit: progress.calories.hit && progress.protein.hit && progress.carbs.hit && progress.fats.hit,
  };
}

/**
 * Get macro streaks
 */
async function getMacroStreaks(userId) {
  const result = await query(
    `
      SELECT 
        log_date,
        hit_calorie_target,
        hit_protein_target,
        hit_carb_target,
        hit_fat_target
      FROM daily_nutrition_logs
      WHERE user_id = $1
      ORDER BY log_date DESC
      LIMIT 90
    `,
    [userId]
  );

  const logs = result.rows;

  // Calculate current streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < logs.length; i++) {
    const allHit = logs[i].hit_calorie_target && 
                   logs[i].hit_protein_target && 
                   logs[i].hit_carb_target && 
                   logs[i].hit_fat_target;

    if (allHit) {
      tempStreak++;
      if (i === 0) currentStreak = tempStreak;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Calculate protein streak (most important)
  let proteinStreak = 0;
  let longestProteinStreak = 0;
  let tempProteinStreak = 0;

  for (let i = 0; i < logs.length; i++) {
    if (logs[i].hit_protein_target) {
      tempProteinStreak++;
      if (i === 0) proteinStreak = tempProteinStreak;
      longestProteinStreak = Math.max(longestProteinStreak, tempProteinStreak);
    } else {
      tempProteinStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak,
    proteinStreak,
    longestProteinStreak,
    daysTracked: logs.length,
  };
}

/**
 * Get weekly summary
 */
async function getWeeklySummary(userId) {
  const logs = await getWeeklyLogs(userId);

  if (logs.length === 0) {
    return {
      daysTracked: 0,
      averages: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      targetsHitCount: 0,
      workoutDays: 0,
    };
  }

  const totals = logs.reduce(
    (acc, log) => {
      acc.calories += log.totals.calories;
      acc.protein += log.totals.protein;
      acc.carbs += log.totals.carbs;
      acc.fats += log.totals.fats;
      if (log.targetsHit.calories && log.targetsHit.protein && log.targetsHit.carbs && log.targetsHit.fats) {
        acc.targetsHitCount++;
      }
      if (log.isWorkoutDay) {
        acc.workoutDays++;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0, targetsHitCount: 0, workoutDays: 0 }
  );

  return {
    daysTracked: logs.length,
    averages: {
      calories: Math.round(totals.calories / logs.length),
      protein: Math.round(totals.protein / logs.length),
      carbs: Math.round(totals.carbs / logs.length),
      fats: Math.round(totals.fats / logs.length),
    },
    targetsHitCount: totals.targetsHitCount,
    targetsHitPercentage: Math.round((totals.targetsHitCount / logs.length) * 100),
    workoutDays: totals.workoutDays,
  };
}

/**
 * Get remaining macros for a user on a specific date
 */
async function getRemainingMacros(userId, date) {
  // Get user's targets
  const userResult = await query(
    `
      SELECT 
        target_calories,
        target_protein,
        target_carbs,
        target_fats
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  if (!userResult.rows[0]) {
    throw new Error("User not found");
  }

  const targets = {
    calories: userResult.rows[0].target_calories || 2000,
    protein: userResult.rows[0].target_protein || 150,
    carbs: userResult.rows[0].target_carbs || 200,
    fats: userResult.rows[0].target_fats || 65,
  };

  // Get daily log
  const log = await getDailyLog(userId, date);

  // Calculate remaining
  const remaining = {
    calories: Math.max(0, targets.calories - log.totals.calories),
    protein: Math.max(0, targets.protein - log.totals.protein),
    carbs: Math.max(0, targets.carbs - log.totals.carbs),
    fats: Math.max(0, targets.fats - log.totals.fats),
  };

  return {
    targets,
    current: log.totals,
    remaining,
  };
}

module.exports = {
  getTodayLog,
  getDailyLog,
  updateDailyLog,
  setDailyLogTotals,
  markAsWorkoutDay,
  getWeeklyLogs,
  calculateDailyProgress,
  getMacroStreaks,
  getWeeklySummary,
  getRemainingMacros,
};
