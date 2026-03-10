#!/usr/bin/env node
/**
 * 测试 inspiration_mindmaps 插入操作
 * 验证 RLS 问题是否已解决
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('🧪 测试 inspiration_mindmaps 插入操作...\n');

  // 使用 Service Role Key 检查 RLS 状态
  console.log('1️⃣ 检查 RLS 状态...');
  try {
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .in('relname', ['inspiration_mindmaps', 'inspiration_nodes', 'inspiration_ai_suggestions', 'inspiration_stories']);

    if (rlsError) {
      console.log('   ⚠️ 无法检查 RLS 状态:', rlsError.message);
    } else {
      console.log('   当前 RLS 状态:');
      rlsData?.forEach(table => {
        console.log(`      - ${table.relname}: ${table.relrowsecurity ? '已启用' : '已禁用'}`);
      });
    }
  } catch (e) {
    console.log('   ⚠️ 检查 RLS 状态失败:', e.message);
  }

  // 测试插入
  console.log('\n2️⃣ 测试插入操作...');
  const testUserId = '00000000-0000-0000-0000-000000000001';
  
  try {
    const { data, error } = await supabase
      .from('inspiration_mindmaps')
      .insert({
        user_id: testUserId,
        title: '测试脉络',
        description: '这是一个测试脉络',
        layout_type: 'tree',
        settings: {
          layoutType: 'tree',
          theme: 'tianjin',
          autoSave: true,
          showGrid: true,
          snapToGrid: false,
          gridSize: 20,
        },
        stats: {
          totalNodes: 0,
          maxDepth: 0,
          aiGeneratedNodes: 0,
          cultureNodes: 0,
          lastActivityAt: Date.now(),
        },
        tags: [],
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      console.log('   ❌ 插入失败:', error.message);
      console.log('   错误代码:', error.code);
    } else {
      console.log('   ✅ 插入成功！');
      console.log('   插入的 ID:', data.id);
      
      // 清理测试数据
      console.log('\n3️⃣ 清理测试数据...');
      const { error: deleteError } = await supabase
        .from('inspiration_mindmaps')
        .delete()
        .eq('id', data.id);
      
      if (deleteError) {
        console.log('   ⚠️ 清理失败:', deleteError.message);
      } else {
        console.log('   ✅ 测试数据已清理');
      }
    }
  } catch (error) {
    console.log('   ❌ 测试失败:', error.message);
  }

  console.log('\n✅ 测试完成！');
}

testInsert();
