const express = require("express");
const {
  getFitnessProfile,
  updateFitnessProfile,
  calculateMacrosForUser,
} = require("../services/fitness-profile.service");

const router = express.Router();

/**
 * GET /api/fitness-profile
 * Get user's fitness profile
 */
router.get("/", async (req, res, next) => {
  try {
    const profile = await getFitnessProfile(req.appUser.id);
    return res.json({ success: true, profile });
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/fitness-profile
 * Update user's fitness profile
 */
router.put("/", async (req, res, next) => {
  try {
    const {
      age,
      gender,
      height,
      currentWeight,
      targetWeight,
      activityLevel,
      fitnessGoal,
      dietaryRestrictions,
      allergies,
    } = req.body;

    const updatedUser = await updateFitnessProfile(req.appUser.id, {
      age,
      gender,
      height,
      currentWeight,
      targetWeight,
      activityLevel,
      fitnessGoal,
      dietaryRestrictions,
      allergies,
    });

    // Format the response to match frontend expectations
    const profile = {
      age: updatedUser.age,
      gender: updatedUser.gender,
      height: updatedUser.height,
      currentWeight: updatedUser.current_weight ? parseFloat(updatedUser.current_weight) : null,
      targetWeight: updatedUser.target_weight ? parseFloat(updatedUser.target_weight) : null,
      activityLevel: updatedUser.activity_level,
      fitnessGoal: updatedUser.fitness_goal,
      bmr: updatedUser.bmr,
      tdee: updatedUser.tdee,
      targetCalories: updatedUser.target_calories,
      targetProtein: updatedUser.target_protein,
      targetCarbs: updatedUser.target_carbs,
      targetFats: updatedUser.target_fats,
      dietaryPreference: updatedUser.dietary_preference,
    };

    return res.json({
      success: true,
      profile,
      message: "Fitness profile updated successfully!",
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/fitness-profile/calculate-macros
 * Calculate macros for user
 */
router.post("/calculate-macros", async (req, res, next) => {
  try {
    const {
      age,
      gender,
      heightCm,
      weightKg,
      activityLevel,
      fitnessGoal,
    } = req.body;

    if (!age || !gender || !heightCm || !weightKg || !activityLevel || !fitnessGoal) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for macro calculation",
      });
    }

    const result = await calculateMacrosForUser(
      req.appUser.id,
      weightKg,
      heightCm,
      age,
      gender,
      activityLevel,
      fitnessGoal
    );

    return res.json({
      success: true,
      macros: {
        targetCalories: result.macros.calories,
        targetProtein: result.macros.protein,
        targetCarbs: result.macros.carbs,
        targetFats: result.macros.fats,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
