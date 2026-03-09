-- 创建所有表（包含完整列结构）
-- 用于导入 CSV 数据

-- 先删除所有表（按依赖顺序反向删除）
DROP TABLE IF EXISTS public.checkin_records CASCADE;
DROP TABLE IF EXISTS public.points_records CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.works CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 创建完整的 users 表
CREATE TABLE public.users (
    id uuid PRIMARY KEY,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text,
    phone text,
    avatar_url text,
    interests text,
    age integer,
    tags text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    github_id text,
    github_username text,
    auth_provider text,
    is_new_user boolean DEFAULT false,
    membership_level text,
    membership_status text,
    membership_start timestamp with time zone,
    membership_end timestamp with time zone,
    posts_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    views integer DEFAULT 0,
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    email_login_code text,
    email_login_expires timestamp with time zone,
    bio text,
    location text,
    occupation text,
    website text,
    social_links jsonb DEFAULT '{}',
    github text,
    twitter text,
    cover_image text,
    metadata jsonb DEFAULT '{}',
    is_admin boolean DEFAULT false,
    role text DEFAULT 'user',
    is_verified boolean DEFAULT false,
    status text DEFAULT 'active'
);

-- 创建 works 表
CREATE TABLE public.works (
    id uuid PRIMARY KEY,
    author_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    content jsonb DEFAULT '{}',
    thumbnail text,
    cover_url text,
    status text DEFAULT 'draft',
    visibility text DEFAULT 'private',
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 创建 posts 表
CREATE TABLE public.posts (
    id uuid PRIMARY KEY,
    author_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    attachments jsonb DEFAULT '[]',
    status text DEFAULT 'published',
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 创建 events 表
CREATE TABLE public.events (
    id uuid PRIMARY KEY,
    organizer_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    cover_url text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    location text,
    status text DEFAULT 'upcoming',
    max_participants integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 创建 communities 表
CREATE TABLE public.communities (
    id uuid PRIMARY KEY,
    creator_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    avatar_url text,
    cover_url text,
    member_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 创建 products 表
CREATE TABLE public.products (
    id uuid PRIMARY KEY,
    seller_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric(10, 2) NOT NULL,
    stock integer DEFAULT 0,
    images jsonb DEFAULT '[]',
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 创建 comments 表
CREATE TABLE public.comments (
    id uuid PRIMARY KEY,
    author_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    work_id uuid REFERENCES public.works(id) ON DELETE CASCADE,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    content text NOT NULL,
    parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 创建 likes 表
CREATE TABLE public.likes (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    work_id uuid REFERENCES public.works(id) ON DELETE CASCADE,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, work_id),
    UNIQUE(user_id, post_id)
);

-- 创建 bookmarks 表
CREATE TABLE public.bookmarks (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    work_id uuid REFERENCES public.works(id) ON DELETE CASCADE,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, work_id),
    UNIQUE(user_id, post_id)
);

-- 创建 follows 表
CREATE TABLE public.follows (
    id uuid PRIMARY KEY,
    follower_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    following_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- 创建 messages 表
CREATE TABLE public.messages (
    id uuid PRIMARY KEY,
    sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 创建 notifications 表
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    content text,
    is_read boolean DEFAULT false,
    data jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- 创建 community_members 表
CREATE TABLE public.community_members (
    id uuid PRIMARY KEY,
    community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(community_id, user_id)
);

-- 创建 points_records 表
CREATE TABLE public.points_records (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    points integer NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- 创建 checkin_records 表
CREATE TABLE public.checkin_records (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    checkin_date date NOT NULL,
    points_earned integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, checkin_date)
);

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_records ENABLE ROW LEVEL SECURITY;

-- 创建基本 RLS 策略
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Works are viewable by everyone" ON public.works FOR SELECT USING (true);
CREATE POLICY "Users can insert own works" ON public.works FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own works" ON public.works FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Users can manage own products" ON public.products FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON public.likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Bookmarks are viewable by owner" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Messages are viewable by participants" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Notifications are viewable by owner" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Community members are viewable by everyone" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Points records are viewable by owner" ON public.points_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Checkin records are viewable by owner" ON public.checkin_records FOR SELECT USING (auth.uid() = user_id);
