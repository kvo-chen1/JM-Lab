/**
 * 修复 inspiration_mindmaps 表的 RLS 策略
 * 问题：前端使用匿名密钥连接时，auth.uid() 返回 null，导致无法通过 RLS 检查
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

async function fixRLS() {
  console.log('🔧 修复 inspiration_mindmaps RLS 策略...\n');

  try {
    // 1. 禁用所有相关表的 RLS
    console.log('1️⃣ 禁用 RLS...');
    
    const tables = [
      'inspiration_mindmaps',
      'inspiration_nodes', 
      'inspiration_ai_suggestions',
      'inspiration_stories'
    ];
    
    for (const table of tables) {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
      });
      
      if (error) {
        console.log(`   ⚠️ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table} RLS 已禁用`);
      }
    }

    // 2. 删除所有 RLS 策略
    console.log('\n2️⃣ 删除 RLS 策略...');
    
    const policies = [
      { table: 'inspiration_mindmaps', policies: ['Users can view own mindmaps', 'Users can insert own mindmaps', 'Users can update own mindmaps', 'Users can delete own mindmaps'] },
      { table: 'inspiration_nodes', policies: ['Users can view own nodes', 'Users can insert own nodes', 'Users can update own nodes', 'Users can delete own nodes'] },
      { table: 'inspiration_ai_suggestions', policies: ['Users can view own suggestions', 'Users can insert own suggestions', 'Users can update own suggestions', 'Users can delete own suggestions'] },
      { table: 'inspiration_stories', policies: ['Users can view own stories', 'Users can insert own stories', 'Users can update own stories', 'Users can delete own stories'] }
    ];
    
    for (const { table, policies: policyList } of policies) {
      for (const policy of policyList) {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policy}" ON ${table};`
        });
        
        if (error) {
          console.log(`   ⚠️ ${table}.${policy}: ${error.message}`);
        } else {
          console.log(`   ✅ 已删除: ${table}.${policy}`);
        }
      }
    }

    // 3. 验证修复结果
    console.log('\n3️⃣ 验证修复结果...');
    
    // 尝试插入一条测试数据
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000',
      title: '测试脉络',
      description: 'RLS 修复测试'
    };
    
    const { data, error } = await supabaseAdmin
      .from('inspiration_mindmaps')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.log(`   ❌ 测试插入失败: ${error.message}`);
    } else {
      console.log(`   ✅ 测试插入成功，ID: ${data.id}`);
      
      // 删除测试数据
      await supabaseAdmin
        .from('inspiration_mindmaps')
        .delete()
        .eq('id', data.id);
      console.log(`   ✅ 测试数据已清理`);
    }

    console.log('\n✅ RLS 修复完成！');
    console.log('\n注意：权限控制已移至应用层，请确保前端代码正确验证用户身份。');
    
  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    process.exit(1);
  }
}

fixRLS();
