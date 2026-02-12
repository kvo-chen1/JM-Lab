-- 添加 last_active 字段到 community_members 表
-- 用于统计在线用户

-- 1. 添加字段
ALTER TABLE community_members
ADD COLUMN IF NOT EXISTS last_active bigint;

-- 2. 添加注释
COMMENT ON COLUMN community_members.last_active IS '用户最后活跃时间（Unix时间戳，秒）';

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_community_members_last_active 
ON community_members(community_id, last_active);

-- 4. 更新现有记录的 last_active 为 joined_at 的时间戳
UPDATE community_members
SET last_active = EXTRACT(EPOCH FROM joined_at)::bigint
WHERE last_active IS NULL;

-- 5. 验证
SELECT 
    community_id,
    user_id,
    role,
    joined_at,
    last_active
FROM community_members
LIMIT 5;
