import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从 .env.local 读取配置
const envLocalPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = '';
let supabaseServiceKey = '';

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim();
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsersRLS() {
  console.log('Checking users table RLS policies...\n');
  
  // 1. 检查 users 表的 RLS 策略
  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'users');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Policies found:', policies.length);
  policies.forEach(p => {
    console.log(`\n  - ${p.policyname}:`);
    console.log(`    Action: ${p.action}`);
    console.log(`    Using: ${p.qual}`);
    console.log(`    With check: ${p.with_check}`);
  });
  
  // 2. 检查 RLS 是否启用
  console.log('\n2. Checking if RLS is enabled...');
  const { data: rlsStatus, error: rlsError } = await supabase
    .rpc('exec_sql', {
      sql: `SELECT relrowsecurity FROM pg_class WHERE relname = 'users';`
    });
  
  if (rlsError) {
    console.error('   Error:', rlsError.message);
  } else {
    console.log('   RLS enabled:', rlsStatus);
  }
  
  console.log('\n✓ Check complete!');
}

checkUsersRLS();
