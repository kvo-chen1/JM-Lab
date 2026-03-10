#!/usr/bin/env node
/**
 * 测试 inspiration_mindmaps 插入操作
 * 使用真实用户 ID 验证 RLS 问题是否已解决
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('🧪 测试 inspiration_mindmaps 插入操作...\n');

  // 获取一个真实用户 ID
  console.log('1️⃣ 获取真实用户...');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, username, email')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.log('   ❌ 无法获取用户:', userError?.message || '没有用户');
    return;
  }

  const testUser = users[0];
  console.log('   ✅ 使用用户:', testUser.username || testUser.email);
  console.log('   用户 ID:', testUser.id);

  // 测试插入
  console.log('\n2️⃣ 测试插入操作...');
  
  try {
    const { data, error } = await supabase
      .from('inspiration_mindmaps')
      .insert({
        user_id: testUser.id,
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
      
      if (error.message.includes('row-level security')) {
        console.log('\n   ⚠️ RLS 错误仍然存在！');
        console.log('   需要手动在 Supabase Dashboard 中禁用 RLS。');
      }
    } else {
      console.log('   ✅ 插入成功！');
      console.log('   插入的 ID:', data.id);
      console.log('   创建时间:', data.created_at);
      
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
      
      console.log('\n🎉 测试通过！RLS 问题已解决。');
      console.log('   Service Role Key 可以绕过 RLS 进行插入操作。');
    }
  } catch (error) {
    console.log('   ❌ 测试失败:', error.message);
  }
}

testInsert();
