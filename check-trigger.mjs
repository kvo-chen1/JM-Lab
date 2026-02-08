import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function checkTrigger() {
  try {
    const client = await pool.connect();
    console.log('Connected to database');

    // Get trigger function definition
    const result = await client.query(`
      SELECT pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'log_post_activity'
    `);

    if (result.rows.length > 0) {
      console.log('\nTrigger function log_post_activity:');
      console.log(result.rows[0].definition);
    } else {
      console.log('Trigger function not found');
    }

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkTrigger();
