-- 修复 work_comments 表的 work_id 类型，从 INTEGER 改为 UUID
-- 以匹配 works 表的 id 类型

-- 1. 首先检查表是否存在
DO $$
BEGIN
    -- 检查 work_comments 表是否存在
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_comments') THEN
        -- 2. 删除外键约束（如果存在）
        ALTER TABLE public.work_comments 
        DROP CONSTRAINT IF EXISTS work_comments_work_id_fkey;

        -- 3. 删除索引
        DROP INDEX IF EXISTS idx_work_comments_work_id;

        -- 4. 修改 work_id 列类型从 INTEGER 为 UUID
        -- 注意：这会删除现有数据，因为 INTEGER 无法直接转换为 UUID
        TRUNCATE TABLE public.work_comments;

        ALTER TABLE public.work_comments 
        ALTER COLUMN work_id TYPE UUID USING gen_random_uuid();

        -- 5. 添加外键约束指向 works 表
        ALTER TABLE public.work_comments 
        ADD CONSTRAINT work_comments_work_id_fkey 
        FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE;

        -- 6. 重新创建索引
        CREATE INDEX idx_work_comments_work_id ON public.work_comments(work_id);

        RAISE NOTICE 'work_comments 表已修复';
    ELSE
        -- 表不存在，创建新表
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

        CREATE INDEX idx_work_comments_work_id ON public.work_comments(work_id);
        CREATE INDEX idx_work_comments_user_id ON public.work_comments(user_id);
        CREATE INDEX idx_work_comments_parent_id ON public.work_comments(parent_id);
        CREATE INDEX idx_work_comments_created_at ON public.work_comments(created_at DESC);

        ALTER TABLE public.work_comments ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Allow all operations on work_comments"
            ON public.work_comments FOR ALL
            USING (true)
            WITH CHECK (true);

        RAISE NOTICE 'work_comments 表已创建';
    END IF;
END $$;

-- 7. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';
