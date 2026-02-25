#!/usr/bin/env node
/**
 * 检查 event_participants 表结构
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('🔍 检查 event_participants 表');
console.log('========================================\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTable() {
  try {
    // 查询 event_participants 表数据
    const { data: parts, error } = await supabase
      .from('event_participants')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }

    console.log('📋 event_participants 表数据:');
    console.log('   总条数:', parts?.length || 0);
    
    if (parts && parts.length > 0) {
      console.log('\n   字段:', Object.keys(parts[0]).join(', '));
      console.log('\n   示例数据:');
      parts.forEach((p, i) => {
        console.log(`\n   记录 ${i + 1}:`);
        console.log('   ', JSON.stringify(p, null, 2));
      });
    }

    // 查询 events 表的 participants 字段
    console.log('\n\n📄 查询 events 表:');
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventError) {
      console.log('   ❌ 查询失败:', eventError.message);
    } else if (events && events.length > 0) {
      const e = events[0];
      console.log('   活动标题:', e.title);
      console.log('   participants 字段:', e.participants);
      console.log('   current_participants 字段:', e.current_participants);
    }

  } catch (err) {
    console.error('❌ 检查失败:', err.message);
  }
}

checkTable();
