const express = require("express");
const usersRoutes = require("./users.routes");
const pantryRoutes = require("./pantry.routes");
const recipesRoutes = require("./recipes.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

router.use("/users", usersRoutes);
router.use("/pantry", pantryRoutes);
router.use("/recipes", recipesRoutes);

module.exports = router;
