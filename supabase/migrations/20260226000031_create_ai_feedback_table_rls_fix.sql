-- RLS 修复 - 在 Supabase Dashboard 中执行
-- 选项1: 完全禁用 RLS（简单但不安全）
-- ALTER TABLE ai_feedback DISABLE ROW LEVEL SECURITY;

-- 选项2: 创建允许所有操作的策略（推荐用于测试）
DROP POLICY IF EXISTS "Allow all operations" ON ai_feedback;
CREATE POLICY "Allow all operations"
    ON ai_feedback FOR ALL
    USING (true)
    WITH CHECK (true);

-- 选项3: 创建完整的 RLS 策略（生产环境推荐）
-- 先删除之前的策略
DROP POLICY IF EXISTS "Users can view own feedback" ON ai_feedback;
DROP POLICY IF EXISTS "Users can create own feedback" ON ai_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON ai_feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON ai_feedback;
DROP POLICY IF EXISTS "Allow all operations" ON ai_feedback;

-- 启用 RLS
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- 任何人都可以插入反馈
CREATE POLICY "Anyone can insert feedback" ON ai_feedback FOR INSERT WITH CHECK (true);

-- 任何人都可以查看反馈
CREATE POLICY "Anyone can view feedback" ON ai_feedback FOR SELECT USING (true);

-- 管理员可以更新和删除
CREATE POLICY "Admins can update feedback" ON ai_feedback FOR UPDATE
    USING (EXISTS (SELECT 1 FROM admin_accounts WHERE admin_accounts.id = auth.uid()));

CREATE POLICY "Admins can delete feedback" ON ai_feedback FOR DELETE
    USING (EXISTS (SELECT 1 FROM admin_accounts WHERE admin_accounts.id = auth.uid()));
