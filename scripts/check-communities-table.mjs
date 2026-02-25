#!/usr/bin/env node
/**
 * 检查 communities 表结构
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('🔍 检查 communities 表');
console.log('========================================\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTable() {
  try {
    // 查询 communities 表数据
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }

    console.log('📋 communities 表数据:');
    console.log('   总条数:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('\n   字段:', Object.keys(data[0]).join(', '));
      console.log('\n   示例数据:');
      data.forEach((c, i) => {
        console.log(`\n   记录 ${i + 1}:`);
        console.log('   - ID:', c.id);
        console.log('   - 名称:', c.name);
        console.log('   - is_active:', c.is_active);
        console.log('   - status:', c.status);
        console.log('   - created_at:', c.created_at);
      });
    }

  } catch (err) {
    console.error('❌ 检查失败:', err.message);
  }
}

checkTable();
