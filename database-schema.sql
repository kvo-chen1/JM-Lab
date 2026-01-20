-- Database Schema for the Project
-- Designed to follow Third Normal Form (3NF)
-- Includes proper primary keys, foreign keys, and indexes

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================================
-- USERS TABLE
-- ==========================================================================
-- This table stores user information

-- For existing users table, we need a different approach since id column might have existing data
DO $$
BEGIN
    -- If users table doesn't exist, create it from scratch
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            name VARCHAR(255),
            avatar_url TEXT,
            phone VARCHAR(20),
            is_verified BOOLEAN DEFAULT false,
            role VARCHAR(50) DEFAULT 'user',
            metadata JSONB,
            subscription_type VARCHAR(50) DEFAULT 'free',
            status VARCHAR(50) DEFAULT 'active',
            last_login_at TIMESTAMP WITH TIME ZONE,
            email_verified_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- If users table exists, add missing columns but don't modify id column type
        -- This preserves existing data while adding new functionality
        ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE NOT NULL DEFAULT '',
            ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
            ADD COLUMN IF NOT EXISTS name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS avatar_url TEXT,
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
            ADD COLUMN IF NOT EXISTS metadata JSONB,
            ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50) DEFAULT 'free',
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
            ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Create indexes for frequently queried columns
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
END $$;


-- ==========================================================================
-- CONVERSATIONS TABLE
-- ==========================================================================
-- This table stores conversation information
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for foreign keys and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- ==========================================================================
-- MESSAGES TABLE
-- ==========================================================================
-- This table stores messages within conversations

-- For existing messages table, we need a different approach since id column can't be directly cast
-- First check if messages table exists and handle accordingly
DO $$
BEGIN
    -- If messages table exists, we'll create a new one and migrate data if needed
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        -- Rename existing table to backup
        ALTER TABLE messages RENAME TO messages_old;
    END IF;
    
    -- Create new messages table with proper UUID primary key
    CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        is_deleted BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes for foreign keys and frequently queried columns
    CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX idx_messages_user_id ON messages(user_id);
    CREATE INDEX idx_messages_role ON messages(role);
    CREATE INDEX idx_messages_created_at ON messages(created_at);
    
    -- Optionally drop the backup table if no data migration is needed
    -- DROP TABLE IF EXISTS messages_old;
END $$;


-- ==========================================================================
-- ERRORS TABLE
-- ==========================================================================
-- This table stores error logs
CREATE TABLE IF NOT EXISTS errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  status_code INTEGER,
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_errors_user_id ON errors(user_id);
CREATE INDEX IF NOT EXISTS idx_errors_error_type ON errors(error_type);
CREATE INDEX IF NOT EXISTS idx_errors_created_at ON errors(created_at);
CREATE INDEX IF NOT EXISTS idx_errors_is_resolved ON errors(is_resolved);

-- ==========================================================================
-- POINTS TABLE
-- ==========================================================================
-- This table stores user points transactions
CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('earned', 'spent', 'adjustment')),
  reason VARCHAR(255) NOT NULL,
  related_id UUID,
  related_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for foreign keys and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_type ON points(type);
CREATE INDEX IF NOT EXISTS idx_points_created_at ON points(created_at);

-- ==========================================================================
-- ACHIEVEMENTS TABLE
-- ==========================================================================
-- This table stores available achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50),
  points_reward INTEGER DEFAULT 0,
  type VARCHAR(50) NOT NULL,
  criteria JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(type);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);

-- ==========================================================================
-- USER_ACHIEVEMENTS TABLE
-- ==========================================================================
-- This table stores user achievement progress and completions
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for foreign keys and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_is_completed ON user_achievements(is_completed);

