/**
 * 调试插入问题
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

async function debug() {
  // 获取用户ID
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users?.[0]?.id;
  console.log('用户ID:', userId);

  // 测试插入会话
  const now = new Date();
  const sessionData = {
    user_id: userId,
    session_token: 'test-' + Date.now(),
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    last_active: now.getTime(),
    created_at: now.getTime(),
  };
  
  console.log('插入数据:', sessionData);
  
  const { data, error } = await supabase
    .from('user_sessions')
    .insert(sessionData)
    .select();
  
  if (error) {
    console.error('插入错误:', error);
  } else {
    console.log('插入成功:', data);
  }
}

debug();
