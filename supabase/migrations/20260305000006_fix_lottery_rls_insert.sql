-- 修复 lottery_spin_records 的插入策略
-- 允许已认证用户插入记录

-- 删除旧策略
DROP POLICY IF EXISTS "lottery_spin_records_insert_auth" ON lottery_spin_records;
DROP POLICY IF EXISTS "lottery_spin_records_insert_own" ON lottery_spin_records;

-- 创建新策略：允许已认证用户插入记录（user_id 必须等于当前用户ID）
CREATE POLICY "lottery_spin_records_insert_own" ON lottery_spin_records
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 确保表已启用 RLS
ALTER TABLE lottery_spin_records ENABLE ROW LEVEL SECURITY;
