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
  // 先获取一个真实用户ID
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users?.[0]?.id || 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';
  
  console.log('使用用户ID:', userId);
  
  // 测试插入单条数据到 user_sessions
  const testSession = {
    user_id: userId,
    session_token: 'test-token-' + Date.now(),
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    last_active: Date.now(),
    created_at: Date.now(),
  };
  
  console.log('插入数据:', JSON.stringify(testSession, null, 2));
  
  const { data, error } = await supabase
    .from('user_sessions')
    .insert(testSession)
    .select();
  
  if (error) {
    console.error('插入错误:', JSON.stringify(error, null, 2));
  } else {
    console.log('插入成功:', data);
  }
}

test();
