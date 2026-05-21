const express = require("express");
const {
  generateRecipeDetails,
  listRecipeSuggestions,
  saveRecipeForUser,
  saveGeneratedRecipeForUser,
  removeRecipeForUser,
  listSavedRecipes,
  suggestRecipesForMacros,
} = require("../services/recipes.service");
const { getRemainingMacros } = require("../services/daily-nutrition.service");
const { createRateLimiter } = require("../middleware/rate-limiter");

const router = express.Router();

const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  message: "Too many recipe generation requests. Please wait a minute and try again.",
});

router.post("/generate", aiLimiter, async (req, res, next) => {
  try {
    if (!req.body.recipeName) {
      return res.status(400).json({ success: false, message: "Recipe name is required" });
    }

    const result = await generateRecipeDetails(req.body.recipeName, req.appUser.id);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/suggestions", aiLimiter, async (req, res, next) => {
  try {
    const result = await listRecipeSuggestions(req.appUser.id, req.body.diet || "all");
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/suggest-for-macros", aiLimiter, async (req, res, next) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    // Get remaining macros for the date
    const macroData = await getRemainingMacros(req.appUser.id, date);

    // Get recipe suggestions
    const result = await suggestRecipesForMacros(req.appUser.id, macroData.remaining);

    return res.json({
      ...result,
      macroData,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/saved", async (req, res, next) => {
  try {
    const result = await listSavedRecipes(req.appUser.id);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/:recipeId/save", async (req, res, next) => {
  try {
    const result = await saveRecipeForUser(req.appUser.id, Number(req.params.recipeId));
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post("/save-generated", async (req, res, next) => {
  try {
    if (!req.body.recipe || !req.body.recipe.title) {
      return res.status(400).json({ success: false, message: "Recipe data is required" });
    }

    const result = await saveGeneratedRecipeForUser(req.appUser.id, req.body.recipe);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:recipeId/save", async (req, res, next) => {
  try {
    const result = await removeRecipeForUser(req.appUser.id, Number(req.params.recipeId));
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
