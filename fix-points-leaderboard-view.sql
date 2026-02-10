-- ============================================================================
-- 修复积分排行榜视图
-- 问题: 视图缺少 username, avatar_url, total_earned 字段
-- 影响: 排行榜头像和用户名显示不正确
-- ============================================================================

-- 先删除旧视图
DROP VIEW IF EXISTS public.points_leaderboard;

-- 创建修复后的视图
CREATE OR REPLACE VIEW public.points_leaderboard AS
SELECT 
    upb.user_id,
    u.username,
    u.avatar_url,
    upb.balance,
    upb.total_earned,
    RANK() OVER (ORDER BY upb.balance DESC) as rank
FROM public.user_points_balance upb
JOIN public.users u ON upb.user_id = u.id
WHERE upb.balance > 0
ORDER BY upb.balance DESC;

-- 授予查询权限
GRANT SELECT ON public.points_leaderboard TO anon;
GRANT SELECT ON public.points_leaderboard TO authenticated;
GRANT SELECT ON public.points_leaderboard TO service_role;

-- 验证视图
SELECT * FROM public.points_leaderboard LIMIT 5;
