const express = require("express");
const {
  addBodyMeasurement,
  getBodyMeasurements,
  getLatestBodyMeasurement,
  getProgressSummary,
  updateBodyMeasurement,
  deleteBodyMeasurement,
} = require("../services/body-tracking.service");

const router = express.Router();

/**
 * GET /api/body-tracking
 * Get all body measurements
 */
router.get("/", async (req, res, next) => {
  try {
    const { limit = 30 } = req.query;
    const measurements = await getBodyMeasurements(req.appUser.id, parseInt(limit));
    return res.json({ success: true, measurements });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/body-tracking/latest
 * Get latest body measurement
 */
router.get("/latest", async (req, res, next) => {
  try {
    const measurement = await getLatestBodyMeasurement(req.appUser.id);
    return res.json({ success: true, measurement });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/body-tracking/progress
 * Get progress summary
 */
router.get("/progress", async (req, res, next) => {
  try {
    const { weeks = 4 } = req.query;
    const progress = await getProgressSummary(req.appUser.id, parseInt(weeks));
    return res.json({ success: true, progress });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/body-tracking
 * Add new body measurement
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      weightKg,
      bodyFatPercentage,
      muscleMassKg,
      measurements,
      photos,
      notes,
    } = req.body;

    if (!weightKg) {
      return res.status(400).json({
        success: false,
        message: "Weight is required",
      });
    }

    const measurement = await addBodyMeasurement(req.appUser.id, {
      weightKg,
      bodyFatPercentage,
      muscleMassKg,
      measurements,
      photos,
      notes,
    });

    return res.json({
      success: true,
      measurement,
      message: "Body measurement added successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/body-tracking/:measurementId
 * Update body measurement
 */
router.put("/:measurementId", async (req, res, next) => {
  try {
    const {
      weightKg,
      bodyFatPercentage,
      muscleMassKg,
      measurements,
      photos,
      notes,
    } = req.body;

    const measurement = await updateBodyMeasurement(
      req.appUser.id,
      req.params.measurementId,
      {
        weightKg,
        bodyFatPercentage,
        muscleMassKg,
        measurements,
        photos,
        notes,
      }
    );

    if (!measurement) {
      return res.status(404).json({
        success: false,
        message: "Measurement not found",
      });
    }

    return res.json({
      success: true,
      measurement,
      message: "Measurement updated successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/body-tracking/:measurementId
 * Delete body measurement
 */
router.delete("/:measurementId", async (req, res, next) => {
  try {
    const deleted = await deleteBodyMeasurement(req.appUser.id, req.params.measurementId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Measurement not found",
      });
    }

    return res.json({
      success: true,
      message: "Measurement deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
