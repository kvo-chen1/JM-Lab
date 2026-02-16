-- 检查所有红西柚相关的活动
SELECT 
    id,
    title,
    start_time,
    end_time,
    status,
    created_at
FROM public.events
WHERE title ILIKE '%红西柚%' OR title ILIKE '%西柚%'
ORDER BY created_at DESC;
