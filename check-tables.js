import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb',
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon database\n');

    // 检查 hot_searches 表
    console.log('Checking hot_searches table...');
    try {
      const result = await client.query('SELECT COUNT(*) FROM hot_searches');
      console.log(`✅ hot_searches table exists, row count: ${result.rows[0].count}`);
    } catch (e) {
      console.log('❌ hot_searches table error:', e.message);
    }

    // 检查 brand_partnerships 表
    console.log('\nChecking brand_partnerships table...');
    try {
      const result = await client.query('SELECT COUNT(*) FROM brand_partnerships');
      console.log(`✅ brand_partnerships table exists, row count: ${result.rows[0].count}`);
    } catch (e) {
      console.log('❌ brand_partnerships table error:', e.message);
    }

    // 列出所有表
    console.log('\n📋 All tables:');
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    tablesRes.rows.forEach(row => console.log(`  - ${row.table_name}`));

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

checkTables();
