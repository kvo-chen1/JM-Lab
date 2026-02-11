-- 在Supabase SQL Editor中执行此脚本
-- 方案1: 临时禁用RLS（快速测试用）

-- 临时禁用相关表的RLS
ALTER TABLE admin_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_operation_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedbacks DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_process_logs DISABLE ROW LEVEL SECURITY;

-- 查看执行结果
SELECT 'RLS已临时禁用' as status;
