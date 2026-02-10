# 禁用 RLS（Row Level Security）指南

禁用不需要权限检查的表格的行级安全，减少查询开销。

## 什么是 RLS

RLS（Row Level Security）是 PostgreSQL 的行级安全功能，用于控制用户能访问哪些数据行。每次查询时都需要检查权限，会增加查询开销。

## 哪些表格可以禁用 RLS

### 可以禁用 RLS 的表格（公开数据）：

1. **works** - 作品列表（公开浏览）
2. **events** - 活动列表（公开浏览）
3. **communities** - 社群列表（公开浏览）
4. **posts** - 帖子列表（公开浏览）
5. **comments** - 评论列表（公开浏览）
6. **work_comments** - 作品评论（公开浏览）
7. **user_activities** - 用户活动（公开数据）

### 必须保留 RLS 的表格（敏感数据）：

1. **users** - 用户信息（敏感）
2. **messages** - 私信（私密）
3. **notifications** - 通知（个人）
4. **friends** - 好友关系（私密）
5. **follows** - 关注关系（私密）
6. **favorites** - 收藏（个人）
7. **work_likes** - 点赞（个人）
8. **work_bookmarks** - 书签（个人）
9. **user_sessions** - 会话（敏感）
10. **event_participants** - 活动参与（个人）
11. **event_submissions** - 活动提交（个人）
12. **community_members** - 社群成员（个人）

## 操作步骤

### 方法 1：在 Table Editor 中禁用（推荐）

1. **打开 Supabase 控制台**
   - 访问 https://supabase.com/dashboard
   - 选择你的项目

2. **进入 Table Editor**
   - 点击左侧菜单 "Database" → "Tables"

3. **逐个禁用 RLS**
   
   对于每个可以禁用 RLS 的表格：
   
   a. 点击表格名称（如 `works`）
   b. 点击右上角的 "Policies"（策略）
   c. 找到 "Enable RLS" 开关
   d. 关闭开关（Disable）
   e. 确认禁用

4. **重复操作**
   - 对 `events`、`communities`、`posts`、`comments`、`work_comments`、`user_activities` 重复上述步骤

### 方法 2：使用 SQL 禁用

在 Supabase SQL Editor 中执行：

```sql
-- 禁用公开表格的 RLS
ALTER TABLE public.works DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities DISABLE ROW LEVEL SECURITY;

-- 验证 RLS 状态
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

## 预期效果

- 减少查询时的权限检查开销
- 降低数据库 CPU 使用
- 提高查询性能
- 减少出口流量（因为查询更快）

## 安全注意事项

1. **只禁用公开数据表格** - 敏感数据表格必须保留 RLS
2. **测试验证** - 禁用后测试公开访问是否正常
3. **监控异常** - 关注是否有未授权访问

## 如果出现问题

如果禁用 RLS 后发现安全问题：

```sql
-- 重新启用 RLS
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
-- ... 其他表格
```

## 替代方案

如果担心安全问题：

1. **使用视图（View）** - 创建公开数据的视图，只暴露必要字段
2. **API 层控制** - 在 API 层进行权限控制，不依赖 RLS
3. **保持 RLS 但优化** - 简化 RLS 策略，减少复杂查询
