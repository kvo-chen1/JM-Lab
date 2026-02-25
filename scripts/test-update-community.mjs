#!/usr/bin/env node
/**
 * 测试更新社群状态
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('🔍 测试更新社群状态');
console.log('========================================\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUpdate() {
  try {
    // 查询 AI交流群
    const { data: community, error: fetchError } = await supabase
      .from('communities')
      .select('*')
      .eq('name', 'AI交流群')
      .single();

    if (fetchError) {
      console.error('❌ 查询失败:', fetchError.message);
      return;
    }

    console.log('📋 当前状态:');
    console.log('   - ID:', community.id);
    console.log('   - 名称:', community.name);
    console.log('   - is_active:', community.is_active);

    // 尝试更新状态
    const newStatus = !community.is_active;
    console.log('\n📝 尝试更新 is_active 为:', newStatus);

    const { error: updateError } = await supabase
      .from('communities')
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq('id', community.id);

    if (updateError) {
      console.error('❌ 更新失败:', updateError.message);
      return;
    }

    console.log('✅ 更新成功');

    // 验证更新
    const { data: updated, error: verifyError } = await supabase
      .from('communities')
      .select('is_active')
      .eq('id', community.id)
      .single();

    if (verifyError) {
      console.error('❌ 验证失败:', verifyError.message);
      return;
    }

    console.log('📋 更新后状态:');
    console.log('   - is_active:', updated.is_active);

    // 恢复原始状态
    const { error: restoreError } = await supabase
      .from('communities')
      .update({ is_active: community.is_active, updated_at: new Date().toISOString() })
      .eq('id', community.id);

    if (restoreError) {
      console.error('❌ 恢复失败:', restoreError.message);
      return;
    }

    console.log('✅ 已恢复原始状态');

  } catch (err) {
    console.error('❌ 测试失败:', err.message);
  }
}

testUpdate();
