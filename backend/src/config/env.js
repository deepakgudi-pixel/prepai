const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config({ path: path.join(process.cwd(), "..", "frontend", ".env") });

const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  internalApiKey: process.env.BACKEND_INTERNAL_API_KEY || "prepai-internal-dev-key",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || "",
};

module.exports = { env };
