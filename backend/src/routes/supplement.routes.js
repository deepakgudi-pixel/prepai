const express = require("express");
const {
  addSupplement,
  getSupplements,
  updateSupplement,
  deleteSupplement,
  logSupplement,
  getSupplementLogs,
  getTodaySupplementLogs,
  getSupplementSuggestions,
} = require("../services/supplement.service");

const router = express.Router();

/**
 * GET /api/supplements
 * Get all user supplements
 */
router.get("/", async (req, res, next) => {
  try {
    const supplements = await getSupplements(req.appUser.id);
    return res.json({ success: true, supplements });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/supplements/suggestions
 * Get supplement suggestions based on fitness goal
 */
router.get("/suggestions", async (req, res, next) => {
  try {
    const suggestions = await getSupplementSuggestions(req.appUser.id);
    return res.json({ success: true, suggestions });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/supplements
 * Add new supplement
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      brand,
      servingSize,
      servingsPerContainer,
      macros,
      timing,
      notes,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Supplement name is required",
      });
    }

    const supplement = await addSupplement(req.appUser.id, {
      name,
      brand,
      servingSize,
      servingsPerContainer,
      macros,
      timing,
      notes,
    });

    return res.json({
      success: true,
      supplement,
      message: "Supplement added successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/supplements/:supplementId
 * Update supplement
 */
router.put("/:supplementId", async (req, res, next) => {
  try {
    const {
      name,
      brand,
      servingSize,
      servingsPerContainer,
      macros,
      timing,
      notes,
    } = req.body;

    const supplement = await updateSupplement(
      req.appUser.id,
      req.params.supplementId,
      {
        name,
        brand,
        servingSize,
        servingsPerContainer,
        macros,
        timing,
        notes,
      }
    );

    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: "Supplement not found",
      });
    }

    return res.json({
      success: true,
      supplement,
      message: "Supplement updated successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/supplements/:supplementId
 * Delete supplement
 */
router.delete("/:supplementId", async (req, res, next) => {
  try {
    const deleted = await deleteSupplement(req.appUser.id, req.params.supplementId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Supplement not found",
      });
    }

    return res.json({
      success: true,
      message: "Supplement deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/supplements/logs
 * Get supplement logs
 */
router.get("/logs", async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    const logs = await getSupplementLogs(req.appUser.id, startDate, endDate, parseInt(limit));
    return res.json({ success: true, logs });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/supplements/logs/today
 * Get today's supplement logs
 */
router.get("/logs/today", async (req, res, next) => {
  try {
    const result = await getTodaySupplementLogs(req.appUser.id);
    return res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/supplements/:supplementId/log
 * Log supplement intake
 */
router.post("/:supplementId/log", async (req, res, next) => {
  try {
    const { servings = 1, takenAt, notes } = req.body;

    const log = await logSupplement(req.appUser.id, {
      supplementId: req.params.supplementId,
      servings,
      takenAt,
      notes,
    });

    return res.json({
      success: true,
      log,
      message: "Supplement logged successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
