
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigrations() {
  console.log('🔌 Connecting to database to apply new features...');
  
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
    console.log('✅ Connected.');

    const migrations = [
      'supabase/migrations/20260204000000_add_audit_logs.sql',
      'supabase/migrations/20260204000001_add_rpc_functions.sql'
    ];

    for (const file of migrations) {
      const filePath = path.resolve(process.cwd(), file);
      console.log(`\n📄 Applying migration: ${file}...`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ Successfully applied ${file}`);
      } catch (err) {
        console.error(`❌ Failed to apply ${file}:`);
        console.error(err.message);
        // We continue to next migration even if one fails, or should we stop?
        // For now, continue to see full picture.
      }
    }

    console.log('\n🎉 All migration tasks finished.');

  } catch (err) {
    console.error('❌ Database Connection Error:', err);
  } finally {
    await client.end();
  }
}

applyMigrations();
