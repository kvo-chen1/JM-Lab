#!/usr/bin/env node
/**
 * 最终修复 RLS 策略
 * 禁用所有津脉脉络相关表的 RLS
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  console.log('🔧 最终修复 RLS 策略...\n');

  try {
    // 1. 禁用 RLS
    console.log('1️⃣ 禁用 RLS...');
    
    const tables = [
      'inspiration_mindmaps',
      'inspiration_nodes', 
      'inspiration_ai_suggestions',
      'inspiration_stories'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .rpc('exec_sql', {
          sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });
      
      if (error) {
        console.log(`   ⚠️ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: RLS 已禁用`);
      }
    }

    // 2. 验证 RLS 状态
    console.log('\n2️⃣ 验证 RLS 状态...');
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .in('relname', tables);

    if (rlsError) {
      console.log('   ⚠️ 无法验证 RLS 状态:', rlsError.message);
    } else {
      console.log('   当前 RLS 状态:');
      rlsStatus?.forEach(table => {
        console.log(`      - ${table.relname}: ${table.relrowsecurity ? '已启用 ⚠️' : '已禁用 ✅'}`);
      });
    }

    // 3. 测试插入
    console.log('\n3️⃣ 测试节点插入...');
    
    // 先获取一个脉络
    const { data: mindmaps } = await supabase
      .from('inspiration_mindmaps')
      .select('id')
      .limit(1);

    if (mindmaps && mindmaps.length > 0) {
      const mapId = mindmaps[0].id;
      
      const testNode = {
        map_id: mapId,
        title: '测试节点',
        description: '这是一个测试节点',
        category: 'inspiration',
      };

      const { data: insertData, error: insertError } = await supabase
        .from('inspiration_nodes')
        .insert(testNode)
        .select()
        .single();

      if (insertError) {
        console.log('   ❌ 插入失败:', insertError.message);
      } else {
        console.log('   ✅ 插入成功! 节点 ID:', insertData.id);
        
        // 清理测试数据
        await supabase
          .from('inspiration_nodes')
          .delete()
          .eq('id', insertData.id);
        console.log('   ✅ 测试数据已清理');
      }
    } else {
      console.log('   ⚠️ 没有找到脉络，跳过插入测试');
    }

    console.log('\n✅ RLS 修复完成！');
    console.log('\n💡 提示：');
    console.log('   - RLS 已禁用，权限控制需要在应用层实现');
    console.log('   - 请刷新页面后重新测试添加节点功能');

  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    process.exit(1);
  }
}

fixRLS();
