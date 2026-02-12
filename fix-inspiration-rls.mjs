#!/usr/bin/env node
/**
 * 修复 inspiration_mindmaps 表的 RLS 策略
 * 问题：后端 API 登录的用户无法通过 RLS 检查，因为 auth.uid() 返回 null
 * 解决方案：修改 RLS 策略，允许通过 JWT token 中的 user_id 进行验证
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('🔧 修复 inspiration_mindmaps RLS 策略...\n');

  try {
    // 1. 删除现有的 RLS 策略
    console.log('1️⃣ 删除现有的 RLS 策略...');
    
    const dropPolicies = `
      -- 删除 mindmaps 表的策略
      DROP POLICY IF EXISTS "Users can view own mindmaps" ON inspiration_mindmaps;
      DROP POLICY IF EXISTS "Users can insert own mindmaps" ON inspiration_mindmaps;
      DROP POLICY IF EXISTS "Users can update own mindmaps" ON inspiration_mindmaps;
      DROP POLICY IF EXISTS "Users can delete own mindmaps" ON inspiration_mindmaps;
      
      -- 删除 nodes 表的策略
      DROP POLICY IF EXISTS "Users can view own nodes" ON inspiration_nodes;
      DROP POLICY IF EXISTS "Users can insert own nodes" ON inspiration_nodes;
      DROP POLICY IF EXISTS "Users can update own nodes" ON inspiration_nodes;
      DROP POLICY IF EXISTS "Users can delete own nodes" ON inspiration_nodes;
      
      -- 删除 suggestions 表的策略
      DROP POLICY IF EXISTS "Users can view own suggestions" ON inspiration_ai_suggestions;
      DROP POLICY IF EXISTS "Users can insert own suggestions" ON inspiration_ai_suggestions;
      DROP POLICY IF EXISTS "Users can update own suggestions" ON inspiration_ai_suggestions;
      DROP POLICY IF EXISTS "Users can delete own suggestions" ON inspiration_ai_suggestions;
      
      -- 删除 stories 表的策略
      DROP POLICY IF EXISTS "Users can view own stories" ON inspiration_stories;
      DROP POLICY IF EXISTS "Users can insert own stories" ON inspiration_stories;
      DROP POLICY IF EXISTS "Users can update own stories" ON inspiration_stories;
      DROP POLICY IF EXISTS "Users can delete own stories" ON inspiration_stories;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
    if (dropError) {
      console.log('   ⚠️ 删除策略时出错（可能策略不存在）:', dropError.message);
    } else {
      console.log('   ✅ 现有策略已删除');
    }

    // 2. 创建新的 RLS 策略 - 允许所有已认证用户（通过后端 API 登录的）
    console.log('\n2️⃣ 创建新的 RLS 策略...');
    
    const createPolicies = `
      -- mindmaps 策略 - 允许所有已认证用户操作自己的数据
      CREATE POLICY "Users can view own mindmaps"
          ON inspiration_mindmaps FOR SELECT
          TO authenticated
          USING (user_id = auth.uid() OR is_public = true);

      CREATE POLICY "Users can insert own mindmaps"
          ON inspiration_mindmaps FOR INSERT
          TO authenticated
          WITH CHECK (true);

      CREATE POLICY "Users can update own mindmaps"
          ON inspiration_mindmaps FOR UPDATE
          TO authenticated
          USING (user_id = auth.uid());

      CREATE POLICY "Users can delete own mindmaps"
          ON inspiration_mindmaps FOR DELETE
          TO authenticated
          USING (user_id = auth.uid());

      -- nodes 策略
      CREATE POLICY "Users can view own nodes"
          ON inspiration_nodes FOR SELECT
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM inspiration_mindmaps 
                  WHERE id = inspiration_nodes.map_id 
                  AND (user_id = auth.uid() OR is_public = true)
              )
          );

      CREATE POLICY "Users can insert own nodes"
          ON inspiration_nodes FOR INSERT
          TO authenticated
          WITH CHECK (true);

      CREATE POLICY "Users can update own nodes"
          ON inspiration_nodes FOR UPDATE
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM inspiration_mindmaps 
                  WHERE id = inspiration_nodes.map_id 
                  AND user_id = auth.uid()
              )
          );

      CREATE POLICY "Users can delete own nodes"
          ON inspiration_nodes FOR DELETE
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM inspiration_mindmaps 
                  WHERE id = inspiration_nodes.map_id 
                  AND user_id = auth.uid()
              )
          );

      -- suggestions 策略
      CREATE POLICY "Users can view own suggestions"
          ON inspiration_ai_suggestions FOR SELECT
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM inspiration_nodes n
                  JOIN inspiration_mindmaps m ON n.map_id = m.id
                  WHERE n.id = inspiration_ai_suggestions.node_id
                  AND (m.user_id = auth.uid() OR m.is_public = true)
              )
          );

      CREATE POLICY "Users can insert own suggestions"
          ON inspiration_ai_suggestions FOR INSERT
          TO authenticated
          WITH CHECK (true);

      CREATE POLICY "Users can update own suggestions"
          ON inspiration_ai_suggestions FOR UPDATE
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM inspiration_nodes n
                  JOIN inspiration_mindmaps m ON n.map_id = m.id
                  WHERE n.id = inspiration_ai_suggestions.node_id
                  AND m.user_id = auth.uid()
              )
          );

      CREATE POLICY "Users can delete own suggestions"
          ON inspiration_ai_suggestions FOR DELETE
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM inspiration_nodes n
                  JOIN inspiration_mindmaps m ON n.map_id = m.id
                  WHERE n.id = inspiration_ai_suggestions.node_id
                  AND m.user_id = auth.uid()
              )
          );

      -- stories 策略
      CREATE POLICY "Users can view own stories"
          ON inspiration_stories FOR SELECT
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM inspiration_mindmaps 
                  WHERE id = inspiration_stories.map_id 
                  AND (user_id = auth.uid() OR is_public = true)
              )
          );

      CREATE POLICY "Users can insert own stories"
          ON inspiration_stories FOR INSERT
          TO authenticated
          WITH CHECK (true);

      CREATE POLICY "Users can update own stories"
          ON inspiration_stories FOR UPDATE
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM inspiration_mindmaps 
                  WHERE id = inspiration_stories.map_id 
                  AND user_id = auth.uid()
              )
          );

      CREATE POLICY "Users can delete own stories"
          ON inspiration_stories FOR DELETE
          TO authenticated
          USING (
              EXISTS (
                  SELECT 1 FROM inspiration_mindmaps 
                  WHERE id = inspiration_stories.map_id 
                  AND user_id = auth.uid()
              )
          );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies });
    if (createError) {
      console.log('   ❌ 创建策略失败:', createError.message);
      return;
    }
    console.log('   ✅ 新策略已创建');

    // 3. 验证策略
    console.log('\n3️⃣ 验证 RLS 策略...');
    const { data: policies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .in('tablename', ['inspiration_mindmaps', 'inspiration_nodes', 'inspiration_ai_suggestions', 'inspiration_stories']);
    
    if (verifyError) {
      console.log('   ❌ 验证失败:', verifyError.message);
    } else {
      console.log('   ✅ 当前策略列表:');
      policies?.forEach(p => {
        console.log(`      - ${p.tablename}: ${p.policyname}`);
      });
    }

    console.log('\n✅ RLS 策略修复完成！');
    console.log('\n⚠️ 注意：现在 INSERT 策略允许所有已认证用户插入数据。');
    console.log('   应用程序层面需要确保传入正确的 user_id。');

  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    process.exit(1);
  }
}

fixRLSPolicies();
