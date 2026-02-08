-- 修复 Auth 用户同步触发器问题
-- 执行此脚本前请确保已备份数据

-- 1. 检查 users 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. 确保 public.users.id 是 UUID 类型（与 auth.users.id 匹配）
DO $$
BEGIN
  -- 检查 id 列的类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'id'
    AND data_type != 'uuid'
  ) THEN
    -- 如果 id 不是 UUID 类型，需要修改
    -- 注意：这可能会导致数据丢失，请确保已备份
    RAISE NOTICE '注意：public.users.id 列类型需要修改为 UUID';
  END IF;
END $$;

-- 3. 确保 username 字段允许 NULL（临时修复，让触发器能正常工作）
ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;

-- 4. 更新触发器函数，确保 username 有默认值，并添加异常处理
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
      split_part(NEW.email, '@', 1),
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, public.users.username),
    avatar_url = EXCLUDED.avatar_url,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止 auth 用户创建
    RAISE WARNING 'handle_new_user trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();

-- 6. 为现有 auth 用户创建 public.users 记录（如果缺失）
-- 使用显式类型转换避免类型不匹配
INSERT INTO public.users (id, email, username, avatar_url, metadata, created_at, updated_at)
SELECT 
  au.id::uuid,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'username',
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1),
    'user_' || substr(au.id::text, 1, 8)
  ),
  au.raw_user_meta_data->>'avatar_url',
  COALESCE(au.raw_user_meta_data, '{}'::jsonb),
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id::uuid = pu.id
WHERE pu.id IS NULL;

-- 7. 验证修复结果
SELECT '修复完成' as status,
       (SELECT COUNT(*) FROM auth.users) as auth_users_count,
       (SELECT COUNT(*) FROM public.users) as public_users_count;
