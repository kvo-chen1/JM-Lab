
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyEventMigration() {
  console.log('🔌 Connecting to database to apply event & draft schema...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const file = 'supabase/migrations/20260204000003_add_events_drafts.sql';
    const filePath = path.resolve(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await client.query(sql);
      console.log(`✅ Successfully applied ${file}`);
    } catch (err) {
      console.error(`❌ Failed to apply ${file}:`);
      console.error(err.message);
    }

  } catch (err) {
    console.error('❌ Database Connection Error:', err);
  } finally {
    await client.end();
  }
}

applyEventMigration();
