-- 检查活动参与者
SELECT 
    ep.id,
    ep.event_id,
    ep.user_id,
    ep.status,
    ep.current_step,
    ep.progress
FROM public.event_participants ep
WHERE ep.event_id = '665f1aab-e2ec-49b8-a691-f0134fac9861';
