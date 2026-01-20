-- 优化数据库索引，添加缺失的必要索引

-- 1. works表优化
-- 为user_id和creator_id添加索引（支持两种id命名方式）
CREATE INDEX IF NOT EXISTS idx_works_user_id ON works(user_id);
CREATE INDEX IF NOT EXISTS idx_works_creator_id ON works(creator_id);
-- 为category和category_id添加索引
CREATE INDEX IF NOT EXISTS idx_works_category ON works(category);
CREATE INDEX IF NOT EXISTS idx_works_category_id ON works(category_id);
-- 为created_at添加索引，支持按创建时间排序
CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at DESC);
-- 为updated_at添加索引
CREATE INDEX IF NOT EXISTS idx_works_updated_at ON works(updated_at DESC);
-- 为status添加索引，支持按状态过滤
CREATE INDEX IF NOT EXISTS idx_works_status ON works(status);
-- 为is_public和is_featured添加索引
CREATE INDEX IF NOT EXISTS idx_works_is_public ON works(is_public);
CREATE INDEX IF NOT EXISTS idx_works_is_featured ON works(is_featured);
-- 为tags数组添加GIN索引，支持快速标签查询
CREATE INDEX IF NOT EXISTS idx_works_tags ON works USING GIN(tags);
-- 为content JSONB添加GIN索引，支持快速JSON查询
CREATE INDEX IF NOT EXISTS idx_works_content ON works USING GIN(content);

-- 2. posts表优化
-- 为user_id添加索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
-- 为created_at添加索引
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
-- 为tags数组添加GIN索引
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

-- 3. comments表优化
-- 为user_id添加索引
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
-- 为work_id添加索引（支持两种id类型）
CREATE INDEX IF NOT EXISTS idx_comments_work_id_uuid ON comments(work_id);
CREATE INDEX IF NOT EXISTS idx_comments_work_id_int ON comments(work_id);
-- 为post_id添加索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
-- 为parent_id添加索引，支持多级评论查询
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
-- 为created_at添加索引
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 4. likes表优化
-- 为user_id添加索引
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
-- 为work_id添加索引（支持两种id类型）
CREATE INDEX IF NOT EXISTS idx_likes_work_id_uuid ON likes(work_id);
CREATE INDEX IF NOT EXISTS idx_likes_work_id_int ON likes(work_id);
-- 为post_id添加索引
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
-- 为comment_id添加索引
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);

-- 5. users表优化
-- 为username添加唯一索引，支持快速登录查询
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
-- 为email添加唯一索引，支持快速邮箱查询
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- 为created_at添加索引
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 6. user_interest_tags表优化
-- 为tag和interest_score添加复合索引，支持按标签和兴趣分数查询
CREATE INDEX IF NOT EXISTS idx_user_interest_tags_tag_score ON user_interest_tags(tag, interest_score DESC);
-- 为updated_at添加索引
CREATE INDEX IF NOT EXISTS idx_user_interest_tags_updated_at ON user_interest_tags(updated_at DESC);

-- 7. data_sync_configs表优化
-- 为sync_type和is_active添加复合索引，支持按同步类型和状态查询
CREATE INDEX IF NOT EXISTS idx_data_sync_configs_type_active ON data_sync_configs(sync_type, is_active);
-- 为last_sync_time添加索引
CREATE INDEX IF NOT EXISTS idx_data_sync_configs_last_sync ON data_sync_configs(last_sync_time DESC);

-- 8. backup_configs表优化
-- 为backup_type和is_active添加复合索引
CREATE INDEX IF NOT EXISTS idx_backup_configs_type_active ON backup_configs(backup_type, is_active);

-- 9. performance_metrics表优化
-- 为metric_name和created_at添加复合索引，支持按指标名称和时间范围查询
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_time ON performance_metrics(metric_name, created_at DESC);

-- 10. alert_rules表优化
-- 为metric_name和is_active添加复合索引
CREATE INDEX IF NOT EXISTS idx_alert_rules_metric_active ON alert_rules(metric_name, is_active);

-- 11. alert_logs表优化
-- 为alert_level和is_resolved添加复合索引，支持按告警级别和解决状态查询
CREATE INDEX IF NOT EXISTS idx_alert_logs_level_resolved ON alert_logs(alert_level, is_resolved);

-- 12. data_quality_rules表优化
-- 为table_name和is_active添加复合索引，支持按表名和状态查询
CREATE INDEX IF NOT EXISTS idx_data_quality_rules_table_active ON data_quality_rules(table_name, is_active);
-- 为check_type添加索引
CREATE INDEX IF NOT EXISTS idx_data_quality_rules_check_type ON data_quality_rules(check_type);

-- 13. query_cache表优化
-- 为cache_time和expire_time添加复合索引，支持按缓存时间和过期时间查询
CREATE INDEX IF NOT EXISTS idx_query_cache_time_range ON query_cache(cache_time DESC, expire_time DESC);
-- 为hit_count添加索引，支持按命中次数查询
CREATE INDEX IF NOT EXISTS idx_query_cache_hit_count ON query_cache(hit_count DESC);

-- 14. favorites表优化
-- 为user_id和created_at添加复合索引，支持按用户和创建时间查询
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at DESC);

-- 15. work_tags表优化
-- 为tag_id添加索引，支持按标签查询作品
CREATE INDEX IF NOT EXISTS idx_work_tags_tag_id ON work_tags(tag_id);

-- 16. categories表优化
-- 为parent_id添加索引，支持多级分类查询
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
-- 为is_active添加索引
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- 17. tags表优化
-- 为name添加唯一索引，支持快速标签查询
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
-- 为is_active添加索引
CREATE INDEX IF NOT EXISTS idx_tags_is_active ON tags(is_active);
