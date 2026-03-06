import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.NEON_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  const result = await pool.query("SELECT proname FROM pg_proc WHERE proname = 'increment_work_view_count'");
  console.log('Function exists:', result.rows.length > 0);
  if (result.rows.length > 0) {
    console.log('Function:', result.rows[0]);
  }
  await pool.end();
}

verify();
