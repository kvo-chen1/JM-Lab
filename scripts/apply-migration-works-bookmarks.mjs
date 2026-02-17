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
-- 创建广场作品收藏和点赞表
-- 修复：我的收藏页面无法显示数据的问题

-- ============================================
-- 1. 创建 works_bookmarks 表（广场作品收藏）
-- ============================================
CREATE TABLE IF NOT EXISTS public.works_bookmarks (
  user_id TEXT NOT NULL,
  work_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_works_bookmarks_user_id ON public.works_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_works_bookmarks_work_id ON public.works_bookmarks(work_id);

-- 启用 RLS
ALTER TABLE public.works_bookmarks ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations on works_bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can view own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can insert own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can delete own works bookmarks" ON public.works_bookmarks;

-- 创建新策略
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
-- 2. 创建 works_likes 表（广场作品点赞）
-- ============================================
CREATE TABLE IF NOT EXISTS public.works_likes (
  user_id TEXT NOT NULL,
  work_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_works_likes_user_id ON public.works_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_works_likes_work_id ON public.works_likes(work_id);

-- 启用 RLS
ALTER TABLE public.works_likes ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations on works_likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can view own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can insert own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can delete own works likes" ON public.works_likes;

-- 创建新策略
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

async function applyMigration() {
  console.log('Applying migration: create works_bookmarks and works_likes tables...');
  
  try {
    // 使用 Supabase 的 rpc 执行 SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      
      // 如果 exec_sql 函数不存在，尝试直接查询
      console.log('Trying alternative method...');
      
      // 检查表是否存在
      const { data: tables, error: listError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'works_bookmarks');
      
      if (listError) {
        console.error('Error listing tables:', listError);
        process.exit(1);
      }
      
      if (tables && tables.length > 0) {
        console.log('works_bookmarks table already exists');
      } else {
        console.log('works_bookmarks table does not exist');
        console.log('Please run the SQL manually in Supabase Dashboard SQL Editor');
        console.log('\n=== SQL to run ===\n');
        console.log(sql);
        console.log('\n==================\n');
      }
    } else {
      console.log('Migration applied successfully!');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    console.log('\nPlease run the SQL manually in Supabase Dashboard SQL Editor');
    console.log('\n=== SQL to run ===\n');
    console.log(sql);
    console.log('\n==================\n');
  }
}

applyMigration();
