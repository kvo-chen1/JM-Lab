-- ==========================================================================
-- 修复 metric_type 字段的约束
-- 允许更多的值以匹配前端传入的参数
-- ==========================================================================

-- 修改 metric_type 字段的约束
ALTER TABLE public.promotion_orders 
DROP CONSTRAINT IF EXISTS promotion_orders_metric_type_check;

ALTER TABLE public.promotion_orders 
ADD CONSTRAINT promotion_orders_metric_type_check 
CHECK (metric_type IN ('views', 'fans', 'interactions', 'hot', 'followers', 'engagement', 'heat'));

-- 同时修改 target_type 的约束以匹配前端
ALTER TABLE public.promotion_orders 
DROP CONSTRAINT IF EXISTS promotion_orders_target_type_check;

ALTER TABLE public.promotion_orders 
ADD CONSTRAINT promotion_orders_target_type_check 
CHECK (target_type IN ('account', 'transaction', 'live', 'product'));

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';
