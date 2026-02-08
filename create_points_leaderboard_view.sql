-- ==========================================================================
-- 创建视图：积分排行榜
-- ==========================================================================

-- 先删除已存在的视图（如果存在）
DROP VIEW IF EXISTS public.points_leaderboard;

-- 创建积分排行榜视图
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
WHERE upb.balance > 0;

-- 授予权限
GRANT SELECT ON public.points_leaderboard TO anon;
GRANT SELECT ON public.points_leaderboard TO authenticated;
GRANT SELECT ON public.points_leaderboard TO service_role;

-- 验证视图创建成功
SELECT 'points_leaderboard view created successfully' as status;
