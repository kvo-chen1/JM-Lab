/**
 * 只插入会话数据
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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function insertSessions() {
  console.log('🚀 插入会话数据...\n');

  const { data: users } = await supabase.from('users').select('id').limit(20);
  const userIds = users?.map(u => u.id) || [];
  console.log(`使用 ${userIds.length} 个用户`);

  let count = 0;
  let errors = 0;
  
  // 为每个用户创建多个会话
  for (let u = 0; u < userIds.length; u++) {
    const userId = userIds[u];
    
    // 每个用户在过去14天内有多个会话
    for (let day = 0; day < 14; day++) {
      // 每天1-3个会话
      const sessionsPerDay = randomInt(1, 3);
      
      for (let s = 0; s < sessionsPerDay; s++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        date.setHours(randomInt(8, 23), randomInt(0, 59), randomInt(0, 59));
        
        const sessionToken = `sess-${userId.substring(0, 8)}-${day}-${s}-${Date.now()}`;
        
        const { error } = await supabase.from('user_sessions').insert({
          user_id: userId,
          session_token: sessionToken,
          ip_address: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          last_active: date.getTime(),
          created_at: date.getTime(),
        });
        
        if (error) {
          errors++;
          if (errors <= 3) console.error('错误:', error.message);
        } else {
          count++;
        }
      }
    }
    
    process.stdout.write(`\r进度: ${u + 1}/${userIds.length} 用户，${count} 条会话${errors > 0 ? `，${errors} 个错误` : ''}`);
  }
  
  console.log(`\n✅ 完成！插入 ${count} 条会话数据`);
}

insertSessions().catch(console.error);
