-- ==========================================================================
-- 修复 promotion_orders 表的 work_id 列类型
-- ==========================================================================

-- 1. 首先检查当前列类型
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'promotion_orders' 
AND column_name = 'work_id';

-- 2. 删除可能依赖 work_id 列的外键约束
ALTER TABLE public.promotion_orders 
DROP CONSTRAINT IF EXISTS promotion_orders_work_id_fkey;

-- 3. 删除可能依赖此列的视图
DROP VIEW IF EXISTS public.user_promotion_orders CASCADE;
DROP VIEW IF EXISTS public.promotion_order_details CASCADE;

-- 4. 强制修改列类型为 TEXT
ALTER TABLE public.promotion_orders 
ALTER COLUMN work_id TYPE TEXT USING work_id::TEXT;

-- 5. 验证修改结果
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'promotion_orders' 
AND column_name = 'work_id';
