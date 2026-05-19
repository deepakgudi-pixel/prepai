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

    const schemaPath = path.join(__dirname, "src", "db", "schema-meal-plans.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("Running meal plans migration...");
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
