-- 修复 users 表的时间戳字段类型
-- 问题：某些迁移文件将 updated_at/created_at 改为 BIGINT，但代码中使用的是 TIMESTAMPTZ
-- 这导致新用户创建时出现类型不匹配错误

-- 检查并修复 users 表的 created_at 字段
DO $$
BEGIN
    -- 检查 created_at 是否为 bigint 类型
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'created_at'
        AND data_type = 'bigint'
    ) THEN
        -- 先删除默认值
        ALTER TABLE public.users 
        ALTER COLUMN created_at DROP DEFAULT;
        
        -- 将 bigint 转换为 TIMESTAMPTZ
        ALTER TABLE public.users 
        ALTER COLUMN created_at TYPE TIMESTAMPTZ 
        USING to_timestamp(created_at / 1000.0);
        
        -- 重新添加默认值
        ALTER TABLE public.users 
        ALTER COLUMN created_at SET DEFAULT NOW();
        
        RAISE NOTICE 'Fixed users.created_at column type from BIGINT to TIMESTAMPTZ';
    ELSE
        RAISE NOTICE 'users.created_at column is already correct type or does not exist';
    END IF;
END $$;

-- 检查并修复 users 表的 updated_at 字段
DO $$
BEGIN
    -- 检查 updated_at 是否为 bigint 类型
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'updated_at'
        AND data_type = 'bigint'
    ) THEN
        -- 先删除默认值
        ALTER TABLE public.users 
        ALTER COLUMN updated_at DROP DEFAULT;
        
        -- 将 bigint 转换为 TIMESTAMPTZ
        ALTER TABLE public.users 
        ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
        USING to_timestamp(updated_at / 1000.0);
        
        -- 重新添加默认值
        ALTER TABLE public.users 
        ALTER COLUMN updated_at SET DEFAULT NOW();
        
        RAISE NOTICE 'Fixed users.updated_at column type from BIGINT to TIMESTAMPTZ';
    ELSE
        RAISE NOTICE 'users.updated_at column is already correct type or does not exist';
    END IF;
END $$;

-- 重新创建 updated_at 触发器（如果不存在）
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 修复 handle_new_user 函数，使用 NOW() 而不是 BIGINT 时间戳
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        username,
        avatar_url,
        metadata,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 修复 update_user_avatar 函数，使用 NOW() 而不是 BIGINT 时间戳
CREATE OR REPLACE FUNCTION public.update_user_avatar(
    p_user_id UUID,
    p_avatar_url TEXT,
    p_cover_image TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users
    SET 
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        cover_image = COALESCE(p_cover_image, cover_image),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- 修复 get_user_profile 函数，返回正确的类型
DROP FUNCTION IF EXISTS public.get_user_profile(UUID);

-- 添加注释
COMMENT ON COLUMN public.users.created_at IS '用户创建时间 (TIMESTAMPTZ)';
COMMENT ON COLUMN public.users.updated_at IS '用户更新时间 (TIMESTAMPTZ)';
