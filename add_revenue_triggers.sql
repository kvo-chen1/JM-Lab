-- ==========================================================================
-- 添加自动创建收入记录的触发器和函数
-- ==========================================================================

-- ============================================
-- 1. 创建通用函数：添加收入记录
-- ============================================
CREATE OR REPLACE FUNCTION public.add_revenue_record(
    p_user_id UUID,
    p_amount DECIMAL,
    p_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_work_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record_id UUID;
BEGIN
    -- 验证类型
    IF p_type NOT IN ('ads', 'sponsorship', 'tipping', 'membership', 'task', 'withdrawal') THEN
        RAISE EXCEPTION 'Invalid revenue type: %', p_type;
    END IF;

    -- 插入收入记录
    INSERT INTO public.revenue_records (
        user_id,
        amount,
        type,
        description,
        work_id,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        p_type,
        COALESCE(p_description, 
            CASE p_type
                WHEN 'ads' THEN '广告分成收入'
                WHEN 'sponsorship' THEN '品牌合作收入'
                WHEN 'tipping' THEN '粉丝打赏'
                WHEN 'membership' THEN '会员订阅收入'
                WHEN 'task' THEN '任务奖励'
                WHEN 'withdrawal' THEN '提现'
            END
        ),
        p_work_id,
        'completed'
    )
    RETURNING id INTO v_record_id;

    -- 更新创作者总收入
    INSERT INTO public.creator_revenue (
        user_id,
        total_revenue,
        withdrawable_revenue
    ) VALUES (
        p_user_id,
        p_amount,
        p_amount
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        total_revenue = public.creator_revenue.total_revenue + p_amount,
        withdrawable_revenue = public.creator_revenue.withdrawable_revenue + p_amount,
        updated_at = NOW();

    RETURN v_record_id;
END;
$$;

-- ============================================
-- 2. 创建触发器：作品获得浏览量时添加广告分成收入（模拟）
-- ============================================
CREATE OR REPLACE FUNCTION public.on_work_view_add_revenue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ad_revenue DECIMAL := 0.01; -- 每次浏览0.01元
BEGIN
    -- 每100次浏览产生一次收入记录（避免记录过多）
    IF NEW.view_count % 100 = 0 THEN
        PERFORM public.add_revenue_record(
            NEW.creator_id,
            v_ad_revenue * 100,
            'ads',
            '作品浏览广告分成',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 先删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS work_view_revenue_trigger ON public.works;

-- 创建触发器
CREATE TRIGGER work_view_revenue_trigger
    AFTER UPDATE OF view_count ON public.works
    FOR EACH ROW
    WHEN (NEW.view_count > OLD.view_count)
    EXECUTE FUNCTION public.on_work_view_add_revenue();

-- ============================================
-- 3. 创建触发器：任务完成时添加任务收入
-- ============================================
CREATE OR REPLACE FUNCTION public.on_task_completed_add_revenue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_budget DECIMAL;
BEGIN
    -- 只在状态变为 completed 时触发
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 获取任务预算
        SELECT budget_max INTO v_task_budget
        FROM public.business_tasks
        WHERE id = NEW.task_id;
        
        -- 添加收入记录
        PERFORM public.add_revenue_record(
            NEW.creator_id,
            COALESCE(v_task_budget, 0),
            'task',
            '完成任务奖励',
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 先删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS task_completed_revenue_trigger ON public.creator_task_applications;

-- 创建触发器
CREATE TRIGGER task_completed_revenue_trigger
    AFTER UPDATE ON public.creator_task_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.on_task_completed_add_revenue();

-- ============================================
-- 4. 创建函数：手动添加测试收入记录（用于测试）
-- ============================================
CREATE OR REPLACE FUNCTION public.add_test_revenue_record(
    p_user_id UUID,
    p_amount DECIMAL DEFAULT 100.00,
    p_type TEXT DEFAULT 'ads'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record_id UUID;
BEGIN
    v_record_id := public.add_revenue_record(
        p_user_id,
        p_amount,
        p_type,
        '测试收入记录'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'record_id', v_record_id,
        'amount', p_amount,
        'type', p_type
    );
END;
$$;

-- ============================================
-- 5. 验证函数创建结果
-- ============================================
SELECT 
    'Functions' as check_type,
    routine_name as name,
    routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('add_revenue_record', 'on_work_view_add_revenue', 'on_task_completed_add_revenue', 'add_test_revenue_record')
UNION ALL
SELECT 
    'Triggers' as check_type,
    trigger_name as name,
    event_manipulation as type
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN ('work_view_revenue_trigger', 'task_completed_revenue_trigger')
ORDER BY check_type, name;

-- ==========================================================================
-- 完成 - 请在 Supabase SQL Editor 中执行此脚本
-- ==========================================================================
