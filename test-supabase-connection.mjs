// 测试 Supabase 连接脚本
import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local'), override: true });

console.log('=== Supabase 连接测试 ===\n');

// 检查环境变量
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
console.log('1. 环境变量检查:');
console.log('   - DATABASE_URL:', process.env.DATABASE_URL ? '✅ 已设置' : '❌ 未设置');
console.log('   - POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING ? '✅ 已设置' : '❌ 未设置');
console.log('   - POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ 已设置' : '❌ 未设置');
console.log('   - 最终使用的连接字符串:', dbUrl ? '✅ 已配置' : '❌ 未配置');

if (!dbUrl) {
  console.error('\n❌ 错误: 没有找到数据库连接字符串');
  process.exit(1);
}

// 隐藏密码的日志
const maskedUrl = dbUrl.replace(/(postgresql:\/\/[^:]+:)[^@]+(@.+)/, '$1***$2');
console.log('   - 连接地址:', maskedUrl);

// 创建连接池
const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('localhost') ? false : {
    rejectUnauthorized: false,
    keepAlive: true,
  },
  connectionTimeoutMillis: 10000,
});

console.log('\n2. 测试数据库连接...');

try {
  const client = await pool.connect();
  console.log('   ✅ 连接成功!');

  // 测试查询
  console.log('\n3. 执行测试查询...');
  const result = await client.query('SELECT NOW() as current_time, version() as db_version');
  console.log('   ✅ 查询成功!');
  console.log('   - 服务器时间:', result.rows[0].current_time);
  console.log('   - 数据库版本:', result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1]);

  // 测试表查询
  console.log('\n4. 测试表查询...');
  try {
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `);
    console.log('   ✅ 表查询成功!');
    console.log('   - 找到的表:', tablesResult.rows.map(r => r.table_name).join(', ') || '(无表)');
  } catch (e) {
    console.log('   ⚠️ 表查询警告:', e.message);
  }

  client.release();
  console.log('\n✅ 所有测试通过! Supabase 连接正常。');

} catch (error) {
  console.error('\n❌ 连接失败!');
  console.error('   错误信息:', error.message);

  if (error.message.includes('self-signed certificate')) {
    console.error('\n   💡 提示: SSL 证书错误');
    console.error('      这通常是因为连接到了错误的数据库服务器。');
    console.error('      请检查 .env.local 中的 DATABASE_URL 是否正确指向 Supabase。');
  }

  if (error.message.includes('ECONNREFUSED')) {
    console.error('\n   💡 提示: 连接被拒绝');
    console.error('      请检查网络连接和数据库服务器状态。');
  }

  if (error.message.includes('password authentication failed')) {
    console.error('\n   💡 提示: 密码错误');
    console.error('      请检查 .env.local 中的数据库密码是否正确。');
  }
} finally {
  await pool.end();
}
