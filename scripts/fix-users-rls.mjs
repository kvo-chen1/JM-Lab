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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const sql = `
-- 修复 users 表的 RLS 策略，允许已认证用户查看其他用户的基本信息

-- 1. 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all users to view profiles" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.users;

-- 3. 创建新策略 - 允许所有人查看用户基本信息（id, username, avatar_url）
CREATE POLICY "Allow all users to view profiles"
  ON public.users FOR SELECT
  USING (true);

-- 4. 创建策略 - 允许已认证用户更新自己的资料
CREATE POLICY "Allow users to update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 5. 创建策略 - 允许已认证用户插入自己的资料
CREATE POLICY "Allow users to insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
`;

async function fixUsersRLS() {
  console.log('Fixing users table RLS policies...\n');
  
  try {
    // 使用 Supabase 的 rpc 执行 SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error:', error);
      console.log('\nPlease run the SQL manually in Supabase Dashboard SQL Editor');
      console.log('\n=== SQL to run ===\n');
      console.log(sql);
      console.log('\n==================\n');
    } else {
      console.log('✅ Users table RLS policies fixed successfully!');
      console.log('\nNew policies:');
      console.log('- SELECT: Allow all users to view profiles');
      console.log('- UPDATE: Allow users to update own profile');
      console.log('- INSERT: Allow users to insert own profile');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    console.log('\nPlease run the SQL manually in Supabase Dashboard SQL Editor');
    console.log('\n=== SQL to run ===\n');
    console.log(sql);
    console.log('\n==================\n');
  }
}

fixUsersRLS();
