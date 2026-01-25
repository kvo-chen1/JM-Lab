
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'system', 'like', 'comment', 'follow'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Ensure works table has correct structure (if not already)
-- We use IF NOT EXISTS to avoid errors if it was created by another migration
CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator VARCHAR(255) NOT NULL, -- Snapshot of username
  creator_avatar VARCHAR(255), -- Snapshot of avatar
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

-- Add user_id to posts if missing (it was in the schema I found, but just in case)
-- ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
