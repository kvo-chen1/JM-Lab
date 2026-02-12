-- 添加 last_active 字段到 community_members 表
-- 用于统计在线用户

-- 检查字段是否存在，不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'community_members'
        AND column_name = 'last_active'
    ) THEN
        ALTER TABLE community_members
        ADD COLUMN last_active bigint;
        
        -- 添加注释
        COMMENT ON COLUMN community_members.last_active IS '用户最后活跃时间（Unix时间戳，秒）';
        
        -- 创建索引以提高查询性能
        CREATE INDEX idx_community_members_last_active 
        ON community_members(community_id, last_active);
        
        RAISE NOTICE 'Added last_active column to community_members table';
    ELSE
        RAISE NOTICE 'last_active column already exists in community_members table';
    END IF;
END $$;

-- 更新现有记录的 last_active 为 joined_at 的时间戳
UPDATE community_members
SET last_active = EXTRACT(EPOCH FROM joined_at)::bigint
WHERE last_active IS NULL;
