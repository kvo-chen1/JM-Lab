-- 添加用户头像和封面图片字段到 users 表
-- 执行时间: 2026-02-14

-- 添加 avatar_url 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to users table';
    ELSE
        RAISE NOTICE 'avatar_url column already exists';
    END IF;
END $$;

-- 添加 cover_image 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE public.users ADD COLUMN cover_image TEXT;
        RAISE NOTICE 'Added cover_image column to users table';
    ELSE
        RAISE NOTICE 'cover_image column already exists';
    END IF;
END $$;

-- 更新 handle_new_user 函数，确保同步 avatar_url
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        uuid, 
        username, 
        email, 
        avatar_url,
        cover_image,
        created_at, 
        updated_at,
        is_new_user
    )
    VALUES (
        NEW.id,
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            NEW.raw_user_meta_data->>'name',
            NEW.email
        ),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'cover_image',
        EXTRACT(EPOCH FROM NEW.created_at)::BIGINT * 1000,
        EXTRACT(EPOCH FROM NEW.updated_at)::BIGINT * 1000,
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        cover_image = COALESCE(EXCLUDED.cover_image, public.users.cover_image),
        updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建更新用户头像的函数
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
        updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
    WHERE id = p_user_id;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- 创建获取用户完整信息的 RPC 函数
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    cover_image TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    occupation TEXT,
    phone TEXT,
    age INTEGER,
    interests TEXT[],
    tags TEXT[],
    github TEXT,
    twitter TEXT,
    created_at BIGINT,
    updated_at BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.email,
        u.avatar_url,
        u.cover_image,
        u.bio,
        u.location,
        u.website,
        u.occupation,
        u.phone,
        u.age,
        u.interests,
        u.tags,
        u.github,
        u.twitter,
        u.created_at,
        u.updated_at
    FROM public.users u
    WHERE u.id = p_user_id;
END;
$$;

-- 同步现有用户的 avatar_url 从 auth.users 的 user_metadata
UPDATE public.users u
SET avatar_url = au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
WHERE u.id = au.id
AND (u.avatar_url IS NULL OR u.avatar_url = '')
AND au.raw_user_meta_data->>'avatar_url' IS NOT NULL;

-- 同步现有用户的 cover_image 从 auth.users 的 user_metadata
UPDATE public.users u
SET cover_image = au.raw_user_meta_data->>'cover_image'
FROM auth.users au
WHERE u.id = au.id
AND (u.cover_image IS NULL OR u.cover_image = '')
AND au.raw_user_meta_data->>'cover_image' IS NOT NULL;

COMMENT ON COLUMN public.users.avatar_url IS '用户头像URL';
COMMENT ON COLUMN public.users.cover_image IS '用户封面图片URL';
