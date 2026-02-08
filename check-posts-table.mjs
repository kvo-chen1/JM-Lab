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

    // Check posts table columns
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'posts'
      ORDER BY ordinal_position
    `);
    console.log('\nPosts table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check recent posts
    const postsResult = await client.query(`
      SELECT id, title, user_id, community_id, created_at
      FROM posts
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log('\nRecent posts:');
    postsResult.rows.forEach(row => {
      console.log(`  ${row.id}: ${row.title.substring(0, 50)}... (user_id: ${row.user_id})`);
    });

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkTable();
