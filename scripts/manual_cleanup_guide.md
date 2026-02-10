# 手动删除不用的表格指南

由于 Supabase 免费套餐出口流量已超限，无法通过 SQL Editor 执行大量删除操作。

## 手动删除步骤（推荐）

### 方法：在 Table Editor 中逐个删除

1. **打开 Supabase 控制台**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目

2. **进入 Table Editor**
   - 点击左侧菜单 "Database" → "Tables"

3. **逐个删除以下表格**
   
   按优先级删除（先删除确定不用的）：
   
   **批次 1：备份表（3个）**
   - `work_comments_backup`
   - `works_backup`
   - `users_backup`
   
   **批次 2：重复表（2个）**
   - `works_bookmarks`（代码使用 `work_bookmarks`）
   - `works_likes`（代码使用 `work_likes`）
   
   **批次 3：天津特色表（4个）**
   - `tianjin_hotspots`
   - `tianjin_offline_experiences`
   - `tianjin_templates`
   - `tianjin_traditional_brands`
   
   **批次 4：模板相关（2个）**
   - `template_favorites`
   - `template_likes`
   
   **批次 5：其他未用表（11个）**
   - `scheduled_posts`
   - `tags`
   - `task_records`
   - `user_achievements`
   - `user_active_conversations`
   - `user_history`
   - `user_points_balance`
   - `user_progress`
   - `user_stats`
   - `user_status`
   - `user_total_points`
   - `video_tasks`

4. **删除操作步骤**
   - 在 Table Editor 中找到表格
   - 点击表格名称右侧的三个点 "..."
   - 选择 "Delete table"
   - 确认删除
   - 等待 10-30 秒后再删除下一个表格

## 注意事项

1. **不要删除以下表格**（代码正在使用）：
   - `users`
   - `works`
   - `work_comments`
   - `work_likes`
   - `work_bookmarks`
   - `favorites`
   - `friends`
   - `messages`
   - `follows`
   - `communities`
   - `community_members`
   - `posts`
   - `comments`
   - `user_sessions`
   - `events`
   - `event_participants`
   - `event_submissions`
   - `notifications`
   - `user_activities`

2. **如果删除错误**
   - 免费套餐不支持备份恢复
   - 需要重新创建表格结构
   - 数据将无法恢复

3. **流量限制**
   - 每次删除操作后等待 10-30 秒
   - 如果看到 "Too Many Requests" 错误，等待 1 小时后再试

## 预期效果

删除约 23 个不用的表格后：
- 减少数据库大小
- 减少查询时的数据扫描量
- 降低 Supabase 出口流量使用
- 提高查询性能

## 替代方案

如果手动删除也触发流量限制：

1. **等待 2 月 23 日** - 流量配额自动重置
2. **升级 Pro 计划** - $25/月，获得 100GB 流量
3. **联系 Supabase 支持** - 请求临时增加流量配额
