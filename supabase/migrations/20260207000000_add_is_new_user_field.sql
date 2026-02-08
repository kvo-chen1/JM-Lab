-- 添加 is_new_user 字段到 users 表
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_new_user BOOLEAN NOT NULL DEFAULT TRUE;

-- 更新触发器：新用户默认 is_new_user = true
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    username,
    avatar_url,
    metadata,
    is_new_user,
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
    TRUE, -- 新用户默认需要完善资料
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新现有用户：如果用户已经有完整的 username 和 avatar_url，则标记为不是新用户
UPDATE public.users 
SET is_new_user = FALSE 
WHERE username IS NOT NULL 
  AND username != '' 
  AND avatar_url IS NOT NULL 
  AND avatar_url != '';
