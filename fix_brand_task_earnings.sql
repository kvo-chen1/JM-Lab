-- ==========================================================================
-- 修复品牌任务收益数据不一致问题
-- ==========================================================================

-- ============================================
-- 1. 创建函数：同步提交记录的奖励到参与者统计
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_submission_reward_to_participant()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_submission RECORD;
    v_participant RECORD;
    v_total_earnings DECIMAL := 0;
    v_approved_works INTEGER := 0;
BEGIN
    -- 遍历所有已审核通过且有奖励的提交记录
    FOR v_submission IN 
        SELECT 
            s.id,
            s.participant_id,
            s.creator_id,
            s.final_reward,
            s.task_id
        FROM public.brand_task_submissions s
        WHERE s.status = 'approved' 
          AND s.final_reward IS NOT NULL 
          AND s.final_reward > 0
          AND s.participant_id IS NOT NULL
    LOOP
        -- 检查是否已存在对应的收益记录
        IF NOT EXISTS (
            SELECT 1 FROM public.creator_earnings 
            WHERE submission_id = v_submission.id
        ) THEN
            -- 创建收益记录
            INSERT INTO public.creator_earnings (
                creator_id,
                task_id,
                submission_id,
                amount,
                status,
                source_type,
                created_at
            ) VALUES (
                v_submission.creator_id,
                v_submission.task_id,
                v_submission.id,
                v_submission.final_reward,
                'pending',
                'task_reward',
                NOW()
            );
            
            RAISE NOTICE 'Created earnings record for submission %, amount: %', 
                v_submission.id, v_submission.final_reward;
        END IF;
    END LOOP;

    -- 重新计算每个参与者的统计数据
    FOR v_participant IN 
        SELECT 
            p.id,
            p.creator_id,
            p.task_id
        FROM public.brand_task_participants p
    LOOP
        -- 计算该参与者的总收益和通过作品数
        SELECT 
            COALESCE(SUM(s.final_reward), 0),
            COUNT(s.id)
        INTO 
            v_total_earnings,
            v_approved_works
        FROM public.brand_task_submissions s
        WHERE s.participant_id = v_participant.id
          AND s.status = 'approved'
          AND s.final_reward IS NOT NULL;

        -- 更新参与者统计
        UPDATE public.brand_task_participants
        SET 
            total_earnings = v_total_earnings,
            pending_earnings = v_total_earnings - withdrawn_earnings,
            approved_works = v_approved_works,
            submitted_works = (
                SELECT COUNT(*) 
                FROM public.brand_task_submissions s 
                WHERE s.participant_id = v_participant.id
            )
        WHERE id = v_participant.id;

        RAISE NOTICE 'Updated participant %: total_earnings=%, approved_works=%', 
            v_participant.id, v_total_earnings, v_approved_works;
    END LOOP;
END;
$$;

-- ============================================
-- 2. 执行同步函数
-- ============================================
SELECT public.sync_submission_reward_to_participant();

-- ============================================
-- 3. 创建触发器：提交记录更新时自动同步参与者统计
-- ============================================
CREATE OR REPLACE FUNCTION public.on_submission_change_sync_participant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_earnings DECIMAL := 0;
    v_pending_earnings DECIMAL := 0;
    v_approved_works INTEGER := 0;
    v_submitted_works INTEGER := 0;
    v_withdrawn_earnings DECIMAL := 0;
BEGIN
    -- 只在状态变为 approved 或 final_reward 更新时触发
    IF (TG_OP = 'UPDATE' AND (
        (NEW.status = 'approved' AND OLD.status != 'approved') OR
        (NEW.final_reward IS DISTINCT FROM OLD.final_reward)
    )) OR (TG_OP = 'INSERT' AND NEW.status = 'approved') THEN
        
        -- 获取参与者当前的提现金额
        SELECT withdrawn_earnings INTO v_withdrawn_earnings
        FROM public.brand_task_participants
        WHERE id = NEW.participant_id;

        -- 重新计算该参与者的统计数据
        SELECT 
            COALESCE(SUM(s.final_reward), 0),
            COUNT(s.id),
            COUNT(s.id)
        INTO 
            v_total_earnings,
            v_approved_works,
            v_submitted_works
        FROM public.brand_task_submissions s
        WHERE s.participant_id = NEW.participant_id
          AND s.status = 'approved'
          AND s.final_reward IS NOT NULL;

        v_pending_earnings := v_total_earnings - COALESCE(v_withdrawn_earnings, 0);

        -- 更新参与者统计
        UPDATE public.brand_task_participants
        SET 
            total_earnings = v_total_earnings,
            pending_earnings = v_pending_earnings,
            approved_works = v_approved_works,
            submitted_works = v_submitted_works
        WHERE id = NEW.participant_id;

        RAISE NOTICE 'Synced participant %: total_earnings=%, approved_works=%', 
            NEW.participant_id, v_total_earnings, v_approved_works;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS submission_change_sync_trigger ON public.brand_task_submissions;

-- 创建触发器
CREATE TRIGGER submission_change_sync_trigger
    AFTER INSERT OR UPDATE ON public.brand_task_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.on_submission_change_sync_participant();

-- ============================================
-- 4. 验证修复结果
-- ============================================
SELECT 
    'Participants Stats' as check_type,
    COUNT(*) as total_participants,
    SUM(total_earnings) as total_earnings,
    SUM(approved_works) as total_approved_works
FROM public.brand_task_participants;

SELECT 
    'Submissions Stats' as check_type,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    SUM(CASE WHEN status = 'approved' THEN final_reward ELSE 0 END) as total_rewards
FROM public.brand_task_submissions;

SELECT 
    'Creator Earnings' as check_type,
    COUNT(*) as total_records,
    SUM(amount) as total_amount
FROM public.creator_earnings;

-- ============================================
-- 5. 查看详细的参与者数据（用于调试）
-- ============================================
SELECT 
    p.id as participant_id,
    p.creator_id,
    p.task_id,
    p.total_earnings,
    p.approved_works,
    p.submitted_works,
    p.pending_earnings,
    p.withdrawn_earnings,
    (
        SELECT COALESCE(SUM(s.final_reward), 0)
        FROM public.brand_task_submissions s
        WHERE s.participant_id = p.id
          AND s.status = 'approved'
          AND s.final_reward IS NOT NULL
    ) as calculated_earnings,
    (
        SELECT COUNT(*)
        FROM public.brand_task_submissions s
        WHERE s.participant_id = p.id
          AND s.status = 'approved'
    ) as calculated_approved_works
FROM public.brand_task_participants p
ORDER BY p.total_earnings DESC;

-- ==========================================================================
-- 完成 - 请在 Supabase SQL Editor 中执行此脚本
-- ==========================================================================
