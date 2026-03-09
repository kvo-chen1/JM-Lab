-- 修复缺失的列和表

-- 1. 为 events 表添加 visibility 列
ALTER TABLE IF EXISTS public.events
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';

-- 2. 创建 hot_searches 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.hot_searches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword text NOT NULL,
    search_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. 创建 user_participation_details 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.user_participation_details (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
    status text DEFAULT 'registered',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, event_id)
);

-- 4. 为 works 表添加缺失的列（如果存在）
ALTER TABLE IF EXISTS public.works
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published',
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';

-- 5. 为 posts 表添加缺失的列（如果存在）
ALTER TABLE IF EXISTS public.posts
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published',
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public';

-- 6. 为 notifications 表添加缺失的列（如果存在）
ALTER TABLE IF EXISTS public.notifications
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 7. 为 friend_requests 表添加 created_at 列（如果不存在）
ALTER TABLE IF EXISTS public.friend_requests
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 8. 为 direct_messages 表添加 is_read 列（如果不存在）
ALTER TABLE IF EXISTS public.direct_messages
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 9. 为 brand_partnerships 表添加缺失的列
ALTER TABLE IF EXISTS public.brand_partnerships
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 10. 为 user_points_balance 表添加缺失的列
ALTER TABLE IF EXISTS public.user_points_balance
ADD COLUMN IF NOT EXISTS balance integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 11. 为 user_status 表添加缺失的列（如果不存在）
CREATE TABLE IF NOT EXISTS public.user_status (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    status text DEFAULT 'online',
    last_seen timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_hot_searches_is_active ON public.hot_searches(is_active);
CREATE INDEX IF NOT EXISTS idx_hot_searches_search_count ON public.hot_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_works_status ON public.works(status);
CREATE INDEX IF NOT EXISTS idx_works_visibility ON public.works(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 插入一些测试数据
INSERT INTO public.hot_searches (keyword, search_count, is_active) VALUES
('天津文化', 1000, true),
('创意设计', 850, true),
('摄影技巧', 720, true),
('文学创作', 650, true),
('美食探店', 900, true)
ON CONFLICT DO NOTHING;

-- 更新现有 events 的 visibility
UPDATE public.events SET visibility = 'public' WHERE visibility IS NULL;

-- 更新现有 works 的 status 和 visibility
UPDATE public.works SET status = 'published' WHERE status IS NULL;
UPDATE public.works SET visibility = 'public' WHERE visibility IS NULL;

-- 更新现有 posts 的 status 和 visibility
UPDATE public.posts SET status = 'published' WHERE status IS NULL;
UPDATE public.posts SET visibility = 'public' WHERE visibility IS NULL;

-- 更新现有 notifications 的 is_read
UPDATE public.notifications SET is_read = false WHERE is_read IS NULL;

-- 更新 existing friend_requests 的 created_at
UPDATE public.friend_requests SET created_at = now() WHERE created_at IS NULL;

-- 更新 existing direct_messages 的 is_read
UPDATE public.direct_messages SET is_read = false WHERE is_read IS NULL;

-- 更新 existing brand_partnerships 的 status
UPDATE public.brand_partnerships SET status = 'approved' WHERE status IS NULL;
UPDATE public.brand_partnerships SET created_at = now() WHERE created_at IS NULL;

-- 更新 existing user_points_balance
UPDATE public.user_points_balance SET balance = 0 WHERE balance IS NULL;
UPDATE public.user_points_balance SET updated_at = now() WHERE updated_at IS NULL;
