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
-- 修复 likes 表，将 post_id 改为 UUID 类型

-- 1. 删除旧表（如果存在数据，请先备份）
DROP TABLE IF EXISTS public.likes CASCADE;

-- 2. 创建新的 likes 表，post_id 使用 UUID 类型
CREATE TABLE public.likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- 3. 创建索引
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_post_id ON public.likes(post_id);

-- 4. 启用 RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 5. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

-- 6. 创建新策略
CREATE POLICY "Users can view own likes"
  ON public.likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- 7. 添加注释
COMMENT ON TABLE public.likes IS '社区帖子点赞表';
`;

async function fixSchema() {
  console.log('Fixing likes table schema...');
  console.log('Changing post_id from INTEGER to UUID...\n');
  
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
      console.log('Schema fixed successfully!');
      console.log('likes.post_id is now UUID type');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    console.log('\nPlease run the SQL manually in Supabase Dashboard SQL Editor');
    console.log('\n=== SQL to run ===\n');
    console.log(sql);
    console.log('\n==================\n');
  }
}

fixSchema();
