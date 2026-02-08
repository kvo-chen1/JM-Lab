import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function checkTable() {
  try {
    const client = await pool.connect();
    console.log('Connected to database');

    // Check comments table columns
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'comments'
      ORDER BY ordinal_position
    `);
    console.log('\nComments table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check recent comments
    const commentsResult = await client.query(`
      SELECT id, content, user_id, post_id, parent_id, created_at
      FROM comments
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log('\nRecent comments:');
    commentsResult.rows.forEach(row => {
      console.log(`  ${row.id}: ${row.content.substring(0, 50)}... (post_id: ${row.post_id})`);
    });

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkTable();
