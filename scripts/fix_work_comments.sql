-- 修复 work_comments 表的 work_id 类型，从 INTEGER 改为 UUID
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 删除外键约束（如果存在）
ALTER TABLE public.work_comments 
DROP CONSTRAINT IF EXISTS work_comments_work_id_fkey;

-- 2. 删除索引
DROP INDEX IF EXISTS idx_work_comments_work_id;

-- 3. 修改 work_id 列类型从 INTEGER 为 UUID
-- 注意：这会删除现有数据，因为 INTEGER 无法直接转换为 UUID
TRUNCATE TABLE public.work_comments;

ALTER TABLE public.work_comments 
ALTER COLUMN work_id TYPE UUID USING gen_random_uuid();

-- 4. 添加外键约束指向 works 表
ALTER TABLE public.work_comments 
ADD CONSTRAINT work_comments_work_id_fkey 
FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE;

-- 5. 重新创建索引
CREATE INDEX idx_work_comments_work_id ON public.work_comments(work_id);

-- 6. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';
