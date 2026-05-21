const { Pool } = require("pg");
const { env } = require("../config/env");

if (!env.databaseUrl) {
  console.warn("DATABASE_URL is not set. Database operations will fail until it is configured.");
}

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl ? { rejectUnauthorized: false } : undefined,
  max: 4, // Limit connections per serverless function instance to prevent DB exhaustion
  idleTimeoutMillis: 15000, // Close idle clients quickly in transient environment
  connectionTimeoutMillis: 5000, // Return connection errors fast
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
