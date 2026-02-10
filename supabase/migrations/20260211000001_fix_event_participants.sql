-- 修复 event_participants 表结构
-- 确保 id 列存在并且是主键

-- 检查并添加 id 列（如果不存在）
DO $$
BEGIN
    -- 检查 id 列是否存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_participants' 
        AND column_name = 'id'
    ) THEN
        -- 添加 id 列
        ALTER TABLE public.event_participants 
        ADD COLUMN id UUID DEFAULT gen_random_uuid();
        
        -- 设置为主键
        ALTER TABLE public.event_participants 
        ADD PRIMARY KEY (id);
        
        RAISE NOTICE 'Added id column to event_participants';
    ELSE
        RAISE NOTICE 'id column already exists in event_participants';
    END IF;
END $$;

-- 确保其他必要列存在
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 4),
ADD COLUMN IF NOT EXISTS submitted_work_id UUID REFERENCES public.works(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS submission_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ranking INTEGER,
ADD COLUMN IF NOT EXISTS award TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_participants_progress ON public.event_participants(progress);
CREATE INDEX IF NOT EXISTS idx_event_participants_step ON public.event_participants(current_step);
CREATE INDEX IF NOT EXISTS idx_event_participants_submission ON public.event_participants(submitted_work_id);

-- 创建触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 event_participants 表创建触发器
DROP TRIGGER IF EXISTS update_event_participants_updated_at ON public.event_participants;
CREATE TRIGGER update_event_participants_updated_at
    BEFORE UPDATE ON public.event_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
