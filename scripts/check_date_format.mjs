/**
 * 检查日期格式问题
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDateFormat() {
  console.log('=== 检查日期格式 ===\n');

  // 获取用户数据
  const { data: users } = await supabase
    .from('users')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('用户 created_at 示例:');
  users?.forEach(user => {
    const date = new Date(user.created_at);
    console.log(`  原始值: ${user.created_at}`);
    console.log(`  Date对象: ${date}`);
    console.log(`  toLocaleDateString('zh-CN', {month:'short', day:'numeric'}): ${date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`);
    console.log('');
  });

  // 获取作品数据
  const { data: works } = await supabase
    .from('works')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('作品 created_at 示例:');
  works?.forEach(work => {
    const date = new Date(work.created_at);
    console.log(`  原始值: ${work.created_at}`);
    console.log(`  Date对象: ${date}`);
    console.log(`  toLocaleDateString('zh-CN', {month:'short', day:'numeric'}): ${date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`);
    console.log('');
  });

  // 检查最近30天的日期匹配
  console.log('\n=== 最近30天日期格式 ===');
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    console.log(`  ${date.toISOString().split('T')[0]} -> ${dateStr}`);
  }
}

checkDateFormat().catch(console.error);
