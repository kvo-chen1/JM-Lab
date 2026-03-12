// 检查 user_jinbi_balance 表的字段名
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'db.kizgwtrrsmkjeiddotup.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
});

async function checkFieldNames() {
  console.log('========================================');
  console.log('检查 user_jinbi_balance 表字段名');
  console.log('========================================\n');

  await client.connect();

  try {
    // 获取表结构
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_jinbi_balance'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('表字段:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // 检查实际数据
    console.log('\n实际数据示例:');
    const dataResult = await client.query(`
      SELECT * FROM user_jinbi_balance
      WHERE user_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
    `);

    if (dataResult.rows.length > 0) {
      console.log('  找到记录:', dataResult.rows[0]);
    } else {
      console.log('  未找到记录');
    }

  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await client.end();
  }
}

checkFieldNames();
