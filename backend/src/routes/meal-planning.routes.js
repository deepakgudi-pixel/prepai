const express = require("express");
const {
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
} = require("../services/meal-planning.service");
const { createRateLimiter } = require("../middleware/rate-limiter");

const router = express.Router();

const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  message: "Too many meal plan generation requests. Please wait a minute and try again.",
});

/**
 * GET /api/meal-plans
 * Get all meal plans
 */
router.get("/", async (req, res, next) => {
  try {
    const { includeInactive = false } = req.query;
    const mealPlans = await getMealPlans(req.appUser.id, includeInactive === "true");
    return res.json({ success: true, mealPlans });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/meal-plans/active
 * Get active meal plan
 */
router.get("/active", async (req, res, next) => {
  try {
    const mealPlan = await getActiveMealPlan(req.appUser.id);
    return res.json({ success: true, mealPlan });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/meal-plans/:mealPlanId
 * Get meal plan by ID
 */
router.get("/:mealPlanId", async (req, res, next) => {
  try {
    const mealPlan = await getMealPlanById(req.appUser.id, req.params.mealPlanId);

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }

    return res.json({ success: true, mealPlan });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/meal-plans/:mealPlanId/days
 * Get meal plan days
 */
router.get("/:mealPlanId/days", async (req, res, next) => {
  try {
    const days = await getMealPlanDays(req.appUser.id, req.params.mealPlanId);
    return res.json({ success: true, days });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/meal-plans/:mealPlanId/days/:date
 * Get meal plan day by date
 */
router.get("/:mealPlanId/days/:date", async (req, res, next) => {
  try {
    const day = await getMealPlanDayByDate(
      req.appUser.id,
      req.params.mealPlanId,
      req.params.date
    );
    return res.json({ success: true, day });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/meal-plans
 * Create new meal plan
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      startDate,
      endDate,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
    } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Name, start date, and end date are required",
      });
    }

    const mealPlan = await createMealPlan(req.appUser.id, {
      name,
      startDate,
      endDate,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
    });

    return res.json({
      success: true,
      mealPlan,
      message: "Meal plan created successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/meal-plans/generate
 * Generate weekly meal plan
 */
router.post("/generate", aiLimiter, async (req, res, next) => {
  try {
    const { workoutDays, mealsPerDay, includeSnacks, cuisinePreferences } = req.body;

    const result = await generateWeeklyPlan(req.appUser.id, {
      workoutDays,
      mealsPerDay,
      includeSnacks,
      cuisinePreferences,
    });

    return res.json({
      success: true,
      ...result,
      message: "Weekly meal plan generated successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/meal-plans/:mealPlanId/copy
 * Copy meal plan
 */
router.post("/:mealPlanId/copy", async (req, res, next) => {
  try {
    const { newName } = req.body;
    const mealPlan = await copyMealPlan(req.appUser.id, req.params.mealPlanId, newName);

    return res.json({
      success: true,
      mealPlan,
      message: "Meal plan copied successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/meal-plans/:mealPlanId/optimize
 * Optimize meal plan
 */
router.post("/:mealPlanId/optimize", aiLimiter, async (req, res, next) => {
  try {
    const result = await optimizeMealPlan(req.appUser.id, req.params.mealPlanId);

    return res.json({
      success: true,
      ...result,
      message: "Meal plan optimization complete!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/meal-plans/:mealPlanId
 * Update meal plan
 */
router.put("/:mealPlanId", async (req, res, next) => {
  try {
    const {
      name,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      isActive,
    } = req.body;

    const mealPlan = await updateMealPlan(req.appUser.id, req.params.mealPlanId, {
      name,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      isActive,
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }

    return res.json({
      success: true,
      mealPlan,
      message: "Meal plan updated successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/meal-plans/:mealPlanId/days/:dayNumber/meals
 * Add meal to plan day
 */
router.post("/:mealPlanId/days/:dayNumber/meals", async (req, res, next) => {
  try {
    const { date, mealType, mealData } = req.body;

    if (!date || !mealType || !mealData) {
      return res.status(400).json({
        success: false,
        message: "Date, meal type, and meal data are required",
      });
    }

    const day = await addMealToPlan(
      req.appUser.id,
      req.params.mealPlanId,
      parseInt(req.params.dayNumber),
      date,
      mealType,
      mealData
    );

    return res.json({
      success: true,
      day,
      message: "Meal added to plan!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/meal-plans/:mealPlanId/days/:dayNumber/meals/:mealType
 * Remove meal from plan day
 */
router.delete("/:mealPlanId/days/:dayNumber/meals/:mealType", async (req, res, next) => {
  try {
    const day = await removeMealFromPlan(
      req.appUser.id,
      req.params.mealPlanId,
      parseInt(req.params.dayNumber),
      req.params.mealType
    );

    return res.json({
      success: true,
      day,
      message: "Meal removed from plan!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/meal-plans/:mealPlanId/days/:dayNumber/workout
 * Mark day as workout day
 */
router.put("/:mealPlanId/days/:dayNumber/workout", async (req, res, next) => {
  try {
    const { isWorkoutDay = true } = req.body;

    const day = await markDayAsWorkout(
      req.appUser.id,
      req.params.mealPlanId,
      parseInt(req.params.dayNumber),
      isWorkoutDay
    );

    if (!day) {
      return res.status(404).json({
        success: false,
        message: "Day not found",
      });
    }

    return res.json({
      success: true,
      day,
      message: `Day marked as ${isWorkoutDay ? "workout" : "rest"} day!`,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/meal-plans/:mealPlanId/grocery-list
 * Get saved grocery list for meal plan
 */
router.get("/:mealPlanId/grocery-list", async (req, res, next) => {
  try {
    const result = await getGroceryList(req.appUser.id, req.params.mealPlanId);

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/meal-plans/:mealPlanId/grocery-list
 * Generate or refresh grocery list from meal plan
 */
router.post("/:mealPlanId/grocery-list", async (req, res, next) => {
  try {
    const result = await generateGroceryList(req.appUser.id, req.params.mealPlanId, {
      force: req.body?.force === true,
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/meal-plans/:mealPlanId
 * Delete meal plan
 */
router.delete("/:mealPlanId", async (req, res, next) => {
  try {
    const deleted = await deleteMealPlan(req.appUser.id, req.params.mealPlanId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }

    return res.json({
      success: true,
      message: "Meal plan deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
