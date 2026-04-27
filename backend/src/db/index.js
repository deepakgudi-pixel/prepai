const { Pool } = require("pg");
const { env } = require("../config/env");

if (!env.databaseUrl) {
  console.warn("DATABASE_URL is not set. Database operations will fail until it is configured.");
}

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl ? { rejectUnauthorized: false } : undefined,
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  closePool,
};
