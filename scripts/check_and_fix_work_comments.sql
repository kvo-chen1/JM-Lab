-- 检查和修复 work_comments 表
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- 1. 首先检查表是否存在
DO $$
DECLARE
    table_exists BOOLEAN;
    work_id_type TEXT;
    has_likes_count BOOLEAN;
BEGIN
    -- 检查表是否存在
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'work_comments'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'work_comments 表不存在，需要创建';
        
        -- 创建表
        CREATE TABLE public.work_comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            parent_id UUID REFERENCES public.work_comments(id) ON DELETE CASCADE,
            likes_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- 创建索引
        CREATE INDEX idx_work_comments_work_id ON public.work_comments(work_id);
        CREATE INDEX idx_work_comments_user_id ON public.work_comments(user_id);
        CREATE INDEX idx_work_comments_parent_id ON public.work_comments(parent_id);
        CREATE INDEX idx_work_comments_created_at ON public.work_comments(created_at DESC);
        
        -- 启用 RLS
        ALTER TABLE public.work_comments ENABLE ROW LEVEL SECURITY;
        
        -- 创建策略
        CREATE POLICY "Allow all operations on work_comments"
            ON public.work_comments FOR ALL
            USING (true)
            WITH CHECK (true);
            
        RAISE NOTICE 'work_comments 表已创建';
    ELSE
        RAISE NOTICE 'work_comments 表存在，检查结构...';
        
        -- 检查 work_id 类型
        SELECT data_type INTO work_id_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'work_comments' 
          AND column_name = 'work_id';
        
        RAISE NOTICE 'work_id 类型: %', work_id_type;
        
        -- 检查 likes_count 列是否存在
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' 
              AND table_name = 'work_comments' 
              AND column_name = 'likes_count'
        ) INTO has_likes_count;
        
        RAISE NOTICE 'likes_count 列存在: %', has_likes_count;
        
        -- 如果 work_id 是 INTEGER，需要修改
        IF work_id_type = 'integer' OR work_id_type = 'bigint' THEN
            RAISE NOTICE 'work_id 是 INTEGER 类型，需要修改为 UUID';
            
            -- 删除外键约束
            ALTER TABLE public.work_comments 
            DROP CONSTRAINT IF EXISTS work_comments_work_id_fkey;
            
            -- 删除索引
            DROP INDEX IF EXISTS idx_work_comments_work_id;
            
            -- 清空表数据
            TRUNCATE TABLE public.work_comments;
            
            -- 修改列类型
            ALTER TABLE public.work_comments 
            ALTER COLUMN work_id TYPE UUID USING gen_random_uuid();
            
            -- 添加外键
            ALTER TABLE public.work_comments 
            ADD CONSTRAINT work_comments_work_id_fkey 
            FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE;
            
            -- 重新创建索引
            CREATE INDEX idx_work_comments_work_id ON public.work_comments(work_id);
            
            RAISE NOTICE 'work_id 已修改为 UUID 类型';
        END IF;
        
        -- 如果没有 likes_count 列，添加它
        IF NOT has_likes_count THEN
            RAISE NOTICE '添加 likes_count 列';
            ALTER TABLE public.work_comments 
            ADD COLUMN likes_count INTEGER DEFAULT 0;
        END IF;
    END IF;
END $$;

-- 2. 验证表结构
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'work_comments'
ORDER BY ordinal_position;

-- 3. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';
