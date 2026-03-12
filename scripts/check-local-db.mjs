import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'creator_community',
  user: 'postgres',
  password: '123456',
});

async function checkLocalDB() {
  console.log('========================================');
  console.log('检查本地数据库');
  console.log('========================================\n');

  try {
    await client.connect();
    console.log('✅ 本地数据库连接成功\n');

    // 检查 user_jinbi_balance 表
    console.log('1. 检查 user_jinbi_balance 表...');
    const balanceResult = await client.query('SELECT * FROM user_jinbi_balance LIMIT 5');
    console.log(`   找到 ${balanceResult.rows.length} 条余额记录`);
    balanceResult.rows.forEach(row => {
      console.log(`   - User: ${row.user_id}, Balance: ${row.total_balance}`);
    });

    // 检查 jinbi_records 表
    console.log('\n2. 检查 jinbi_records 表...');
    const recordsResult = await client.query('SELECT * FROM jinbi_records ORDER BY created_at DESC LIMIT 5');
    console.log(`   找到 ${recordsResult.rows.length} 条充值记录`);
    recordsResult.rows.forEach(row => {
      console.log(`   - User: ${row.user_id}, Amount: ${row.amount}, Type: ${row.type}`);
    });

    // 检查用户 78340927-c853-4978-a90f-f54d7c6883d2 的数据
    console.log('\n3. 检查特定用户数据...');
    const userResult = await client.query(
      'SELECT * FROM user_jinbi_balance WHERE user_id = $1',
      ['78340927-c853-4978-a90f-f54d7c6883d2']
    );
    if (userResult.rows.length > 0) {
      console.log('   用户余额:', userResult.rows[0].total_balance);
    } else {
      console.log('   用户没有余额记录');
    }

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await client.end();
  }
}

checkLocalDB();
