const fs = require("fs/promises");
const path = require("path");
const { query, closePool } = require("../db");

async function run() {
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await query(schemaSql);
  console.log("PrepAI schema migration completed.");
}

run()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool().catch(() => {});
  });
