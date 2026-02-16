-- 修复活动状态和时间：将已结束的活动状态设为 completed，并调整结束时间
-- 执行时间: 2026-02-16

-- 更新第一个活动：海河"寻味天津·奶香传承"创意作品大赛
-- 结束时间设为 2025-02-18（已结束），状态设为 completed
UPDATE public.events
SET 
    status = 'completed',
    end_time = '2025-02-18T23:59:59Z',
    final_ranking_published = true,
    final_ranking_published_at = NOW(),
    updated_at = NOW()
WHERE title LIKE '%寻味天津·奶香传承%' 
   OR title LIKE '%奶香传承%'
   OR id = 'b85f1aab-a2bc-490b-a691-40134fac9861';

-- 更新第二个活动：海河牛奶「红西柚新口味包装及宣传语设计大赛」
-- 结束时间设为 2025-06-06（已结束），状态设为 completed
UPDATE public.events
SET 
    status = 'completed',
    end_time = '2025-06-06T23:59:59Z',
    final_ranking_published = true,
    final_ranking_published_at = NOW(),
    updated_at = NOW()
WHERE title LIKE '%红西柚新口味包装%'
   OR title LIKE '%红西柚%'
   OR title LIKE '%西柚%';

-- 更新所有结束时间早于当前时间但状态不是 completed 的活动
UPDATE public.events
SET 
    status = 'completed',
    final_ranking_published = true,
    final_ranking_published_at = NOW(),
    updated_at = NOW()
WHERE end_time < NOW()
  AND status != 'completed'
  AND status != 'draft';

-- 添加注释
COMMENT ON TABLE public.events IS '活动表，包含活动基本信息和状态';
