const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Drop existing tables
    console.log("Dropping existing meal plan tables...");
    await client.query("DROP TABLE IF EXISTS meal_plan_days CASCADE");
    await client.query("DROP TABLE IF EXISTS meal_plans CASCADE");
    console.log("✅ Old tables dropped");

    // Create new tables
    const schemaPath = path.join(__dirname, "src", "db", "schema-meal-plans.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("Creating new meal plans tables...");
    await client.query(schema);
    console.log("✅ Meal plans tables created successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
