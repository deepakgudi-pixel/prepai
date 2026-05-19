const { query } = require("../db");

function normalizeTiming(timing) {
  if (Array.isArray(timing)) {
    return timing.filter(Boolean);
  }

  if (typeof timing === "string" && timing.trim()) {
    return [timing];
  }

  return ["any"];
}

function normalizeSupplementData(supplementData, { defaults = false } = {}) {
  const macros = supplementData.macros || {};

  return {
    name: supplementData.name,
    brand: supplementData.brand ?? (defaults ? null : undefined),
    type: supplementData.type ?? (defaults ? "general" : undefined),
    servingSize: supplementData.servingSize ?? (defaults ? "1 serving" : undefined),
    servingsPerContainer: supplementData.servingsPerContainer ?? (defaults ? null : undefined),
    calories: supplementData.calories ?? macros.calories ?? (defaults ? 0 : undefined),
    protein: supplementData.protein ?? macros.protein ?? (defaults ? 0 : undefined),
    carbs: supplementData.carbs ?? macros.carbs ?? (defaults ? 0 : undefined),
    fats: supplementData.fats ?? macros.fats ?? (defaults ? 0 : undefined),
    timing:
      supplementData.timing === undefined
        ? defaults
          ? ["any"]
          : undefined
        : normalizeTiming(supplementData.timing),
    dosage: supplementData.dosage || null,
    isActive: supplementData.isActive,
  };
}

/**
 * Serialize supplement
 */
