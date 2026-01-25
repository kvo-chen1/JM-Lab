-- 20260125_complete_features.sql
-- 补全积分、成就、私信及其他缺失的字段与表格

-- 1. 补全 Users 表字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';
-- 确保 email_verified 存在 (如果 Supabase Auth 未自动同步)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 2. 创建积分记录表 (points_records)
CREATE TABLE IF NOT EXISTS points_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL, -- e.g., 'creation', 'checkin', 'task'
    type VARCHAR(20) NOT NULL, -- 'earn', 'spend'
    points INTEGER NOT NULL,
    description TEXT,
    balance_after INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_records_user_id ON points_records(user_id);
CREATE INDEX IF NOT EXISTS idx_points_records_created_at ON points_records(created_at);

-- 3. 创建用户成就表 (user_achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    progress INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Ensure columns exist if table was created previously without them
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- 4. 创建私信表 (direct_messages)
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at);

-- 5. 完善 Works 表字段
-- 确保 works 表存在 (防止前置迁移未运行)
CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator VARCHAR(255) NOT NULL,
  creator_avatar VARCHAR(255),
  thumbnail VARCHAR(255) NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  description TEXT,
  video_url VARCHAR(255),
  duration VARCHAR(20),
  image_tag VARCHAR(100),
  model_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加缺失字段
ALTER TABLE works ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published'; -- 'draft', 'pending', 'published'
ALTER TABLE works ADD COLUMN IF NOT EXISTS copyright_certified BOOLEAN DEFAULT FALSE;

-- 6. 添加 RLS 策略 (Row Level Security)

-- Points Records RLS
ALTER TABLE points_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own points history" ON points_records FOR SELECT USING (auth.uid() = user_id);
-- 通常积分由系统后台增加，用户不可直接 Insert/Update，但为了开发方便暂时允许用户 Insert (或者仅通过 Service Role)
-- 这里假设通过后端 API (Service Role) 操作，或者用户触发的 Server Action。
-- 如果允许前端直接写库:
CREATE POLICY "Users can insert their own points (Dev only)" ON points_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Achievements RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view unlocked achievements" ON user_achievements FOR SELECT USING (is_unlocked = TRUE);

-- Direct Messages RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages sent to or by them" ON direct_messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send messages" ON direct_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);
CREATE POLICY "Users can update (mark read) received messages" ON direct_messages FOR UPDATE USING (
    auth.uid() = receiver_id
);

-- Works RLS
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public works are viewable by everyone" ON works FOR SELECT USING (status = 'published');
CREATE POLICY "Users can view their own works (including drafts)" ON works FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Users can create works" ON works FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own works" ON works FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own works" ON works FOR DELETE USING (auth.uid() = creator_id);

-- Notifications RLS (如果之前没加)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
