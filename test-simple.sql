-- 最简化的测试脚本
-- 只创建必要的表，验证community_id列是否能正确创建

-- 创建communities表
CREATE TABLE IF NOT EXISTS test_communities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- 创建users表
CREATE TABLE IF NOT EXISTS test_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL
);

-- 创建community_members表，包含community_id列
CREATE TABLE IF NOT EXISTS test_community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(50) REFERENCES test_communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES test_users(id) ON DELETE CASCADE,
    UNIQUE(community_id, user_id)
);

-- 验证表创建成功
SELECT 'communities表创建成功' AS status WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'test_communities');
SELECT 'users表创建成功' AS status WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'test_users');
SELECT 'community_members表创建成功' AS status WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'test_community_members');

-- 检查community_id列是否存在
SELECT column_name FROM information_schema.columns WHERE table_name = 'test_community_members' AND column_name = 'community_id';

-- 插入测试数据
INSERT INTO test_communities (id, name) VALUES ('test1', '测试社区') ON CONFLICT (id) DO NOTHING;

-- 查询测试数据
SELECT * FROM test_communities;
