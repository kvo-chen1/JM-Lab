#!/usr/bin/env node
/**
 * 检查活动相关表结构
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('🔍 检查活动相关表');
console.log('========================================\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTables() {
  try {
    // 查询所有表名
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .ilike('table_name', '%event%');

    if (error) {
      console.error('❌ 查询失败:', error.message);
    } else {
      console.log('📋 活动相关表:');
      tables.forEach(t => {
        console.log(`   - ${t.table_name}`);
      });
    }

    // 尝试查询 event_registrations
    console.log('\n📄 查询 event_registrations 表:');
    const { data: regs, error: regError } = await supabase
      .from('event_registrations')
      .select('*')
      .limit(2);

    if (regError) {
      console.log('   ❌ 表不存在或无法访问:', regError.message);
    } else {
      console.log('   ✅ 表存在，数据条数:', regs?.length || 0);
      if (regs && regs.length > 0) {
        console.log('   示例数据:', JSON.stringify(regs[0], null, 2));
      }
    }

    // 尝试查询 events 表
    console.log('\n📄 查询 events 表:');
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventError) {
      console.log('   ❌ 表不存在:', eventError.message);
    } else {
      console.log('   ✅ 表存在，数据条数:', events?.length || 0);
      if (events && events.length > 0) {
        console.log('   字段:', Object.keys(events[0]).join(', '));
      }
    }

    // 尝试查询 event_participants
    console.log('\n📄 查询 event_participants 表:');
    const { data: parts, error: partError } = await supabase
      .from('event_participants')
      .select('*')
      .limit(2);

    if (partError) {
      console.log('   ❌ 表不存在:', partError.message);
    } else {
      console.log('   ✅ 表存在，数据条数:', parts?.length || 0);
    }

    // 尝试查询 works 表中的 event_id
    console.log('\n📄 查询 works 表中的活动相关数据:');
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('id, title, event_id, creator_id')
      .not('event_id', 'is', null)
      .limit(3);

    if (worksError) {
      console.log('   ❌ 查询失败:', worksError.message);
    } else {
      console.log('   ✅ 找到', works?.length || 0, '条关联活动的作品');
      if (works && works.length > 0) {
        works.forEach(w => {
          console.log(`   - ${w.title} (event_id: ${w.event_id})`);
        });
      }
    }

  } catch (err) {
    console.error('❌ 检查失败:', err.message);
  }
}

checkTables();
