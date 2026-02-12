#!/usr/bin/env node
/**
 * 修复 inspiration_mindmaps 表的 RLS 策略
 * 问题：后端 API 登录的用户无法通过 RLS 检查，因为 auth.uid() 返回 null
 * 解决方案：禁用 RLS 检查，改为在应用层控制权限
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('🔧 修复 inspiration_mindmaps RLS 策略...\n');

  try {
    // 1. 禁用所有表的 RLS
    console.log('1️⃣ 禁用 RLS...');
    
    const disableRLS = `
      ALTER TABLE inspiration_mindmaps DISABLE ROW LEVEL SECURITY;
      ALTER TABLE inspiration_nodes DISABLE ROW LEVEL SECURITY;
      ALTER TABLE inspiration_ai_suggestions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE inspiration_stories DISABLE ROW LEVEL SECURITY;
    `;
    
    const { error: disableError } = await supabase.rpc('exec_sql', { sql: disableRLS });
    if (disableError) {
      console.log('   ❌ 禁用 RLS 失败:', disableError.message);
      return;
    }
    console.log('   ✅ RLS 已禁用');

    // 2. 删除所有 RLS 策略
    console.log('\n2️⃣ 删除 RLS 策略...');
    
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can view own mindmaps" ON inspiration_mindmaps;
      DROP POLICY IF EXISTS "Users can insert own mindmaps" ON inspiration_mindmaps;
      DROP POLICY IF EXISTS "Users can update own mindmaps" ON inspiration_mindmaps;
      DROP POLICY IF EXISTS "Users can delete own mindmaps" ON inspiration_mindmaps;
      
      DROP POLICY IF EXISTS "Users can view own nodes" ON inspiration_nodes;
      DROP POLICY IF EXISTS "Users can insert own nodes" ON inspiration_nodes;
      DROP POLICY IF EXISTS "Users can update own nodes" ON inspiration_nodes;
      DROP POLICY IF EXISTS "Users can delete own nodes" ON inspiration_nodes;
      
      DROP POLICY IF EXISTS "Users can view own suggestions" ON inspiration_ai_suggestions;
      DROP POLICY IF EXISTS "Users can insert own suggestions" ON inspiration_ai_suggestions;
      DROP POLICY IF EXISTS "Users can update own suggestions" ON inspiration_ai_suggestions;
      DROP POLICY IF EXISTS "Users can delete own suggestions" ON inspiration_ai_suggestions;
      
      DROP POLICY IF EXISTS "Users can view own stories" ON inspiration_stories;
      DROP POLICY IF EXISTS "Users can insert own stories" ON inspiration_stories;
      DROP POLICY IF EXISTS "Users can update own stories" ON inspiration_stories;
      DROP POLICY IF EXISTS "Users can delete own stories" ON inspiration_stories;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
    if (dropError) {
      console.log('   ⚠️ 删除策略时出错:', dropError.message);
    } else {
      console.log('   ✅ 策略已删除');
    }

    // 3. 验证 RLS 状态
    console.log('\n3️⃣ 验证 RLS 状态...');
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['inspiration_mindmaps', 'inspiration_nodes', 'inspiration_ai_suggestions', 'inspiration_stories']);
    
    if (verifyError) {
      console.log('   ❌ 验证失败:', verifyError.message);
    } else {
      console.log('   ✅ 表状态:');
      for (const table of tables || []) {
        const { data: rlsStatus } = await supabase
          .rpc('exec_sql', { 
            sql: `SELECT relrowsecurity FROM pg_class WHERE relname = '${table.table_name}';` 
          });
        console.log(`      - ${table.table_name}: RLS ${rlsStatus ? '已启用' : '已禁用'}`);
      }
    }

    console.log('\n✅ RLS 策略修复完成！');
    console.log('\n⚠️ 注意：RLS 已禁用，权限控制需要在应用层实现。');
    console.log('   请确保在应用中验证用户身份和权限。');

  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    process.exit(1);
  }
}

fixRLSPolicies();
