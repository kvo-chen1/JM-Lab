-- 检查活动日期
SELECT 
    id,
    title,
    start_time,
    end_time,
    status,
    created_at
FROM public.events
WHERE title LIKE '%红西柚%'
LIMIT 1;
