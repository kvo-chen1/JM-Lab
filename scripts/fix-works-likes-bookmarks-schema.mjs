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
-- 修改 works_bookmarks 和 works_likes 表，将 work_id 从 INTEGER 改为 TEXT 以支持 UUID

-- ============================================
-- 1. 修改 works_bookmarks 表
-- ============================================
-- 删除旧表（如果存在数据，请先备份）
DROP TABLE IF EXISTS public.works_bookmarks CASCADE;

-- 创建新的 works_bookmarks 表，work_id 使用 TEXT 类型
CREATE TABLE public.works_bookmarks (
  user_id TEXT NOT NULL,
  work_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

-- 创建索引
CREATE INDEX idx_works_bookmarks_user_id ON public.works_bookmarks(user_id);
CREATE INDEX idx_works_bookmarks_work_id ON public.works_bookmarks(work_id);

-- 启用 RLS
ALTER TABLE public.works_bookmarks ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own works bookmarks"
  ON public.works_bookmarks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own works bookmarks"
  ON public.works_bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own works bookmarks"
  ON public.works_bookmarks FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 2. 修改 works_likes 表
-- ============================================
-- 删除旧表（如果存在数据，请先备份）
DROP TABLE IF EXISTS public.works_likes CASCADE;

-- 创建新的 works_likes 表，work_id 使用 TEXT 类型
CREATE TABLE public.works_likes (
  user_id TEXT NOT NULL,
  work_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

-- 创建索引
CREATE INDEX idx_works_likes_user_id ON public.works_likes(user_id);
CREATE INDEX idx_works_likes_work_id ON public.works_likes(work_id);

-- 启用 RLS
ALTER TABLE public.works_likes ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own works likes"
  ON public.works_likes FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own works likes"
  ON public.works_likes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own works likes"
  ON public.works_likes FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 3. 添加注释
-- ============================================
COMMENT ON TABLE public.works_bookmarks IS '广场作品收藏表';
COMMENT ON TABLE public.works_likes IS '广场作品点赞表';
`;

async function fixSchema() {
  console.log('Fixing works_bookmarks and works_likes schema...');
  console.log('Changing work_id from INTEGER to TEXT to support UUID...\n');
  
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
      console.log('works_bookmarks.work_id is now TEXT type');
      console.log('works_likes.work_id is now TEXT type');
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
