const { env } = require("../config/env");
const { upsertUserFromHeaders } = require("../services/users.service");

async function requireInternalUser(req, res, next) {
  try {
    if (req.path === "/health") {
      return next();
    }

    const internalApiKey = req.header("x-internal-api-key");
    if (internalApiKey !== env.internalApiKey) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await upsertUserFromHeaders(req.headers);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    req.appUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireInternalUser };
