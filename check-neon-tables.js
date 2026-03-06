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

    // 检查现有表
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 Existing tables:');
    if (tablesRes.rows.length === 0) {
      console.log('   (No tables found)');
    } else {
      tablesRes.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

    // 检查特定表是否存在
    const requiredTables = [
      'brand_partnerships',
      'user_points_balance',
      'hot_themes',
      'posts',
      'users',
      'points_records',
      'checkin_records'
    ];

    console.log('\n📊 Required tables check:');
    for (const table of requiredTables) {
      const res = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [table]);
      const exists = res.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

checkTables();
