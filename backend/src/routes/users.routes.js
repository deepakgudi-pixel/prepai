const express = require("express");
const { updateDietaryPreference } = require("../services/users.service");

const router = express.Router();

router.get("/preference", async (req, res, next) => {
  try {
    return res.json({
      success: true,
      preference: req.appUser.dietary_preference || "all",
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/preference", async (req, res, next) => {
  try {
    const preference = req.body.preference;

    if (!["all", "veg", "non-veg"].includes(preference)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dietary preference",
      });
    }

    const updated = await updateDietaryPreference(req.appUser.id, preference);

    return res.json({
      success: true,
      preference: updated?.dietary_preference || preference,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
