// 修复 bookmarks 表的 post_id 类型
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBookmarksTable() {
  console.log('开始修复 bookmarks 表...');

  try {
    // 1. 删除旧的 bookmarks 表
    console.log('1. 删除旧的 bookmarks 表...');
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'DROP TABLE IF EXISTS public.bookmarks CASCADE;'
    });

    if (dropError) {
      console.log('删除旧表失败（可能不存在）:', dropError.message);
    } else {
      console.log('旧表已删除');
    }

    // 2. 创建新的 bookmarks 表
    console.log('2. 创建新的 bookmarks 表...');
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.bookmarks (
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, post_id)
        );

        CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
        CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON public.bookmarks(post_id);

        ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own bookmarks"
          ON public.bookmarks FOR SELECT
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own bookmarks"
          ON public.bookmarks FOR INSERT
          WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete own bookmarks"
          ON public.bookmarks FOR DELETE
          USING (auth.uid() = user_id);
      `
    });

    if (createError) {
      console.error('创建新表失败:', createError);
      return;
    }

    console.log('bookmarks 表修复完成！');
  } catch (error) {
    console.error('修复失败:', error);
  }
}

fixBookmarksTable();
