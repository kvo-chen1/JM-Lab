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
-- 修复 RLS 策略，允许已认证用户插入点赞和收藏数据

-- ============================================
-- 1. 修复 works_likes 表的 RLS 策略
-- ============================================
-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can insert own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Users can delete own works likes" ON public.works_likes;
DROP POLICY IF EXISTS "Allow all operations on works_likes" ON public.works_likes;

-- 启用 RLS
ALTER TABLE public.works_likes ENABLE ROW LEVEL SECURITY;

-- 创建新策略 - 允许所有已认证用户查看
CREATE POLICY "Allow all users to view works_likes"
  ON public.works_likes FOR SELECT
  USING (true);

-- 创建新策略 - 允许已认证用户插入自己的点赞
CREATE POLICY "Allow authenticated users to insert works_likes"
  ON public.works_likes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 创建新策略 - 允许已认证用户删除自己的点赞
CREATE POLICY "Allow authenticated users to delete works_likes"
  ON public.works_likes FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 2. 修复 works_bookmarks 表的 RLS 策略
-- ============================================
-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can insert own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Users can delete own works bookmarks" ON public.works_bookmarks;
DROP POLICY IF EXISTS "Allow all operations on works_bookmarks" ON public.works_bookmarks;

-- 启用 RLS
ALTER TABLE public.works_bookmarks ENABLE ROW LEVEL SECURITY;

-- 创建新策略 - 允许所有已认证用户查看
CREATE POLICY "Allow all users to view works_bookmarks"
  ON public.works_bookmarks FOR SELECT
  USING (true);

-- 创建新策略 - 允许已认证用户插入自己的收藏
CREATE POLICY "Allow authenticated users to insert works_bookmarks"
  ON public.works_bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 创建新策略 - 允许已认证用户删除自己的收藏
CREATE POLICY "Allow authenticated users to delete works_bookmarks"
  ON public.works_bookmarks FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 3. 修复 likes 表的 RLS 策略（社区帖子）
-- ============================================
-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
DROP POLICY IF EXISTS "Allow all operations on likes" ON public.likes;

-- 启用 RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 创建新策略 - 允许所有已认证用户查看
CREATE POLICY "Allow all users to view likes"
  ON public.likes FOR SELECT
  USING (true);

-- 创建新策略 - 允许已认证用户插入自己的点赞
CREATE POLICY "Allow authenticated users to insert likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建新策略 - 允许已认证用户删除自己的点赞
CREATE POLICY "Allow authenticated users to delete likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. 修复 bookmarks 表的 RLS 策略（社区帖子）
-- ============================================
-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Allow all operations on bookmarks" ON public.bookmarks;

-- 启用 RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 创建新策略 - 允许所有已认证用户查看
CREATE POLICY "Allow all users to view bookmarks"
  ON public.bookmarks FOR SELECT
  USING (true);

-- 创建新策略 - 允许已认证用户插入自己的收藏
CREATE POLICY "Allow authenticated users to insert bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 创建新策略 - 允许已认证用户删除自己的收藏
CREATE POLICY "Allow authenticated users to delete bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid()::text = user_id);
`;

async function fixRLS() {
  console.log('Fixing RLS policies...\n');
  
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
      console.log('✅ RLS policies fixed successfully!');
      console.log('\nUpdated policies:');
      console.log('- works_likes: SELECT (all), INSERT/DELETE (authenticated)');
      console.log('- works_bookmarks: SELECT (all), INSERT/DELETE (authenticated)');
      console.log('- likes: SELECT (all), INSERT/DELETE (authenticated)');
      console.log('- bookmarks: SELECT (all), INSERT/DELETE (authenticated)');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    console.log('\nPlease run the SQL manually in Supabase Dashboard SQL Editor');
    console.log('\n=== SQL to run ===\n');
    console.log(sql);
    console.log('\n==================\n');
  }
}

fixRLS();
