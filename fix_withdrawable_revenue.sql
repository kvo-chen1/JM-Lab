-- ==========================================================================
-- 修复可提现金额计算逻辑
-- ==========================================================================

-- ============================================
-- 1. 更新 creator_earnings 状态
-- 将 pending 状态改为 approved（因为已经审核通过并发放奖励）
-- ============================================
UPDATE public.creator_earnings
SET status = 'approved'
WHERE status = 'pending'
  AND source_type = 'task_reward';

-- ============================================
-- 2. 重新计算 creator_revenue 表
-- ============================================
DO $$
DECLARE
    v_user_id UUID;
    v_total_reward DECIMAL := 0;
    v_pending_reward DECIMAL := 0;
    v_approved_reward DECIMAL := 0;
    v_paid_reward DECIMAL := 0;
BEGIN
    -- 遍历所有有收益的用户
    FOR v_user_id IN 
        SELECT DISTINCT creator_id 
        FROM public.creator_earnings
        WHERE status IN ('pending', 'approved', 'paid')
    LOOP
        -- 计算各种状态的收益
        SELECT 
            COALESCE(SUM(CASE WHEN status IN ('pending', 'approved', 'paid') THEN amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)
        INTO 
            v_total_reward,
            v_pending_reward,
            v_approved_reward,
            v_paid_reward
        FROM public.creator_earnings
        WHERE creator_id = v_user_id;

        -- 更新或创建 creator_revenue 记录
        INSERT INTO public.creator_revenue (
            user_id,
            total_revenue,
            monthly_revenue,
            pending_revenue,
            withdrawable_revenue,
            total_withdrawn,
            last_month_revenue,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_total_reward,
            (
                SELECT COALESCE(SUM(amount), 0)
                FROM public.creator_earnings
                WHERE creator_id = v_user_id
                  AND status IN ('pending', 'approved', 'paid')
                  AND created_at >= DATE_TRUNC('month', NOW())
            ),
            v_pending_reward,
            v_approved_reward, -- 可提现金额 = approved 状态的收益
            v_paid_reward,     -- 已提现金额 = paid 状态的收益
            0,
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            total_revenue = EXCLUDED.total_revenue,
            monthly_revenue = EXCLUDED.monthly_revenue,
            pending_revenue = EXCLUDED.pending_revenue,
            withdrawable_revenue = EXCLUDED.withdrawable_revenue,
            total_withdrawn = EXCLUDED.total_withdrawn,
            updated_at = NOW();

        RAISE NOTICE 'Updated creator_revenue for user %: total=%, pending=%, withdrawable=%, paid=%', 
            v_user_id, v_total_reward, v_pending_reward, v_approved_reward, v_paid_reward;
    END LOOP;
END $$;

-- ============================================
-- 3. 验证修复结果
-- ============================================
SELECT 
    'Creator Earnings Status' as check_type,
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM public.creator_earnings
GROUP BY status
ORDER BY status;

SELECT 
    'Creator Revenue Summary' as check_type,
    COUNT(*) as total_users,
    SUM(total_revenue) as total_revenue,
    SUM(pending_revenue) as pending_revenue,
    SUM(withdrawable_revenue) as withdrawable_revenue,
    SUM(total_withdrawn) as total_withdrawn
FROM public.creator_revenue;

-- ============================================
-- 4. 查看每个用户的详细数据
-- ============================================
SELECT 
    cr.user_id,
    u.username,
    cr.total_revenue,
    cr.pending_revenue,
    cr.withdrawable_revenue,
    cr.total_withdrawn,
    (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.creator_earnings
        WHERE creator_id = cr.user_id
          AND status = 'approved'
    ) as calculated_withdrawable
FROM public.creator_revenue cr
LEFT JOIN public.users u ON u.id = cr.user_id
ORDER BY cr.total_revenue DESC;

-- ==========================================================================
-- 完成 - 请在 Supabase SQL Editor 中执行此脚本
-- ==========================================================================
