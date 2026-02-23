-- ==========================================================================
-- ANALYTICS TABLES
-- ==========================================================================
-- These tables store analytics data for admin dashboard

-- ==========================================================================
-- USER_DEVICES TABLE
-- ==========================================================================
-- This table tracks user device information for analytics
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  device_name VARCHAR(100),
  user_agent TEXT,
  ip_address INET,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_devices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_type ON user_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_user_devices_first_seen_at ON user_devices(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen_at ON user_devices(last_seen_at);

-- ==========================================================================
-- TRAFFIC_SOURCES TABLE
-- ==========================================================================
-- This table tracks traffic sources for analytics
CREATE TABLE IF NOT EXISTS traffic_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('direct', 'search', 'social', 'referral', 'email', 'other')),
  source_name VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  referrer_url TEXT,
  landing_page TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for traffic_sources
CREATE INDEX IF NOT EXISTS idx_traffic_sources_user_id ON traffic_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_source_type ON traffic_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_created_at ON traffic_sources(created_at);

-- ==========================================================================
-- USER_ACTIVITIES TABLE
-- ==========================================================================
-- This table tracks detailed user activities for analytics
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  activity_name VARCHAR(100),
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_activities
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- ==========================================================================
-- ANALYTICS DAILY STATS TABLE
-- ==========================================================================
-- This table stores aggregated daily statistics
CREATE TABLE IF NOT EXISTS analytics_daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_date DATE NOT NULL UNIQUE,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_works INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0, -- in seconds
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics_daily_stats
CREATE INDEX IF NOT EXISTS idx_analytics_daily_stats_date ON analytics_daily_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_stats_created_at ON analytics_daily_stats(created_at);

-- ==========================================================================
-- ANALYTICS HOURLY STATS TABLE
-- ==========================================================================
-- This table stores aggregated hourly statistics
CREATE TABLE IF NOT EXISTS analytics_hourly_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_hour TIMESTAMP WITH TIME ZONE NOT NULL,
  active_users INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  api_requests INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0, -- in milliseconds
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics_hourly_stats
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_stats_hour ON analytics_hourly_stats(stat_hour);
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_stats_created_at ON analytics_hourly_stats(created_at);

-- ==========================================================================
-- PAGE_VIEWS TABLE
-- ==========================================================================
-- This table tracks page views for detailed analytics
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  page_path TEXT NOT NULL,
  page_title VARCHAR(255),
  referrer TEXT,
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  ip_address INET,
  duration INTEGER DEFAULT 0, -- time spent on page in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for page_views
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);

-- ==========================================================================
-- API_USAGE TABLE
-- ==========================================================================
-- This table tracks API usage for monitoring
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time INTEGER, -- in milliseconds
  request_size INTEGER,
  response_size INTEGER,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for api_usage
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON api_usage(status_code);

-- ==========================================================================
-- ANALYTICS TABLES CREATION COMPLETE
-- ==========================================================================
