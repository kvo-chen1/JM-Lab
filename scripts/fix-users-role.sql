-- 手动修复 users 表 role 列
-- 在 Supabase SQL 编辑器中执行此脚本

-- 1. 检查 users 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. 添加 role 列（如果不存在）
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- 3. 更新现有数据
UPDATE public.users 
SET role = COALESCE(role, 'user');

-- 4. 设置当前用户为管理员（可选）
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';

-- 5. 验证结果
SELECT id, email, role 
FROM public.users 
LIMIT 10;
