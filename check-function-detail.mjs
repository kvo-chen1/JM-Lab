import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL ||
                     'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

async function checkFunctionDetail() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('🔍 函数详情检查\n');

    // 获取 get_user_points_stats 函数的完整定义
    const funcDef = await client.query(`
      SELECT pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'get_user_points_stats'
    `);

    if (funcDef.rows.length > 0) {
      console.log('📋 get_user_points_stats 函数完整定义:\n');
      console.log(funcDef.rows[0].def);
    } else {
      console.log('❌ 函数不存在');
    }

    // 测试函数调用
    console.log('\n' + '='.repeat(80));
    console.log('\n🧪 测试函数调用:\n');
    
    // 获取一个存在的用户ID
    const userResult = await client.query(`
      SELECT id FROM users LIMIT 1
    `);
    
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      console.log(`   使用用户ID: ${userId}`);
      
      try {
        const testResult = await client.query(`
          SELECT get_user_points_stats($1) as result
        `, [userId]);
        
        console.log('   ✅ 函数调用成功');
        console.log('   结果:', JSON.stringify(testResult.rows[0].result, null, 2));
      } catch (err) {
        console.log('   ❌ 函数调用失败:', err.message);
      }
    } else {
      console.log('   ⚠️ 没有找到用户，跳过测试');
    }

    await client.end();
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

checkFunctionDetail();
