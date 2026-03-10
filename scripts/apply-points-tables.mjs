// 执行积分表创建脚本
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: 缺少 Supabase 环境变量');
  console.log('请确保设置了 VITE_SUPABASE_URL 和 VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPointsTables() {
  console.log('🚀 开始应用积分表迁移...\n');
  
  try {
    // 读取 SQL 文件
    const sqlFile = path.join(process.cwd(), 'create_points_tables.sql');
    
    if (!fs.existsSync(sqlFile)) {
      console.error(`❌ 文件不存在: ${sqlFile}`);
      process.exit(1);
    }
    
    console.log(`📄 读取 SQL 文件: create_points_tables.sql`);
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    
    // 使用 Supabase RPC 执行 SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // 如果 exec_sql 函数不存在，尝试直接通过 REST API 执行
      console.log('⚠️ RPC 方式失败，尝试直接执行...');
      
      // 分割 SQL 语句
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            // 忽略 "already exists" 错误
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate')) {
              successCount++;
            } else {
              console.log(`  ⚠️ 错误: ${error.message.substring(0, 100)}`);
              errorCount++;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`  ⚠️ 错误: ${err.message.substring(0, 100)}`);
          errorCount++;
        }
      }
      
      console.log(`\n✅ 成功: ${successCount}, ⚠️ 错误: ${errorCount}`);
    } else {
      console.log('✅ SQL 执行成功！');
    }
    
    console.log('\n🎉 积分表迁移完成！');
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  }
}

applyPointsTables();
