import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';

const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function applyFix() {
  try {
    const client = await pool.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync('./fix-comment-trigger.sql', 'utf8');
    await client.query(sql);
    console.log('Comment trigger fixed successfully');

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

applyFix();
