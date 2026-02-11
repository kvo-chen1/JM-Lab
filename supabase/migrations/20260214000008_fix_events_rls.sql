-- 修复 events 表的 RLS 策略，允许匿名用户读取

-- 1. 确保 RLS 已启用
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能存在的旧策略（避免冲突）
DROP POLICY IF EXISTS "Allow anonymous read" ON events;
DROP POLICY IF EXISTS "Allow authenticated read" ON events;
DROP POLICY IF EXISTS "Allow all read" ON events;

-- 3. 创建新的读取策略 - 允许所有用户（包括匿名用户）读取
CREATE POLICY "Allow all users read" ON events
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4. 创建写入策略 - 只允许认证用户写入
CREATE POLICY "Allow authenticated insert" ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON events
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON events
    FOR DELETE
    TO authenticated
    USING (true);

-- 5. 验证策略
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'events';
