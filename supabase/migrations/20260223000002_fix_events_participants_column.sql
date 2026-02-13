-- 修复 events 表的列问题
-- 问题1：数据库函数使用 current_participants，但前端代码使用 participants
-- 问题2：updated_at 列类型可能是 bigint 而不是 TIMESTAMPTZ

-- 0. 首先修复 updated_at 列类型问题
DO $$
BEGIN
    -- 检查 updated_at 列的类型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'updated_at'
        AND data_type = 'bigint'
    ) THEN
        -- 先删除默认值
        ALTER TABLE public.events ALTER COLUMN updated_at DROP DEFAULT;
        -- 修改列类型
        ALTER TABLE public.events ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
        USING to_timestamp(updated_at / 1000);
        -- 重新添加默认值
        ALTER TABLE public.events ALTER COLUMN updated_at SET DEFAULT NOW();
        RAISE NOTICE 'Fixed updated_at column type from bigint to TIMESTAMPTZ';
    END IF;
END $$;

-- 方案：确保两个列都存在，并保持同步

-- 1. 检查并添加 participants 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'participants'
    ) THEN
        ALTER TABLE public.events ADD COLUMN participants INTEGER DEFAULT 0;
        RAISE NOTICE 'Added participants column';
    END IF;
END $$;

-- 2. 检查并添加 current_participants 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'current_participants'
    ) THEN
        ALTER TABLE public.events ADD COLUMN current_participants INTEGER DEFAULT 0;
        RAISE NOTICE 'Added current_participants column';
    END IF;
END $$;

-- 3. 同步两个列的数据（以 participants 为准）
UPDATE public.events 
SET current_participants = participants 
WHERE current_participants IS NULL OR current_participants != participants;

UPDATE public.events 
SET participants = current_participants 
WHERE participants IS NULL OR participants != current_participants;

-- 4. 创建触发器函数来保持两个列同步
CREATE OR REPLACE FUNCTION public.sync_participants_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.participants := COALESCE(NEW.participants, 0);
        NEW.current_participants := NEW.participants;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.participants IS DISTINCT FROM OLD.participants THEN
            NEW.current_participants := NEW.participants;
        ELSIF NEW.current_participants IS DISTINCT FROM OLD.current_participants THEN
            NEW.participants := NEW.current_participants;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS sync_participants_trigger ON public.events;

-- 6. 创建触发器
CREATE TRIGGER sync_participants_trigger
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_participants_columns();

-- 7. 更新 register_for_event_transaction 函数，使用 participants 列
CREATE OR REPLACE FUNCTION public.register_for_event_transaction(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_status TEXT;
    v_current INTEGER;
    v_max INTEGER;
    v_registration_id UUID;
BEGIN
    -- Lock the event row for update to prevent race conditions
    SELECT status, participants, max_participants 
    INTO v_event_status, v_current, v_max
    FROM public.events 
    WHERE id = p_event_id 
    FOR UPDATE;
    
    -- Check if event exists
    IF v_event_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event not found');
    END IF;
    
    -- Check if event is published
    IF v_event_status != 'published' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event is not open for registration');
    END IF;
    
    -- Check if user is already registered
    IF EXISTS (
        SELECT 1 FROM public.event_participants 
        WHERE event_id = p_event_id AND user_id = p_user_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User already registered');
    END IF;
    
    -- Check if event is full
    IF v_max IS NOT NULL AND v_current >= v_max THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event is full');
    END IF;
    
    -- Create registration
    INSERT INTO public.event_participants (event_id, user_id, status)
    VALUES (p_event_id, p_user_id, 'registered')
    RETURNING id INTO v_registration_id;
    
    -- Increment participant count
    UPDATE public.events 
    SET participants = participants + 1,
        updated_at = NOW()
    WHERE id = p_event_id;
    
    RETURN jsonb_build_object('success', true, 'registration_id', v_registration_id);
END;
$$;

-- 添加注释
COMMENT ON FUNCTION public.register_for_event_transaction IS 'Registers a user for an event with transaction safety';

-- 8. 更新其他可能使用 current_participants 的函数
-- 检查并更新 increment_event_participants 函数（如果存在）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'increment_event_participants'
    ) THEN
        EXECUTE '
            CREATE OR REPLACE FUNCTION public.increment_event_participants(p_event_id UUID)
            RETURNS VOID
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $func$
            BEGIN
                UPDATE public.events 
                SET participants = COALESCE(participants, 0) + 1,
                    updated_at = NOW()
                WHERE id = p_event_id;
            END;
            $func$;
        ';
        RAISE NOTICE 'Updated increment_event_participants function';
    END IF;
END $$;

-- 9. 确保 max_participants 列也存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'max_participants'
    ) THEN
        ALTER TABLE public.events ADD COLUMN max_participants INTEGER;
    END IF;
END $$;
