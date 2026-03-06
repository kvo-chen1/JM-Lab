import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL ||
                     'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

async function checkUserPointsBalance() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('🔍 user_points_balance 表检查\n');

    // 1. 检查 user_points_balance 表结构
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_points_balance'
      ORDER BY ordinal_position
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ user_points_balance 表不存在！');
    } else {
      console.log('✅ user_points_balance 表结构:\n');
      tableCheck.rows.forEach(col => {
        console.log(`   ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }

    // 2. 检查表中的数据
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 数据统计:\n');
    
    const countResult = await client.query(`
      SELECT COUNT(*) as total FROM user_points_balance
    `);
    console.log(`   总记录数: ${countResult.rows[0].total}`);

    // 3. 检查是否有数据
    if (countResult.rows[0].total > 0) {
      const sampleResult = await client.query(`
        SELECT * FROM user_points_balance LIMIT 3
      `);
      console.log('\n   样本数据:');
      sampleResult.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. user_id: ${row.user_id}, balance: ${row.balance}`);
      });
    }

    // 4. 检查 points_records 表
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 points_records 表:\n');
    
    const recordsCount = await client.query(`
      SELECT COUNT(*) as total FROM points_records
    `);
    console.log(`   总记录数: ${recordsCount.rows[0].total}`);

    // 5. 测试 get_user_points_stats 函数
    console.log('\n' + '='.repeat(80));
    console.log('\n🧪 测试 get_user_points_stats 函数:\n');
    
    const userResult = await client.query(`
      SELECT id FROM users LIMIT 1
    `);
    
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      console.log(`   测试用户ID: ${userId}`);
      
      try {
        const statsResult = await client.query(`
          SELECT get_user_points_stats($1) as stats
        `, [userId]);
        console.log('   ✅ 函数执行成功');
        console.log('   结果:', JSON.stringify(statsResult.rows[0].stats, null, 2));
      } catch (err) {
        console.log('   ❌ 函数执行失败:', err.message);
      }
    }

    await client.end();
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

checkUserPointsBalance();
