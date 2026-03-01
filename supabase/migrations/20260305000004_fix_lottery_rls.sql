-- 修复 lottery_spin_records 的 RLS 策略
-- 允许已认证用户插入自己的记录

-- 删除旧策略
DROP POLICY IF EXISTS "lottery_spin_records_insert_own" ON lottery_spin_records;

-- 创建新策略：允许任何已认证用户插入记录
CREATE POLICY "lottery_spin_records_insert_auth" ON lottery_spin_records
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
