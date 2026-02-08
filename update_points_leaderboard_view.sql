-- 修改积分排行榜视图，显示所有用户（包括积分为0的）
DROP VIEW IF EXISTS public.points_leaderboard;

CREATE OR REPLACE VIEW public.points_leaderboard AS
SELECT 
  upb.user_id,
  u.username,
  u.avatar_url,
  upb.balance,
  upb.total_earned,
  RANK() OVER (ORDER BY upb.balance DESC) as rank
FROM public.user_points_balance upb
JOIN public.users u ON upb.user_id = u.id;

-- 授予权限
GRANT SELECT ON public.points_leaderboard TO anon;
GRANT SELECT ON public.points_leaderboard TO authenticated;
GRANT SELECT ON public.points_leaderboard TO service_role;

SELECT 'points_leaderboard view updated successfully' as status;
