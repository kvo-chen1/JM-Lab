-- 修复 inspiration_mindmaps 表的 RLS 策略
-- 问题：后端 API 登录的用户无法通过 RLS 检查，因为 auth.uid() 返回 null
-- 解决方案：禁用 RLS 检查，改为在应用层控制权限

-- 1. 禁用所有表的 RLS
ALTER TABLE inspiration_mindmaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_ai_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_stories DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有 RLS 策略（如果存在）
DROP POLICY IF EXISTS "Users can view own mindmaps" ON inspiration_mindmaps;
DROP POLICY IF EXISTS "Users can insert own mindmaps" ON inspiration_mindmaps;
DROP POLICY IF EXISTS "Users can update own mindmaps" ON inspiration_mindmaps;
DROP POLICY IF EXISTS "Users can delete own mindmaps" ON inspiration_mindmaps;

DROP POLICY IF EXISTS "Users can view own nodes" ON inspiration_nodes;
DROP POLICY IF EXISTS "Users can insert own nodes" ON inspiration_nodes;
DROP POLICY IF EXISTS "Users can update own nodes" ON inspiration_nodes;
DROP POLICY IF EXISTS "Users can delete own nodes" ON inspiration_nodes;

DROP POLICY IF EXISTS "Users can view own suggestions" ON inspiration_ai_suggestions;
DROP POLICY IF EXISTS "Users can insert own suggestions" ON inspiration_ai_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON inspiration_ai_suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON inspiration_ai_suggestions;

DROP POLICY IF EXISTS "Users can view own stories" ON inspiration_stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON inspiration_stories;
DROP POLICY IF EXISTS "Users can update own stories" ON inspiration_stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON inspiration_stories;

-- 3. 添加注释说明
COMMENT ON TABLE inspiration_mindmaps IS '创作灵感脉络表 (RLS已禁用，权限在应用层控制)';
COMMENT ON TABLE inspiration_nodes IS '脉络节点表 (RLS已禁用，权限在应用层控制)';
COMMENT ON TABLE inspiration_ai_suggestions IS 'AI建议表 (RLS已禁用，权限在应用层控制)';
COMMENT ON TABLE inspiration_stories IS '创作故事表 (RLS已禁用，权限在应用层控制)';
