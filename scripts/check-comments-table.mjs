#!/usr/bin/env node
/**
 * 检查 comments 表结构
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('🔍 检查 comments 表结构');
console.log('========================================\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTable() {
  try {
    // 查询表结构
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'comments')
      .eq('table_schema', 'public');

    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }

    console.log('📋 comments 表结构:');
    data.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 查询一条示例数据
    console.log('\n📄 示例数据:');
    const { data: sample, error: sampleError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('   无法获取示例数据:', sampleError.message);
    } else if (sample && sample.length > 0) {
      console.log('   ', JSON.stringify(sample[0], null, 2));
    } else {
      console.log('   表中没有数据');
    }

  } catch (err) {
    console.error('❌ 检查失败:', err.message);
  }
}

checkTable();
