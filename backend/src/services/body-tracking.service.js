const { query } = require("../db");

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function averageDefined(values) {
  const numbers = values.map(toNumber).filter((value) => value !== null);
  if (numbers.length === 0) {
    return null;
  }

  return parseFloat((numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(2));
}

function toMeasurementInteger(value) {
  const number = toNumber(value);
  return number === null ? null : Math.round(number);
}

function normalizeMeasurementData(measurementData) {
  const measurements = measurementData.measurements || {};
  const photos = measurementData.photos || {};

  const arms =
    toNumber(measurementData.arms) ??
    toNumber(measurements.arms) ??
    averageDefined([measurements.leftArm, measurements.rightArm]);
  const thighs =
    toNumber(measurementData.thighs) ??
    toNumber(measurements.thighs) ??
    averageDefined([measurements.leftThigh, measurements.rightThigh]);

  return {
    measurementDate: measurementData.measurementDate,
    weight: toNumber(measurementData.weight ?? measurementData.weightKg),
    bodyFatPercentage: toNumber(measurementData.bodyFatPercentage),
    muscleMass: toNumber(measurementData.muscleMass ?? measurementData.muscleMassKg),
    chest: toMeasurementInteger(measurementData.chest ?? measurements.chest),
    waist: toMeasurementInteger(measurementData.waist ?? measurements.waist),
    hips: toMeasurementInteger(measurementData.hips ?? measurements.hips),
    arms: toMeasurementInteger(arms),
    thighs: toMeasurementInteger(thighs),
    calves: toMeasurementInteger(measurementData.calves ?? measurements.calves),
    neck: toMeasurementInteger(measurementData.neck ?? measurements.neck),
    shoulders: toMeasurementInteger(measurementData.shoulders ?? measurements.shoulders),
    photoFront: measurementData.photoFront ?? photos.front,
    photoSide: measurementData.photoSide ?? photos.side,
    photoBack: measurementData.photoBack ?? photos.back,
    notes: measurementData.notes,
  };
}

/**
 * Serialize body measurement
 */
function serializeBodyMeasurement(row) {
  const weight = row.weight ? parseFloat(row.weight) : null;
  const muscleMass = row.muscle_mass ? parseFloat(row.muscle_mass) : null;
  const bodyFatPercentage = row.body_fat_percentage ? parseFloat(row.body_fat_percentage) : null;
  const leanBodyMass = row.lean_body_mass ? parseFloat(row.lean_body_mass) : null;
  const fatMass = row.fat_mass ? parseFloat(row.fat_mass) : null;
  const bmi = row.bmi ? parseFloat(row.bmi) : null;
  const arms = row.arms ? parseFloat(row.arms) : null;
  const thighs = row.thighs ? parseFloat(row.thighs) : null;

  return {
    id: String(row.id),
    userId: String(row.user_id),
    measurementDate: row.measurement_date,
    weight,
    weightKg: weight,
    bodyFatPercentage,
    muscleMass,
    muscleMassKg: muscleMass,
    measurements: {
      chest: row.chest ? parseFloat(row.chest) : null,
      waist: row.waist ? parseFloat(row.waist) : null,
      hips: row.hips ? parseFloat(row.hips) : null,
      arms,
      leftArm: arms,
      rightArm: arms,
      thighs,
      leftThigh: thighs,
      rightThigh: thighs,
      calves: row.calves ? parseFloat(row.calves) : null,
      neck: row.neck ? parseFloat(row.neck) : null,
      shoulders: row.shoulders ? parseFloat(row.shoulders) : null,
    },
    photos: {
      front: row.photo_front,
      side: row.photo_side,
      back: row.photo_back,
    },
    notes: row.notes,
    bmi,
    calculated: {
      leanBodyMass,
      fatMass,
      bmi,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Calculate derived metrics
 */
function calculateDerivedMetrics(weight, bodyFatPercentage, height) {
  const metrics = {};

  if (weight && bodyFatPercentage) {
    metrics.fatMass = parseFloat((weight * (bodyFatPercentage / 100)).toFixed(2));
    metrics.leanBodyMass = parseFloat((weight - metrics.fatMass).toFixed(2));
  }

  if (weight && height) {
    const heightInMeters = height / 100;
    metrics.bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
  }

  return metrics;
}

/**
 * Add body measurement
 */
async function addBodyMeasurement(userId, measurementData) {
  const {
    measurementDate,
    weight,
    bodyFatPercentage,
    muscleMass,
    chest,
    waist,
    hips,
    arms,
    thighs,
    calves,
    neck,
    shoulders,
    photoFront,
    photoSide,
    photoBack,
    notes,
  } = normalizeMeasurementData(measurementData);

  // Get user height for BMI calculation
  const userResult = await query(`SELECT height FROM users WHERE id = $1`, [userId]);
  const height = userResult.rows[0]?.height;

  // Calculate derived metrics
  const derived = calculateDerivedMetrics(weight, bodyFatPercentage, height);

  const result = await query(
    `
      INSERT INTO body_measurements (
        user_id,
        measurement_date,
        weight,
        body_fat_percentage,
        muscle_mass,
        chest,
        waist,
        hips,
        arms,
        thighs,
        calves,
        neck,
        shoulders,
        photo_front,
        photo_side,
        photo_back,
        notes,
        lean_body_mass,
        fat_mass,
        bmi
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `,
    [
      userId,
      measurementDate || new Date().toISOString().split("T")[0],
      weight,
      bodyFatPercentage,
      muscleMass,
      chest,
      waist,
      hips,
      arms,
      thighs,
      calves,
      neck,
      shoulders,
      photoFront,
      photoSide,
      photoBack,
      notes,
      derived.leanBodyMass,
      derived.fatMass,
      derived.bmi,
    ]
  );

  // Update user's current weight
  if (weight) {
    await query(`UPDATE users SET current_weight = $1 WHERE id = $2`, [weight, userId]);
  }

  return serializeBodyMeasurement(result.rows[0]);
}

/**
 * Get body measurements for user
 */
async function getBodyMeasurements(userId, limit = 30) {
  const result = await query(
    `
      SELECT *
      FROM body_measurements
      WHERE user_id = $1
      ORDER BY measurement_date DESC
      LIMIT $2
    `,
    [userId, limit]
  );

  return result.rows.map(serializeBodyMeasurement);
}

/**
 * Get latest body measurement
 */
async function getLatestBodyMeasurement(userId) {
  const result = await query(
    `
      SELECT *
      FROM body_measurements
      WHERE user_id = $1
      ORDER BY measurement_date DESC
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ? serializeBodyMeasurement(result.rows[0]) : null;
}

/**
 * Get progress summary
 */
async function getProgressSummary(userId, weeks = 4) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await query(
    `
      SELECT 
        MIN(measurement_date) as start_date,
        MAX(measurement_date) as end_date,
        (SELECT weight FROM body_measurements WHERE user_id = $1 AND measurement_date >= $2 ORDER BY measurement_date ASC LIMIT 1) as start_weight,
        (SELECT weight FROM body_measurements WHERE user_id = $1 AND measurement_date >= $2 ORDER BY measurement_date DESC LIMIT 1) as end_weight,
        (SELECT body_fat_percentage FROM body_measurements WHERE user_id = $1 AND measurement_date >= $2 ORDER BY measurement_date ASC LIMIT 1) as start_body_fat,
        (SELECT body_fat_percentage FROM body_measurements WHERE user_id = $1 AND measurement_date >= $2 ORDER BY measurement_date DESC LIMIT 1) as end_body_fat,
        (SELECT muscle_mass FROM body_measurements WHERE user_id = $1 AND measurement_date >= $2 ORDER BY measurement_date ASC LIMIT 1) as start_muscle,
        (SELECT muscle_mass FROM body_measurements WHERE user_id = $1 AND measurement_date >= $2 ORDER BY measurement_date DESC LIMIT 1) as end_muscle
      FROM body_measurements
      WHERE user_id = $1 AND measurement_date >= $2
    `,
    [userId, startDate.toISOString().split("T")[0]]
  );

  const data = result.rows[0];

  if (!data.start_weight || !data.end_weight) {
    return null;
  }

  const weightChange = parseFloat((data.end_weight - data.start_weight).toFixed(2));
  const bodyFatChange = data.start_body_fat && data.end_body_fat
    ? parseFloat((data.end_body_fat - data.start_body_fat).toFixed(2))
    : null;
  const muscleChange = data.start_muscle && data.end_muscle
    ? parseFloat((data.end_muscle - data.start_muscle).toFixed(2))
    : null;

  return {
    period: `${weeks} weeks`,
    startDate: data.start_date,
    endDate: data.end_date,
    startWeight: parseFloat(data.start_weight),
    endWeight: parseFloat(data.end_weight),
    weightChange,
    bodyFatChange,
    muscleChange,
    leanMassChange: muscleChange,
    weeklyWeightChange: parseFloat((weightChange / weeks).toFixed(2)),
    weeklyAverage: parseFloat((weightChange / weeks).toFixed(2)),
  };
}

/**
 * Update body measurement
 */
async function updateBodyMeasurement(userId, measurementId, updateData) {
  const normalizedData = normalizeMeasurementData(updateData);

  const result = await query(
    `
      UPDATE body_measurements
      SET 
        weight = COALESCE($3, weight),
        body_fat_percentage = COALESCE($4, body_fat_percentage),
        muscle_mass = COALESCE($5, muscle_mass),
        chest = COALESCE($6, chest),
        waist = COALESCE($7, waist),
        hips = COALESCE($8, hips),
        arms = COALESCE($9, arms),
        thighs = COALESCE($10, thighs),
        notes = COALESCE($11, notes),
        updated_at = NOW()
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `,
    [
      userId,
      measurementId,
      normalizedData.weight,
      normalizedData.bodyFatPercentage,
      normalizedData.muscleMass,
      normalizedData.chest,
      normalizedData.waist,
      normalizedData.hips,
      normalizedData.arms,
      normalizedData.thighs,
      normalizedData.notes,
    ]
  );

  return result.rows[0] ? serializeBodyMeasurement(result.rows[0]) : null;
}

/**
 * Delete body measurement
 */
async function deleteBodyMeasurement(userId, measurementId) {
  const result = await query(
    `DELETE FROM body_measurements WHERE user_id = $1 AND id = $2`,
    [userId, measurementId]
  );

  return result.rowCount > 0;
}

module.exports = {
  addBodyMeasurement,
  getBodyMeasurements,
  getLatestBodyMeasurement,
  getProgressSummary,
  updateBodyMeasurement,
  deleteBodyMeasurement,
};
