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

async function test() {
  // 测试 user_sessions 表
  console.log('测试 user_sessions 表...');
  const { data: sessionData, error: sessionError } = await supabase
    .from('user_sessions')
    .select('*')
    .limit(1);
  
  if (sessionError) {
    console.error('user_sessions 错误:', sessionError);
  } else {
    console.log('user_sessions 表存在, 数据样例:', sessionData);
  }

  // 测试 membership_orders 表
  console.log('\n测试 membership_orders 表...');
  const { data: orderData, error: orderError } = await supabase
    .from('membership_orders')
    .select('*')
    .limit(1);
  
  if (orderError) {
    console.error('membership_orders 错误:', orderError);
  } else {
    console.log('membership_orders 表存在, 数据样例:', orderData);
  }

  // 测试插入单条数据到 user_sessions
  console.log('\n测试插入 user_sessions...');
  const { data: insertData, error: insertError } = await supabase
    .from('user_sessions')
    .insert({
      user_id: 'f3dedf79-5c5e-40fd-9513-d0fb0995d429',
      session_token: 'test-token-123',
      ip_address: '192.168.1.1',
      user_agent: 'Test',
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select();
  
  if (insertError) {
    console.error('插入错误:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('插入成功:', insertData);
  }
}

test();
