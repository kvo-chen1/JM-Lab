const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigrations() {
  console.log('🔌 Connecting to database to create user_stats table...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const migrationFile = 'supabase/migrations/20260204000003_create_user_stats_table.sql';
    const filePath = path.resolve(process.cwd(), migrationFile);
    console.log(`\n📄 Applying migration: ${migrationFile}...`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await client.query(sql);
      console.log(`✅ Successfully applied ${migrationFile}`);
    } catch (err) {
      console.error(`❌ Failed to apply ${migrationFile}:`);
      console.error(err.message);
      process.exit(1);
    }

    console.log('\n🎉 user_stats table created successfully!');

  } catch (err) {
    console.error('❌ Database Connection Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();
