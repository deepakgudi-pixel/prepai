const express = require("express");
const routes = require("./routes");
const { requireInternalUser } = require("./middleware/internal-auth");

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use("/api", requireInternalUser, routes);

app.use((error, _req, res, _next) => {
  console.error("Backend error:", error);
  res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

module.exports = app;
