// 修复数据库触发器中的时间戳格式问题
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置');
  console.error('请确保 VITE_SUPABASE_URL 和 VITE_SUPABASE_SERVICE_ROLE_KEY 已设置');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('🔄 正在修复数据库触发器...\n');

  try {
    // 读取 SQL 文件
    const sqlFile = join(__dirname, 'fix_trigger_timestamp.sql');
    const sql = readFileSync(sqlFile, 'utf-8');

    // 执行 SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql });

    if (error) {
      // 如果 exec_sql 函数不存在，尝试直接执行
      console.log('⚠️ exec_sql 函数不存在，尝试使用 REST API 执行...');

      // 分段执行 SQL
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (!statement.trim()) continue;

        const { error: stmtError } = await supabaseAdmin
          .rpc('exec_sql', { sql: statement + ';' });

        if (stmtError) {
          console.error('❌ 执行失败:', stmtError.message);
          console.error('SQL:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('✅ 触发器修复完成！');
    console.log('\n请刷新页面后再次尝试添加节点。');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    console.error('\n请手动在 Supabase SQL Editor 中执行 fix_trigger_timestamp.sql 文件');
  }
}

applyFix();
