import { Pool } from 'pg';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function testConnection() {
  try {
    console.log('=== Neon 数据库连接测试 ===');
    console.log('请从 Neon 控制台复制完整的连接字符串');
    console.log('格式: postgres://username:password@host:5432/database');
    
    const connectionString = await askQuestion('请输入连接字符串: ');
    
    console.log('\n测试连接...');
    
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    const client = await pool.connect();
    console.log('✅ 连接成功!');
    
    const res = await client.query('SELECT 1');
    console.log('✅ 查询成功:', res.rows);
    
    // 测试扩展
    const extensions = await client.query('SELECT * FROM pg_extension');
    console.log('✅ 已安装的扩展:', extensions.rows.map(e => e.extname));
    
    client.release();
    await pool.end();
    console.log('\n🎉 连接测试完成!');
    
  } catch (error) {
    console.error('❌ 连接错误:', error.message);
    console.error('错误详情:', error);
  } finally {
    rl.close();
  }
}

testConnection();
