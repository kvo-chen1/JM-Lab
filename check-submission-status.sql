-- 检查活动的作品状态
SELECT 
    id,
    event_id,
    title,
    status,
    user_id
FROM public.event_submissions
WHERE event_id = '665f1aab-e2ec-49b8-a691-f0134fac9861';