function serializeSupplement(row) {
  const timing = normalizeTiming(row.timing);

  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: row.name,
    brand: row.brand,
    type: row.type,
    servingSize: row.serving_size,
    servingsPerContainer: row.servings_per_container,
    macros: {
      calories: row.calories || 0,
      protein: row.protein || 0,
      carbs: row.carbs || 0,
      fats: row.fats || 0,
    },
    timing: timing[0] || "any",
    timingOptions: timing,
    dosage: row.dosage,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Serialize supplement log
 */
function serializeSupplementLog(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    supplementId: String(row.supplement_id),
    supplementName: row.supplement_name,
    logDate: row.log_date,
    servings: parseFloat(row.servings),
    timing: row.timing,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/**
 * Add supplement to user's inventory
 */
async function addSupplement(userId, supplementData) {
  const {
    name,
    brand,
    type,
    servingSize,
    servingsPerContainer,
    calories,
    protein,
    carbs,
    fats,
    timing,
    dosage,
  } = normalizeSupplementData(supplementData, { defaults: true });

  const result = await query(
    `
      INSERT INTO supplements (
        user_id,
        name,
        brand,
        type,
        serving_size,
        servings_per_container,
        calories,
        protein,
        carbs,
        fats,
        timing,
        dosage,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      RETURNING *
    `,
    [
      userId,
      name,
      brand,
      type,
      servingSize,
      servingsPerContainer,
      calories || 0,
      protein || 0,
      carbs || 0,
      fats || 0,
      timing || [],
      dosage,
    ]
  );

  return serializeSupplement(result.rows[0]);
}

/**
 * Get user's supplements
 */
async function getSupplements(userId, activeOnly = true) {
  const result = await query(
    `
      SELECT *
      FROM supplements
      WHERE user_id = $1 ${activeOnly ? "AND is_active = true" : ""}
      ORDER BY name ASC
    `,
    [userId]
  );

  return result.rows.map(serializeSupplement);
}

/**
 * Get supplement by ID
 */
async function getSupplementById(userId, supplementId) {
  const result = await query(
    `
      SELECT *
      FROM supplements
      WHERE user_id = $1 AND id = $2
    `,
    [userId, supplementId]
  );

  return result.rows[0] ? serializeSupplement(result.rows[0]) : null;
}

/**
 * Update supplement
 */
async function updateSupplement(userId, supplementId, updateData) {
  const {
    name,
    brand,
    type,
    servingSize,
    servingsPerContainer,
    calories,
    protein,
    carbs,
    fats,
    timing,
    dosage,
    isActive,
  } = normalizeSupplementData(updateData);

  const result = await query(
    `
      UPDATE supplements
      SET 
        name = COALESCE($3, name),
        brand = COALESCE($4, brand),
        type = COALESCE($5, type),
        serving_size = COALESCE($6, serving_size),
        servings_per_container = COALESCE($7, servings_per_container),
        calories = COALESCE($8, calories),
        protein = COALESCE($9, protein),
        carbs = COALESCE($10, carbs),
        fats = COALESCE($11, fats),
        timing = COALESCE($12, timing),
        dosage = COALESCE($13, dosage),
        is_active = COALESCE($14, is_active),
        updated_at = NOW()
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `,
    [
      userId,
      supplementId,
      name,
      brand,
      type,
      servingSize,
      servingsPerContainer,
      calories,
      protein,
      carbs,
      fats,
      timing,
      dosage,
      isActive,
    ]
  );

  return result.rows[0] ? serializeSupplement(result.rows[0]) : null;
}

/**
 * Delete supplement
 */
async function deleteSupplement(userId, supplementId) {
  const result = await query(
    `DELETE FROM supplements WHERE user_id = $1 AND id = $2`,
    [userId, supplementId]
  );

  return result.rowCount > 0;
}

/**
 * Log supplement intake
 */
async function logSupplement(userId, logDataOrSupplementId, servings, takenAt, notes) {
  const logData =
    typeof logDataOrSupplementId === "object" && logDataOrSupplementId !== null
      ? logDataOrSupplementId
      : {
          supplementId: logDataOrSupplementId,
          servings,
          takenAt,
          notes,
        };

  const {
    supplementId,
    logDate,
    servings: logServings,
    timing,
    notes: logNotes,
  } = logData;
  const resolvedLogDate =
    logDate ||
    (logData.takenAt ? new Date(logData.takenAt).toISOString().split("T")[0] : undefined);

  const result = await query(
    `
      INSERT INTO supplement_logs (
        user_id,
        supplement_id,
        log_date,
        servings,
        timing,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      userId,
      supplementId,
      resolvedLogDate || new Date().toISOString().split("T")[0],
      logServings || 1.0,
      timing,
      logNotes,
    ]
  );

  return serializeSupplementLog(result.rows[0]);
}

/**
 * Get supplement logs for a date range
 */
async function getSupplementLogs(userId, startDate, endDate) {
  const end = endDate || new Date().toISOString().split("T")[0];
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const result = await query(
    `
      SELECT 
        sl.*,
        s.name as supplement_name
      FROM supplement_logs sl
      JOIN supplements s ON s.id = sl.supplement_id
      WHERE sl.user_id = $1 
        AND sl.log_date >= $2 
        AND sl.log_date <= $3
      ORDER BY sl.log_date DESC, sl.created_at DESC
    `,
    [userId, start, end]
  );

  return result.rows.map(serializeSupplementLog);
}

/**
 * Get today's supplement logs
 */
async function getTodaySupplementLogs(userId) {
  const today = new Date().toISOString().split("T")[0];

  const result = await query(
    `
      SELECT 
        sl.*,
        s.name as supplement_name,
        s.type,
        s.serving_size,
        s.calories,
        s.protein,
        s.carbs,
        s.fats
      FROM supplement_logs sl
      JOIN supplements s ON s.id = sl.supplement_id
      WHERE sl.user_id = $1 AND sl.log_date = $2
      ORDER BY sl.created_at DESC
    `,
    [userId, today]
  );

  const logs = result.rows.map(serializeSupplementLog);

  // Calculate total macros from supplements today
  const totalMacros = result.rows.reduce(
    (acc, row) => {
      const servings = parseFloat(row.servings);
      acc.calories += (row.calories || 0) * servings;
      acc.protein += (row.protein || 0) * servings;
      acc.carbs += (row.carbs || 0) * servings;
      acc.fats += (row.fats || 0) * servings;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return {
    logs,
    totalMacros: {
      calories: Math.round(totalMacros.calories),
      protein: Math.round(totalMacros.protein),
      carbs: Math.round(totalMacros.carbs),
      fats: Math.round(totalMacros.fats),
    },
  };
}

/**
 * Delete supplement log
 */
async function deleteSupplementLog(userId, logId) {
  const result = await query(
    `DELETE FROM supplement_logs WHERE user_id = $1 AND id = $2`,
    [userId, logId]
  );

  return result.rowCount > 0;
}

/**
 * Get supplement suggestions based on user's goal
 */
function buildSupplementSuggestions(fitnessGoal) {
  const suggestions = {
    bulking: [
      {
        name: "Whey Protein",
        type: "protein",
        reason: "Supports muscle growth and recovery",
        dosage: "1-2 scoops/day",
        timing: ["post_workout", "breakfast"],
      },
      {
        name: "Creatine Monohydrate",
        type: "performance",
        reason: "Increases strength and muscle mass",
        dosage: "5g/day",
        timing: ["post_workout"],
      },
      {
        name: "Mass Gainer",
        type: "protein",
        reason: "High-calorie supplement for bulking",
        dosage: "1-2 servings/day",
        timing: ["between_meals"],
      },
    ],
    cutting: [
      {
        name: "Whey Protein",
        type: "protein",
        reason: "Preserves muscle during calorie deficit",
        dosage: "1-2 scoops/day",
        timing: ["post_workout", "breakfast"],
      },
      {
        name: "BCAAs",
        type: "amino_acids",
        reason: "Prevents muscle breakdown during fasted training",
        dosage: "5-10g/day",
        timing: ["pre_workout", "during_workout"],
      },
      {
        name: "L-Carnitine",
        type: "fat_loss",
        reason: "Supports fat metabolism",
        dosage: "2g/day",
        timing: ["pre_workout"],
      },
    ],
    maintenance: [
      {
        name: "Whey Protein",
        type: "protein",
        reason: "Convenient protein source",
        dosage: "1 scoop/day",
        timing: ["post_workout"],
      },
      {
        name: "Multivitamin",
        type: "vitamins",
        reason: "Fills nutritional gaps",
        dosage: "1 tablet/day",
        timing: ["with_breakfast"],
      },
      {
        name: "Omega-3 Fish Oil",
        type: "health",
        reason: "Supports heart and joint health",
        dosage: "2-3g/day",
        timing: ["with_meals"],
      },
    ],
    recomp: [
      {
        name: "Whey Protein",
        type: "protein",
        reason: "Supports muscle growth while losing fat",
        dosage: "1-2 scoops/day",
        timing: ["post_workout", "breakfast"],
      },
      {
        name: "Creatine Monohydrate",
        type: "performance",
        reason: "Maintains strength during recomp",
        dosage: "5g/day",
        timing: ["post_workout"],
      },
      {
        name: "Caffeine",
        type: "performance",
        reason: "Boosts energy and fat oxidation",
        dosage: "200-400mg/day",
        timing: ["pre_workout"],
      },
    ],
  };

  return suggestions[fitnessGoal] || suggestions.maintenance;
}

async function getSupplementSuggestions(userId) {
  const result = await query(
    `SELECT fitness_goal FROM users WHERE id = $1`,
    [userId]
  );
  const fitnessGoal = result.rows[0]?.fitness_goal || "maintenance";

  return buildSupplementSuggestions(fitnessGoal);
}

module.exports = {
  addSupplement,
  getSupplements,
  getSupplementById,
  updateSupplement,
  deleteSupplement,
  logSupplement,
  getSupplementLogs,
  getTodaySupplementLogs,
  deleteSupplementLog,
  getSupplementSuggestions,
};
