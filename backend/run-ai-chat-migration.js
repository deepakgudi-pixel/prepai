const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected!");

    const sqlPath = path.join(__dirname, "src", "db", "schema-ai-chat.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Running AI Chat migration...");
    await client.query(sql);
    console.log("✅ AI Chat migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
