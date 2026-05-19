const express = require("express");
const {
  getTodayLog,
  getDailyLog,
  updateDailyLog,
  setDailyLogTotals,
  markAsWorkoutDay,
  getWeeklyLogs,
  calculateDailyProgress,
  getMacroStreaks,
  getWeeklySummary,
} = require("../services/daily-nutrition.service");

const router = express.Router();

/**
 * GET /api/daily-nutrition/today
 * Get or create today's nutrition log
 */
router.get("/today", async (req, res, next) => {
  try {
    const log = await getTodayLog(req.appUser.id);
    return res.json({ success: true, log });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/daily-nutrition/date/:date
 * Get daily log by date
 */
router.get("/date/:date", async (req, res, next) => {
  try {
    const log = await getDailyLog(req.appUser.id, req.params.date);
    return res.json({ success: true, log });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/daily-nutrition/weekly
 * Get weekly logs
 */
router.get("/weekly", async (req, res, next) => {
  try {
    const { startDate } = req.query;
    const logs = await getWeeklyLogs(req.appUser.id, startDate);
    return res.json({ success: true, logs });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/daily-nutrition/weekly-summary
 * Get weekly summary
 */
router.get("/weekly-summary", async (req, res, next) => {
  try {
    const summary = await getWeeklySummary(req.appUser.id);
    return res.json({ success: true, summary });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/daily-nutrition/streaks
 * Get macro streaks
 */
router.get("/streaks", async (req, res, next) => {
  try {
    const streaks = await getMacroStreaks(req.appUser.id);
    return res.json({ success: true, streaks });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/daily-nutrition/progress/:date
 * Calculate daily progress vs targets
 */
router.get("/progress/:date", async (req, res, next) => {
  try {
    const progress = await calculateDailyProgress(req.appUser.id, req.params.date);
    return res.json({ success: true, ...progress });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/daily-nutrition/add-meal
 * Add meal to daily log
 */
router.post("/add-meal", async (req, res, next) => {
  try {
    const { date, mealType, macros } = req.body;

    if (!date || !mealType || !macros) {
      return res.status(400).json({
        success: false,
        message: "Date, meal type, and macros are required",
      });
    }

    const { calories, protein, carbs, fats } = macros;

    if (calories === undefined || protein === undefined || carbs === undefined || fats === undefined) {
      return res.status(400).json({
        success: false,
        message: "All macro values (calories, protein, carbs, fats) are required",
      });
    }

    const log = await updateDailyLog(req.appUser.id, date, mealType, {
      calories,
      protein,
      carbs,
      fats,
    });

    return res.json({
      success: true,
      log,
      message: "Meal added to daily log!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/daily-nutrition/totals
 * Set daily log totals directly
 */
router.put("/totals", async (req, res, next) => {
  try {
    const { date, totals } = req.body;

    if (!date || !totals) {
      return res.status(400).json({
        success: false,
        message: "Date and totals are required",
      });
    }

    const log = await setDailyLogTotals(req.appUser.id, date, totals);

    return res.json({
      success: true,
      log,
      message: "Daily totals updated!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/daily-nutrition/workout-day
 * Mark day as workout day
 */
router.put("/workout-day", async (req, res, next) => {
  try {
    const { date, isWorkoutDay = true } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    const log = await markAsWorkoutDay(req.appUser.id, date, isWorkoutDay);

    return res.json({
      success: true,
      log,
      message: `Day marked as ${isWorkoutDay ? "workout" : "rest"} day!`,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
