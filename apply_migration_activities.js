import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = "postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to database.");

    const sqlPath = path.join(__dirname, 'supabase/migrations/20260203150000_add_events_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying migration:", sqlPath);
    await client.query(sql);
    console.log("Migration applied successfully!");

  } catch (err) {
    console.error("Error applying migration:", err);
  } finally {
    await client.end();
  }
}

run();
