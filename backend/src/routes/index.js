const express = require("express");
const usersRoutes = require("./users.routes");
const pantryRoutes = require("./pantry.routes");
const recipesRoutes = require("./recipes.routes");
const fitnessProfileRoutes = require("./fitness-profile.routes");
const bodyTrackingRoutes = require("./body-tracking.routes");
const supplementRoutes = require("./supplement.routes");
const dailyNutritionRoutes = require("./daily-nutrition.routes");
const mealPlanningRoutes = require("./meal-planning.routes");
const aiChatRoutes = require("./ai-chat.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

router.use("/users", usersRoutes);
router.use("/pantry", pantryRoutes);
router.use("/recipes", recipesRoutes);
router.use("/fitness-profile", fitnessProfileRoutes);
router.use("/body-tracking", bodyTrackingRoutes);
router.use("/supplements", supplementRoutes);
router.use("/daily-nutrition", dailyNutritionRoutes);
router.use("/meal-plans", mealPlanningRoutes);
router.use("/ai-chat", aiChatRoutes);

module.exports = router;
