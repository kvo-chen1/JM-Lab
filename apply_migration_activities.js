import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('Missing env: POSTGRES_URL_NON_POOLING / DATABASE_URL / POSTGRES_URL');
}

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
