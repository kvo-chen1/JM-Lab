/**
 * 检查表约束
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  // 检查 user_sessions 表结构
  console.log('检查 user_sessions 表...');
  
  // 尝试插入一条简单数据
  const testId = 'test-' + Date.now();
  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: '78340927-c853-4978-a90f-f54d7c6883d2',
      session_token: testId,
      created_at: Date.now(),
      last_active: Date.now(),
    })
    .select();
  
  if (error) {
    console.error('插入失败:', JSON.stringify(error, null, 2));
  } else {
    console.log('插入成功:', data);
    
    // 清理测试数据
    await supabase.from('user_sessions').delete().eq('session_token', testId);
    console.log('测试数据已清理');
  }
}

check();
