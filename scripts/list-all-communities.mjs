#!/usr/bin/env node
/**
 * 列出所有社群
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('📋 所有社群列表');
console.log('========================================\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listCommunities() {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }

    console.log(`共 ${data.length} 个社群:\n`);
    data.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   is_active: ${c.is_active}`);
      console.log(`   created_at: ${c.created_at}`);
      console.log('');
    });

  } catch (err) {
    console.error('❌ 错误:', err.message);
  }
}

listCommunities();
