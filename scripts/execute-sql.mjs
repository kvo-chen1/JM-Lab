// 执行 SQL 脚本
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库连接配置
const pool = new Pool({
  connectionString: 'postgresql://postgres:csh200506207837@db.kizgwtrrsmkjeiddotup.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  }
});

async function executeSql() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始执行 SQL 修复脚本...\n');
    
    // 读取 SQL 文件
    const sqlFiles = [
      'fix_missing_columns.sql',
      'fix_remaining_tables.sql'
    ];
    
    for (const file of sqlFiles) {
      const filePath = path.join(process.cwd(), file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ 文件不存在: ${file}`);
        continue;
      }
      
      console.log(`📄 执行: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // 分割 SQL 语句（按分号分隔，但忽略字符串中的分号）
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const statement of statements) {
        try {
          await client.query(statement + ';');
          successCount++;
        } catch (err) {
          // 忽略 "already exists" 错误
          if (err.message.includes('already exists') || 
              err.message.includes('duplicate') ||
              err.message.includes('IF NOT EXISTS')) {
            successCount++;
          } else {
            console.log(`  ⚠️ 错误: ${err.message.substring(0, 100)}`);
            errorCount++;
          }
        }
      }
      
      console.log(`  ✅ 成功: ${successCount}, ⚠️ 错误: ${errorCount}\n`);
    }
    
    console.log('✅ SQL 修复脚本执行完成！');
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

executeSql();
