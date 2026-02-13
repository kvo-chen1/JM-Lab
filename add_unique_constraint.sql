-- 添加 event_submissions 表的唯一约束
-- 修复 ON CONFLICT 错误

-- 1. 删除可能存在的旧约束（避免冲突）
ALTER TABLE public.event_submissions 
DROP CONSTRAINT IF EXISTS event_submissions_event_id_user_id_key;

-- 2. 添加唯一约束
ALTER TABLE public.event_submissions 
ADD CONSTRAINT event_submissions_event_id_user_id_key 
UNIQUE (event_id, user_id);

-- 3. 验证约束
SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'event_submissions'
AND tc.constraint_type = 'UNIQUE';
