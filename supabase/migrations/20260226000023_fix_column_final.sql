-- ==========================================================================
-- 修复 promotion_orders 表的 work_id 列类型 - 最终版
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

-- 2. 删除所有可能依赖 work_id 列的视图
DROP VIEW IF EXISTS public.promotion_orders_detail CASCADE;
DROP VIEW IF EXISTS public.user_promotion_orders CASCADE;
DROP VIEW IF EXISTS public.promotion_order_details CASCADE;
DROP VIEW IF EXISTS public.v_promotion_orders CASCADE;

-- 3. 删除可能依赖此列的规则
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT rulename, tablename 
        FROM pg_rules 
        WHERE tablename = 'promotion_orders'
    LOOP
        EXECUTE format('DROP RULE IF EXISTS %I ON public.promotion_orders', r.rulename);
    END LOOP;
END $$;

-- 4. 删除外键约束
ALTER TABLE public.promotion_orders 
DROP CONSTRAINT IF EXISTS promotion_orders_work_id_fkey;

-- 5. 强制修改列类型为 TEXT
ALTER TABLE public.promotion_orders 
ALTER COLUMN work_id TYPE TEXT USING work_id::TEXT;

-- 6. 验证修改结果
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'promotion_orders' 
AND column_name = 'work_id';
