-- ==========================================================================
-- FIX NOTIFICATIONS TABLE - ADD MISSING COLUMNS
-- ==========================================================================

-- 检查并添加 status 列（如果不存在）
DO $$
BEGIN
    -- 检查 status 列是否存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled'));
        
        RAISE NOTICE 'Added status column to notifications table';
    ELSE
        RAISE NOTICE 'status column already exists in notifications table';
    END IF;
END $$;

-- 检查并添加其他可能缺失的列
DO $$
BEGIN
    -- 添加 type 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'system';
    END IF;

    -- 添加 target_type 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'target_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN target_type VARCHAR(20) DEFAULT 'all';
    END IF;

    -- 添加 target_users 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'target_users'
    ) THEN
        ALTER TABLE notifications ADD COLUMN target_users UUID[];
    END IF;

    -- 添加 target_role 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'target_role'
    ) THEN
        ALTER TABLE notifications ADD COLUMN target_role VARCHAR(50);
    END IF;

    -- 添加 priority 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
    END IF;

    -- 添加 scheduled_at 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'scheduled_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- 添加 sent_at 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'sent_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- 添加 sender_id 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN sender_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- 添加 sender_name 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'sender_name'
    ) THEN
        ALTER TABLE notifications ADD COLUMN sender_name VARCHAR(100);
    END IF;

    -- 添加 recipients_count 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'recipients_count'
    ) THEN
        ALTER TABLE notifications ADD COLUMN recipients_count INTEGER DEFAULT 0;
    END IF;

    -- 添加 read_count 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read_count'
    ) THEN
        ALTER TABLE notifications ADD COLUMN read_count INTEGER DEFAULT 0;
    END IF;

    -- 添加 click_count 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'click_count'
    ) THEN
        ALTER TABLE notifications ADD COLUMN click_count INTEGER DEFAULT 0;
    END IF;

    -- 添加 link 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'link'
    ) THEN
        ALTER TABLE notifications ADD COLUMN link VARCHAR(500);
    END IF;

    -- 添加 image_url 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE notifications ADD COLUMN image_url TEXT;
    END IF;

    -- 添加 metadata 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- 创建索引（如果不存在）
DO $$
BEGIN
    -- status 索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_notifications_status'
    ) THEN
        CREATE INDEX idx_notifications_status ON notifications(status);
    END IF;

    -- type 索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_notifications_type'
    ) THEN
        CREATE INDEX idx_notifications_type ON notifications(type);
    END IF;

    -- target_type 索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_notifications_target_type'
    ) THEN
        CREATE INDEX idx_notifications_target_type ON notifications(target_type);
    END IF;

    -- sent_at 索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_notifications_sent_at'
    ) THEN
        CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
    END IF;

    -- created_at 索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_notifications_created_at'
    ) THEN
        CREATE INDEX idx_notifications_created_at ON notifications(created_at);
    END IF;
END $$;

-- ==========================================================================
-- CREATE USER_NOTIFICATIONS TABLE IF NOT EXISTS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'clicked', 'dismissed')),
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

-- Create indexes for user_notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_status ON user_notifications(status);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

-- ==========================================================================
-- FIX COMPLETE
-- ==========================================================================
