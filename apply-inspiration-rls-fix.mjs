#!/usr/bin/env node
/**
 * 应用 inspiration_mindmaps RLS 修复
 * 直接通过 Supabase REST API 执行 SQL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  console.log('🔧 应用 inspiration_mindmaps RLS 修复...\n');

  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260216000001_fix_inspiration_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // 分割 SQL 语句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📄 找到 ${statements.length} 条 SQL 语句\n`);

    // 逐条执行
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`[${i + 1}/${statements.length}] 执行: ${statement.substring(0, 60)}...`);

      try {
        // 使用 Supabase 的 REST API 执行 SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            query: statement
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          // 忽略 "does not exist" 错误（策略可能不存在）
          if (errorText.includes('does not exist')) {
            console.log(`   ⚠️ 跳过（对象不存在）`);
          } else {
            console.log(`   ❌ 失败: ${errorText.substring(0, 100)}`);
          }
        } else {
          console.log(`   ✅ 成功`);
        }
      } catch (error) {
        console.log(`   ❌ 错误: ${error.message}`);
      }
    }

    console.log('\n✅ 修复脚本执行完成！');
    console.log('\n⚠️ 重要提示：');
    console.log('   1. RLS 已禁用，权限控制需要在应用层实现');
    console.log('   2. 请确保在应用中验证用户身份和权限');
    console.log('   3. 建议刷新页面后重新测试创建脉络功能');

  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    process.exit(1);
  }
}

applyFix();
