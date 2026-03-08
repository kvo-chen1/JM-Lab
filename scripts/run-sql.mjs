/**
 * 执行 SQL 脚本到 Neon 数据库
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 SQL 文件
const sqlFile = process.argv[2] || 'create-ip-incubation-tables.sql';
const sqlPath = path.join(__dirname, sqlFile);

if (!fs.existsSync(sqlPath)) {
  console.error(`SQL 文件不存在: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf-8');

// 获取数据库连接字符串
const connectionString = process.env.DATABASE_URL || 
  process.env.NEON_DATABASE_URL || 
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error('错误: 未找到数据库连接字符串，请设置 DATABASE_URL 环境变量');
  console.error('当前环境变量:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('NEON')));
  process.exit(1);
}

console.log('正在连接数据库...');
console.log('数据库 URL:', connectionString.replace(/:[^:@]+@/, ':****@'));

// 创建连接池
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSQL() {
  const client = await pool.connect();
  
  try {
    console.log('\n开始执行 SQL 脚本...\n');
    
    // 分割 SQL 语句（按分号分隔，但忽略注释中的分号）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`共 ${statements.length} 条 SQL 语句\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const firstLine = statement.split('\n')[0].trim();
      
      try {
        await client.query(statement);
        successCount++;
        
        // 只显示重要的语句
        if (firstLine.includes('CREATE TABLE') || 
            firstLine.includes('INSERT INTO') ||
            firstLine.includes('CREATE INDEX') ||
            firstLine.includes('CREATE TRIGGER')) {
          console.log(`✓ ${firstLine.substring(0, 60)}...`);
        }
      } catch (error) {
        errorCount++;
        // 忽略 "已存在" 的错误
        if (error.message.includes('already exists')) {
          console.log(`○ ${firstLine.substring(0, 60)}... (已存在)`);
        } else {
          console.error(`✗ ${firstLine.substring(0, 60)}...`);
          console.error(`  错误: ${error.message}`);
        }
      }
    }
    
    console.log(`\n========================================`);
    console.log(`执行完成!`);
    console.log(`成功: ${successCount} 条`);
    console.log(`失败: ${errorCount} 条`);
    console.log(`========================================\n`);
    
    // 验证表是否创建成功
    console.log('验证表结构...');
    const tables = ['ip_assets', 'ip_stages', 'ip_partnerships', 'commercial_opportunities', 'copyright_assets', 'ip_activities'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);
        
        if (result.rows[0].exists) {
          // 获取记录数
          const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
          const count = countResult.rows[0].count;
          console.log(`✓ ${table}: 存在 (${count} 条记录)`);
        } else {
          console.log(`✗ ${table}: 不存在`);
        }
      } catch (error) {
        console.log(`✗ ${table}: 检查失败 - ${error.message}`);
      }
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

runSQL().catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});
