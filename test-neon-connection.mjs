import pg from 'pg';
const { Client, Pool } = pg;

// 从环境变量读取 Neon 数据库连接信息
const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL ||
                     'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

console.log('🔍 Neon 数据库连接检测');
console.log('='.repeat(50));
console.log('连接字符串:', DATABASE_URL.replace(/:([^@]+)@/, ':****@'));
console.log('');

async function testConnection() {
  let client = null;
  
  try {
    // 1. 测试基本连接
    console.log('1️⃣ 测试基本连接...');
    client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000, // 10秒超时
    });
    
    await client.connect();
    console.log('   ✅ 连接成功！\n');

    // 2. 执行简单查询
    console.log('2️⃣ 执行测试查询...');
    const testResult = await client.query('SELECT 1 as test, NOW() as server_time');
    console.log('   ✅ 查询成功！');
    console.log('   服务器时间:', testResult.rows[0].server_time);
    console.log('');

    // 3. 获取数据库版本
    console.log('3️⃣ 获取数据库版本...');
    const versionResult = await client.query('SELECT version()');
    console.log('   ✅ 版本信息:');
    console.log('   ', versionResult.rows[0].version.split(' ').slice(0, 4).join(' '));
    console.log('');

    // 4. 检查当前数据库
    console.log('4️⃣ 检查当前数据库...');
    const dbResult = await client.query('SELECT current_database() as db, current_user as user');
    console.log('   ✅ 当前数据库:', dbResult.rows[0].db);
    console.log('   当前用户:', dbResult.rows[0].user);
    console.log('');

    // 5. 列出所有表
    console.log('5️⃣ 列出数据库表...');
    const tablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️ 数据库中没有表');
    } else {
      console.log('   ✅ 找到', tablesResult.rows.length, '个表:');
      tablesResult.rows.forEach((row, index) => {
        console.log(`      ${index + 1}. ${row.table_name} (${row.table_type})`);
      });
    }
    console.log('');

    // 6. 检查连接状态
    console.log('6️⃣ 检查连接状态...');
    const pingResult = await client.query('SELECT pg_backend_pid() as pid');
    console.log('   ✅ 后端进程 ID:', pingResult.rows[0].pid);
    console.log('');

    // 7. 测试 Pool 连接池
    console.log('7️⃣ 测试连接池...');
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const poolClient = await pool.connect();
    const poolResult = await poolClient.query('SELECT count(*) as connections FROM pg_stat_activity');
    console.log('   ✅ 连接池工作正常');
    console.log('   当前活动连接数:', poolResult.rows[0].connections);
    poolClient.release();
    await pool.end();
    console.log('');

    console.log('='.repeat(50));
    console.log('✅ 所有测试通过！Neon 数据库连接正常');
    
  } catch (error) {
    console.log('');
    console.log('='.repeat(50));
    console.log('❌ 连接失败！');
    console.log('错误类型:', error.name);
    console.log('错误信息:', error.message);
    
    if (error.code) {
      console.log('错误代码:', error.code);
    }
    
    // 常见错误分析
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 可能原因: 无法连接到数据库服务器，请检查网络或连接字符串');
    } else if (error.message.includes('password authentication failed')) {
      console.log('\n💡 可能原因: 密码错误，请检查连接字符串中的密码');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\n💡 可能原因: 数据库不存在，请检查数据库名称');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 可能原因: 连接超时，请检查网络或增加超时时间');
    } else if (error.message.includes('SSL')) {
      console.log('\n💡 可能原因: SSL 配置问题，请检查 SSL 设置');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// 运行测试
testConnection();
