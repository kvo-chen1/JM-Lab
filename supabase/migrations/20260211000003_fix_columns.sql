-- 修复 event_participants 表列
-- 确保所有必要的列都存在

-- 添加缺失的列（使用 IF NOT EXISTS）
DO $$
BEGIN
    -- 检查并添加 created_at 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- 检查并添加 updated_at 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- 检查并添加 registration_date 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'registration_date'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN registration_date TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- 检查并添加 progress 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'progress'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN progress INTEGER DEFAULT 0;
    END IF;

    -- 检查并添加 current_step 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'current_step'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN current_step INTEGER DEFAULT 1;
    END IF;

    -- 检查并添加 submission_date 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'submission_date'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN submission_date TIMESTAMPTZ;
    END IF;

    -- 检查并添加 ranking 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'ranking'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN ranking INTEGER;
    END IF;

    -- 检查并添加 award 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'award'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN award TEXT;
    END IF;

    -- 检查并添加 notes 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN notes TEXT;
    END IF;

    -- 检查并添加 submission_data 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'submission_data'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN submission_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    RAISE NOTICE 'All columns checked and added if missing';
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_participants_progress ON public.event_participants(progress);
CREATE INDEX IF NOT EXISTS idx_event_participants_step ON public.event_participants(current_step);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_event_participants_updated_at ON public.event_participants;
CREATE TRIGGER update_event_participants_updated_at
    BEFORE UPDATE ON public.event_participants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
