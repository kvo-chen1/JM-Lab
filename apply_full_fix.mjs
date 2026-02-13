// 应用完整的数据库修复
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFullFix() {
  console.log('🔄 正在应用完整修复...\n');

  try {
    // 读取 SQL 文件
    const sqlFile = join(__dirname, 'fix_all_timestamps.sql');
    const sql = readFileSync(sqlFile, 'utf-8');

    // 分段执行 SQL
    const statements = sql.split(';').filter(s => s.trim());

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      console.log(`执行 SQL ${i + 1}/${statements.length}...`);

      // 使用 REST API 直接执行 SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          query: statement + ';'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  ❌ 失败: ${errorText.substring(0, 200)}`);
      } else {
        console.log(`  ✅ 成功`);
      }
    }

    console.log('\n✅ 完整修复完成！');
    console.log('\n请刷新页面后再次尝试添加节点。');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('\n请手动在 Supabase SQL Editor 中执行 fix_all_timestamps.sql 文件');
  }
}

applyFullFix();