-- ==========================================================================
-- USER_PROGRESS TABLE
-- ==========================================================================
-- This table stores user progress information
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_questions INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- in seconds
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for user_id (one progress record per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- ==========================================================================
-- TRIGGERS FOR AUTOMATIC UPDATED_AT TIMESTAMP
-- ==========================================================================
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('CREATE TRIGGER update_%I_updated_at 
                        BEFORE UPDATE ON %I 
                        FOR EACH ROW 
                        EXECUTE FUNCTION update_updated_at_column();', 
                        table_name, table_name);
    END LOOP;
END $$;

-- ==========================================================================
-- VIEW: USER_TOTAL_POINTS
-- ==========================================================================
-- This view calculates total points for each user
CREATE OR REPLACE VIEW user_total_points AS
SELECT 
  user_id,
  SUM(amount) AS total_points
FROM points
GROUP BY user_id;

-- ==========================================================================
-- VIEW: USER_ACTIVE_CONVERSATIONS
-- ==========================================================================
-- This view shows active conversations for each user
CREATE OR REPLACE VIEW user_active_conversations AS
SELECT 
  c.id,
  c.user_id,
  c.title,
  c.created_at,
  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count
FROM conversations c
WHERE c.is_active = true;

-- ==========================================================================
-- Database Schema Creation Complete
-- ==========================================================================

-- ==========================================================================
-- FRIEND_REQUESTS TABLE
-- ==========================================================================
-- This table stores friend requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Create indexes for foreign keys and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- ==========================================================================
-- FRIENDS TABLE
-- ==========================================================================
-- This table stores established friendships
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_note VARCHAR(255),
  friend_note VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

-- ==========================================================================
-- USER_STATUS TABLE
-- ==========================================================================
-- This table tracks user online status
CREATE TABLE IF NOT EXISTS user_status (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_user_status_status ON user_status(status);

-- -- ==========================================================================\n-- CATEGORIES TABLE\n-- ==========================================================================\n-- This table stores categories for works\nCREATE TABLE IF NOT EXISTS categories (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  name VARCHAR(100) NOT NULL UNIQUE,\n  description TEXT,\n  icon VARCHAR(50),\n  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\n-- Create indexes for categories\nCREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);\nCREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);\n\n-- ==========================================================================\n-- TAGS TABLE\n-- ==========================================================================\n-- This table stores tags for works\nCREATE TABLE IF NOT EXISTS tags (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  name VARCHAR(50) NOT NULL UNIQUE,\n  description TEXT,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\n-- Create index for active tags\nCREATE INDEX IF NOT EXISTS idx_tags_is_active ON tags(is_active);\n\n-- ==========================================================================\n-- WORKS TABLE\n-- ==========================================================================\n-- This table stores creative works\nCREATE TABLE IF NOT EXISTS works (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,\n  title VARCHAR(255) NOT NULL,\n  description TEXT,\n  content JSONB NOT NULL,\n  thumbnail_url TEXT,\n  is_public BOOLEAN DEFAULT false,\n  is_featured BOOLEAN DEFAULT false,\n  view_count INTEGER DEFAULT 0,\n  like_count INTEGER DEFAULT 0,\n  comment_count INTEGER DEFAULT 0,\n  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),\n  metadata JSONB,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\n-- Create indexes for works\nCREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id);\nCREATE INDEX IF NOT EXISTS idx_works_category_id ON works(category_id);\nCREATE INDEX IF NOT EXISTS idx_works_status ON works(status);\nCREATE INDEX IF NOT EXISTS idx_works_is_public ON works(is_public);\nCREATE INDEX IF NOT EXISTS idx_works_is_featured ON works(is_featured);\nCREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at);\n\n-- ==========================================================================\n-- WORK_TAGS TABLE\n-- ==========================================================================\n-- This table stores tag associations for works\nCREATE TABLE IF NOT EXISTS work_tags (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,\n  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  UNIQUE(work_id, tag_id)\n);\n\n-- Create indexes for work_tags\nCREATE INDEX IF NOT EXISTS idx_work_tags_work_id ON work_tags(work_id);\nCREATE INDEX IF NOT EXISTS idx_work_tags_tag_id ON work_tags(tag_id);\n\n-- ==========================================================================\n-- COMMENTS TABLE\n-- ==========================================================================\n-- This table stores comments on works\nCREATE TABLE IF NOT EXISTS comments (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,\n  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  parent_id UUID REFERENCES comments(id) ON DELETE SET NULL,\n  content TEXT NOT NULL,\n  is_deleted BOOLEAN DEFAULT false,\n  metadata JSONB,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\n-- Create indexes for comments\nCREATE INDEX IF NOT EXISTS idx_comments_work_id ON comments(work_id);\nCREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);\nCREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);\nCREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);\n\n-- ==========================================================================\n-- LIKES TABLE\n-- ==========================================================================\n-- This table stores likes for works\nCREATE TABLE IF NOT EXISTS likes (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  work_id UUID REFERENCES works(id) ON DELETE CASCADE,\n  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  UNIQUE(user_id, work_id) WHERE work_id IS NOT NULL,\n  UNIQUE(user_id, comment_id) WHERE comment_id IS NOT NULL\n);\n\n-- Create indexes for likes\nCREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);\nCREATE INDEX IF NOT EXISTS idx_likes_work_id ON likes(work_id);\nCREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);\n\n-- ==========================================================================\n-- FAVORITES TABLE\n-- ==========================================================================\n-- This table stores user favorites\nCREATE TABLE IF NOT EXISTS favorites (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  UNIQUE(user_id, work_id)\n);\n\n-- Create indexes for favorites\nCREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);\nCREATE INDEX IF NOT EXISTS idx_favorites_work_id ON favorites(work_id);\n\n-- ==========================================================================\n-- VIEW: USER_PUBLIC_WORKS\n-- ==========================================================================\n-- This view shows public works for each user\nCREATE OR REPLACE VIEW user_public_works AS\nSELECT \n  w.id,\n  w.user_id,\n  w.category_id,\n  w.title,\n  w.description,\n  w.thumbnail_url,\n  w.view_count,\n  w.like_count,\n  w.comment_count,\n  w.created_at,\n  c.name AS category_name\nFROM works w\nLEFT JOIN categories c ON w.category_id = c.id\nWHERE w.is_public = true AND w.status = 'published';\n\n-- ==========================================================================\n-- VIEW: TRENDING_WORKS\n-- ==========================================================================\n-- This view shows trending works based on views and likes\nCREATE OR REPLACE VIEW trending_works AS\nSELECT \n  w.id,\n  w.user_id,\n  w.title,\n  w.thumbnail_url,\n  w.view_count,\n  w.like_count,\n  (w.view_count + w.like_count * 2) AS trending_score,\n  w.created_at\nFROM works w\nWHERE w.is_public = true AND w.status = 'published'\nORDER BY trending_score DESC, w.created_at DESC;\n\n-- ==========================================================================\n-- Database Schema Creation Complete (Including Works System)\n-- ==========================================================================
