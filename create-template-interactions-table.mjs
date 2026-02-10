#!/usr/bin/env node
/**
 * 创建模板互动表
 * 使用 Supabase 客户端直接执行 SQL
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ 已加载 .env.local 文件');
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

console.log('\n========================================');
console.log('创建模板互动表');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL 语句
const sqlStatements = [
  // 创建模板收藏表
  `CREATE TABLE IF NOT EXISTS template_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id)
  )`,

  // 创建模板点赞表
  `CREATE TABLE IF NOT EXISTS template_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id)
  )`,

  // 创建索引
  `CREATE INDEX IF NOT EXISTS idx_template_favorites_user_id ON template_favorites(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_template_favorites_template_id ON template_favorites(template_id)`,
  `CREATE INDEX IF NOT EXISTS idx_template_likes_user_id ON template_likes(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_template_likes_template_id ON template_likes(template_id)`,

  // 启用 RLS
  `ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE template_likes ENABLE ROW LEVEL SECURITY`,

  // 创建 RLS 策略 - 收藏表
  `CREATE POLICY IF NOT EXISTS "Users can view own favorites" ON template_favorites
    FOR SELECT USING (auth.uid() = user_id)`,

  `CREATE POLICY IF NOT EXISTS "Users can insert own favorites" ON template_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id)`,

  `CREATE POLICY IF NOT EXISTS "Users can delete own favorites" ON template_favorites
    FOR DELETE USING (auth.uid() = user_id)`,

  // 创建 RLS 策略 - 点赞表
  `CREATE POLICY IF NOT EXISTS "Users can view own likes" ON template_likes
    FOR SELECT USING (auth.uid() = user_id)`,

  `CREATE POLICY IF NOT EXISTS "Users can insert own likes" ON template_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id)`,

  `CREATE POLICY IF NOT EXISTS "Users can delete own likes" ON template_likes
    FOR DELETE USING (auth.uid() = user_id)`,
];

async function executeSql() {
  let successCount = 0;
  let errorCount = 0;

  for (const sql of sqlStatements) {
    const shortDesc = sql.substring(0, 50).replace(/\s+/g, ' ').trim();
    console.log(`执行: ${shortDesc}...`);

    try {
      // 使用 Supabase 的 rpc 执行 SQL
      const { error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        // 如果 exec_sql 函数不存在，尝试使用 REST API 直接执行
        console.log(`  ⚠️ RPC 失败: ${error.message}`);
        console.log(`  尝试使用 REST API...`);

        // 使用 fetch 直接调用 Supabase REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`  ❌ 失败: ${errorText}`);
          errorCount++;
        } else {
          console.log(`  ✅ 成功`);
          successCount++;
        }
      } else {
        console.log(`  ✅ 成功`);
        successCount++;
      }
    } catch (e) {
      console.log(`  ❌ 异常: ${e.message}`);
      errorCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`执行完成: ${successCount} 成功, ${errorCount} 失败`);
  console.log(`========================================`);

  return errorCount === 0;
}

// 验证表是否创建成功
async function verifyTables() {
  console.log('\n验证表是否创建成功...\n');

  const tables = ['template_favorites', 'template_likes'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: 表存在且可访问`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
}

// 主函数
async function main() {
  const success = await executeSql();
  await verifyTables();

  if (success) {
    console.log('\n🎉 所有表创建成功！');
    process.exit(0);
  } else {
    console.log('\n⚠️ 部分操作失败，请检查错误信息');
    console.log('\n建议：登录 Supabase Dashboard，在 SQL Editor 中手动执行以下文件：');
    console.log('supabase/migrations/20260209000000_create_template_interactions.sql');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('执行失败:', error);
  process.exit(1);
});
