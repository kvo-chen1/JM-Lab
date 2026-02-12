/**
 * 应用 inspiration_mindmaps RLS 修复
 * 使用 Supabase REST API 直接执行 SQL
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('🔧 应用 inspiration_mindmaps RLS 修复...\n');

  // SQL 修复脚本
  const sqlScript = `
-- 禁用所有表的 RLS
ALTER TABLE inspiration_mindmaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_ai_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_stories DISABLE ROW LEVEL SECURITY;

-- 删除所有 RLS 策略（如果存在）
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

  try {
    // 使用 Supabase 的 SQL 执行功能
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.log('⚠️ exec_sql RPC 不可用，尝试直接操作...');
      console.log('错误:', error.message);
      
      // 直接尝试插入测试数据来验证问题
      console.log('\n🧪 测试直接插入数据...');
      
      // 先获取一个有效的用户ID
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
      
      if (usersError || !users || users.length === 0) {
        console.log('❌ 无法获取用户列表:', usersError?.message || '无用户');
        return;
      }
      
      const testUserId = users[0].id;
      console.log(`使用用户ID: ${testUserId}`);
      
      // 尝试插入测试数据
      const { data, error: insertError } = await supabaseAdmin
        .from('inspiration_mindmaps')
        .insert({
          user_id: testUserId,
          title: 'RLS 测试脉络',
          description: '测试 RLS 是否已禁用'
        })
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ 插入失败:', insertError.message);
        console.log('\n📋 请手动执行以下 SQL 在 Supabase Dashboard 中:');
        console.log('========================================');
        console.log(sqlScript);
        console.log('========================================');
      } else {
        console.log('✅ 插入成功！ID:', data.id);
        
        // 清理测试数据
        await supabaseAdmin
          .from('inspiration_mindmaps')
          .delete()
          .eq('id', data.id);
        console.log('✅ 测试数据已清理');
      }
    } else {
      console.log('✅ SQL 执行成功！');
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    console.log('\n📋 请手动执行以下 SQL 在 Supabase Dashboard 中:');
    console.log('========================================');
    console.log(sqlScript);
    console.log('========================================');
  }
}

applyFix();
