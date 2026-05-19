const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Running PrepAI Phase 1 Database Migration...\n');

  // Create connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'src/db/schema-phase1.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📊 Creating tables and functions...\n');

    // Execute the schema
    await pool.query(schema);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables
    console.log('📋 Verifying tables...\n');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n🎉 Phase 1 database is ready!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
