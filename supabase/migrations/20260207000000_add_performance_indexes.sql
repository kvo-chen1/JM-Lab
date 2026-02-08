-- 性能优化索引迁移
-- 添加复合索引和优化查询性能的索引

-- 1. posts表复合索引优化
-- 用于首页feed查询：按作者和时间排序
CREATE INDEX IF NOT EXISTS idx_posts_author_created 
ON public.posts(author_id, created_at DESC);

-- 用于按状态筛选的查询
CREATE INDEX IF NOT EXISTS idx_posts_status_created 
ON public.posts(status, created_at DESC);

-- 用于分类筛选查询
CREATE INDEX IF NOT EXISTS idx_posts_category_created 
ON public.posts(category, created_at DESC);

-- 2. messages表复合索引优化
-- 用于社群聊天查询
CREATE INDEX IF NOT EXISTS idx_messages_community_created 
ON public.messages(community_id, created_at DESC);

-- 用于频道消息查询
CREATE INDEX IF NOT EXISTS idx_messages_channel_created 
ON public.messages(channel_id, created_at DESC);

-- 用于私信查询
CREATE INDEX IF NOT EXISTS idx_messages_private 
ON public.messages(sender_id, receiver_id, created_at DESC);

-- 3. comments表复合索引优化
-- 用于帖子评论查询
CREATE INDEX IF NOT EXISTS idx_comments_post_created 
ON public.comments(post_id, created_at DESC);

-- 4. likes表复合索引优化
-- 用于查询用户点赞记录
CREATE INDEX IF NOT EXISTS idx_likes_user_created 
ON public.likes(user_id, created_at DESC);

-- 5. follows表复合索引优化
-- 用于查询关注列表
CREATE INDEX IF NOT EXISTS idx_follows_follower_created 
ON public.follows(follower_id, created_at DESC);

-- 用于查询粉丝列表
CREATE INDEX IF NOT EXISTS idx_follows_following_created 
ON public.follows(following_id, created_at DESC);

-- 6. friend_requests表复合索引优化
-- 用于查询好友请求
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status 
ON public.friend_requests(receiver_id, status, created_at DESC);

-- 7. user_history表复合索引优化
-- 用于查询用户历史记录
CREATE INDEX IF NOT EXISTS idx_user_history_user_timestamp 
ON public.user_history(user_id, timestamp DESC);

-- 用于按动作类型查询
CREATE INDEX IF NOT EXISTS idx_user_history_user_action 
ON public.user_history(user_id, action_type, timestamp DESC);

-- 8. 添加全文搜索索引（用于搜索功能）
-- posts表标题和内容全文搜索
CREATE INDEX IF NOT EXISTS idx_posts_fulltext 
ON public.posts USING gin(to_tsvector('chinese', title || ' ' || COALESCE(content, '')));

-- users表用户名全文搜索
CREATE INDEX IF NOT EXISTS idx_users_username_fulltext 
ON public.users USING gin(to_tsvector('chinese', username || ' ' || COALESCE(bio, '')));

-- 9. 添加部分索引（用于特定查询优化）
-- 只索引已发布的帖子
CREATE INDEX IF NOT EXISTS idx_posts_published 
ON public.posts(created_at DESC) 
WHERE status = 'published';

-- 只索引未读消息
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON public.messages(receiver_id, created_at DESC) 
WHERE is_read = false;

-- 10. 优化查询统计信息更新
-- 确保表的统计信息是最新的
ANALYZE public.posts;
ANALYZE public.comments;
ANALYZE public.likes;
ANALYZE public.follows;
ANALYZE public.messages;
ANALYZE public.friend_requests;
ANALYZE public.user_history;

-- 添加注释说明
COMMENT ON INDEX idx_posts_author_created IS '优化用户帖子列表查询';
COMMENT ON INDEX idx_posts_status_created IS '优化按状态筛选帖子查询';
COMMENT ON INDEX idx_messages_community_created IS '优化社群聊天消息查询';
COMMENT ON INDEX idx_messages_channel_created IS '优化频道消息查询';
COMMENT ON INDEX idx_user_history_user_timestamp IS '优化用户历史记录查询';
COMMENT ON INDEX idx_posts_fulltext IS '支持帖子标题和内容全文搜索';
