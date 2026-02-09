-- 批次 2：删除天津特色相关表格
-- 请在 Supabase SQL Editor 中执行

DROP TABLE IF EXISTS public.tianjin_hotspots CASCADE;
DROP TABLE IF EXISTS public.tianjin_offline_experiences CASCADE;
DROP TABLE IF EXISTS public.tianjin_templates CASCADE;
DROP TABLE IF EXISTS public.tianjin_traditional_brands CASCADE;

SELECT 'Batch 2 completed: 4 tables dropped' as status;
