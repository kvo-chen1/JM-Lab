-- ==========================================================================
-- 将品牌任务收益同步到变现中心的收入表
-- ==========================================================================

-- ============================================
-- 1. 创建函数：同步品牌任务收益到 creator_revenue
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_brand_task_to_creator_revenue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_earning RECORD;
    v_existing_revenue RECORD;
    v_total_reward DECIMAL := 0;
    v_user_id UUID;
BEGIN
    -- 遍历所有品牌任务收益记录
    FOR v_earning IN 
        SELECT 
            ce.creator_id,
            ce.amount,
            ce.task_id,
            ce.created_at
        FROM public.creator_earnings ce
        WHERE ce.status IN ('pending', 'approved', 'paid')
          AND ce.source_type = 'task_reward'
    LOOP
        v_user_id := v_earning.creator_id;
        v_total_reward := v_earning.amount;

        -- 检查是否已存在对应的 revenue_records 记录
        IF NOT EXISTS (
            SELECT 1 FROM public.revenue_records 
            WHERE user_id = v_user_id
              AND amount = v_total_reward
              AND type = 'task'
              AND created_at::date = v_earning.created_at::date
        ) THEN
            -- 创建收入明细记录
            INSERT INTO public.revenue_records (
                user_id,
                amount,
                type,
                description,
                status,
                created_at
            ) VALUES (
                v_user_id,
                v_total_reward,
                'task',
                '品牌任务奖励',
                'completed',
                v_earning.created_at
            );
            
            RAISE NOTICE 'Created revenue record for user %, amount: %', 
                v_user_id, v_total_reward;
        END IF;
    END LOOP;

    -- 重新计算每个用户的 creator_revenue
    FOR v_user_id IN 
        SELECT DISTINCT creator_id 
        FROM public.creator_earnings
        WHERE status IN ('pending', 'approved', 'paid')
    LOOP
        -- 计算该用户的总收益
        SELECT COALESCE(SUM(amount), 0)
        INTO v_total_reward
        FROM public.creator_earnings
        WHERE creator_id = v_user_id
          AND status IN ('pending', 'approved', 'paid');

        -- 检查是否已有 creator_revenue 记录
        SELECT * INTO v_existing_revenue
        FROM public.creator_revenue
        WHERE user_id = v_user_id;

        IF v_existing_revenue IS NOT NULL THEN
            -- 更新现有记录
            UPDATE public.creator_revenue
            SET 
                total_revenue = v_total_reward,
                monthly_revenue = (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM public.creator_earnings
                    WHERE creator_id = v_user_id
                      AND status IN ('pending', 'approved', 'paid')
                      AND created_at >= DATE_TRUNC('month', NOW())
                ),
                pending_revenue = (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM public.creator_earnings
                    WHERE creator_id = v_user_id
                      AND status IN ('pending', 'approved')
                ),
                withdrawable_revenue = (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM public.creator_earnings
                    WHERE creator_id = v_user_id
                      AND status = 'approved'
                ),
                updated_at = NOW()
            WHERE user_id = v_user_id;

            RAISE NOTICE 'Updated creator_revenue for user %: total_revenue=%', 
                v_user_id, v_total_reward;
        ELSE
            -- 创建新记录
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
                v_total_reward, -- 本月收入（简化处理）
                v_total_reward, -- 待结算
                0,              -- 可提现（需要单独处理）
                0,
                0,
                NOW(),
                NOW()
            );

            RAISE NOTICE 'Created creator_revenue for user %: total_revenue=%', 
                v_user_id, v_total_reward;
        END IF;
    END LOOP;
END;
$$;

-- ============================================
-- 2. 执行同步函数
-- ============================================
SELECT public.sync_brand_task_to_creator_revenue();

-- ============================================
-- 3. 创建触发器：creator_earnings 插入时自动同步
-- ============================================
CREATE OR REPLACE FUNCTION public.on_creator_earning_insert_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_revenue RECORD;
BEGIN
    -- 只在 task_reward 类型时触发
    IF NEW.source_type = 'task_reward' THEN
        -- 创建收入明细记录
        INSERT INTO public.revenue_records (
            user_id,
            amount,
            type,
            description,
            status,
            created_at
        ) VALUES (
            NEW.creator_id,
            NEW.amount,
            'task',
            '品牌任务奖励',
            CASE NEW.status
                WHEN 'paid' THEN 'completed'
                ELSE 'pending'
            END,
            NEW.created_at
        );

        -- 更新或创建 creator_revenue
        SELECT * INTO v_existing_revenue
        FROM public.creator_revenue
        WHERE user_id = NEW.creator_id;

        IF v_existing_revenue IS NOT NULL THEN
            UPDATE public.creator_revenue
            SET 
                total_revenue = total_revenue + NEW.amount,
                monthly_revenue = CASE 
                    WHEN created_at >= DATE_TRUNC('month', NOW()) THEN monthly_revenue + NEW.amount
                    ELSE monthly_revenue
                END,
                pending_revenue = CASE 
                    WHEN NEW.status IN ('pending', 'approved') THEN pending_revenue + NEW.amount
                    ELSE pending_revenue
                END,
                updated_at = NOW()
            WHERE user_id = NEW.creator_id;
        ELSE
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
                NEW.creator_id,
                NEW.amount,
                NEW.amount,
                CASE WHEN NEW.status IN ('pending', 'approved') THEN NEW.amount ELSE 0 END,
                CASE WHEN NEW.status = 'approved' THEN NEW.amount ELSE 0 END,
                0,
                0,
                NOW(),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS creator_earning_insert_sync_trigger ON public.creator_earnings;

-- 创建触发器
CREATE TRIGGER creator_earning_insert_sync_trigger
    AFTER INSERT ON public.creator_earnings
    FOR EACH ROW
    EXECUTE FUNCTION public.on_creator_earning_insert_sync();

-- ============================================
-- 4. 验证修复结果
-- ============================================
SELECT 
    'Brand Task Earnings' as check_type,
    COUNT(*) as total_records,
    SUM(amount) as total_amount
FROM public.creator_earnings
WHERE status IN ('pending', 'approved', 'paid');

SELECT 
    'Creator Revenue' as check_type,
    COUNT(*) as total_users,
    SUM(total_revenue) as total_revenue,
    SUM(monthly_revenue) as monthly_revenue,
    SUM(pending_revenue) as pending_revenue
FROM public.creator_revenue;

SELECT 
    'Revenue Records' as check_type,
    COUNT(*) as total_records,
    SUM(amount) as total_amount
FROM public.revenue_records;

-- ============================================
-- 5. 查看详细对比
-- ============================================
SELECT 
    ce.creator_id,
    u.username,
    SUM(ce.amount) as brand_task_earnings,
    cr.total_revenue as creator_revenue_total,
    (SELECT COALESCE(SUM(amount), 0) FROM public.revenue_records WHERE user_id = ce.creator_id) as revenue_records_total
FROM public.creator_earnings ce
LEFT JOIN public.users u ON u.id = ce.creator_id
LEFT JOIN public.creator_revenue cr ON cr.user_id = ce.creator_id
WHERE ce.status IN ('pending', 'approved', 'paid')
GROUP BY ce.creator_id, u.username, cr.total_revenue
ORDER BY SUM(ce.amount) DESC;

-- ==========================================================================
-- 完成 - 请在 Supabase SQL Editor 中执行此脚本
-- ==========================================================================
