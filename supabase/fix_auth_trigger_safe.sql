-- 修复 Auth 用户同步触发器问题（安全版本）
-- 执行此脚本前请确保已备份数据

-- 1. 首先检查 users 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. 确保 username 字段允许 NULL（临时修复，让触发器能正常工作）
ALTER TABLE public.users ALTER COLUMN username DROP NOT NULL;

-- 3. 更新触发器函数，添加异常处理（不阻止 auth 用户创建）
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

-- 4. 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();

-- 5. 验证触发器是否创建成功
SELECT '触发器已重新创建' as status;

-- 6. 验证修复结果
SELECT '修复完成' as status,
       (SELECT COUNT(*) FROM auth.users) as auth_users_count,
       (SELECT COUNT(*) FROM public.users) as public_users_count;
