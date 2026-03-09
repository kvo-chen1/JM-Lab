# 数据导入顺序指南

## 📊 文件统计

总共 207 个表的数据文件，已按表名分割保存到 `data_by_table/` 目录。

### 超大文件（需要进一步分割）
| 文件名 | 大小 | 说明 |
|--------|------|------|
| 021_audit_logs.sql | 5.98 MB | 审计日志，数据量大 |
| 197_users.sql | 1.50 MB | 用户数据 |
| 123_page_views.sql | 1.10 MB | 页面访问记录 |
| 207_works_likes.sql | 893 KB | 作品点赞数据 |
| 091_inspiration_nodes.sql | 621 KB | 灵感节点数据 |
| 166_traffic_sources.sql | 364 KB | 流量来源数据 |

### 导入顺序（重要！）

**第一优先级 - 基础表（无外键依赖）:**
1. `001_achievement_configs.sql` - 成就配置
2. `006_admin_roles.sql` - 管理员角色
3. `035_categories.sql` - 分类
4. `057_creator_level_configs.sql` - 创作者等级配置
5. `101_lottery_prizes.sql` - 抽奖奖品
6. `128_points_rules.sql` - 积分规则
7. `165_tianjin_templates.sql` - 天津模板
8. `197_users.sql` - 用户数据 ⚠️ 大文件

**第二优先级 - 用户相关表:**
9. `003_admin_accounts.sql` - 管理员账号
10. `014_ai_user_settings.sql` - AI用户设置
15. `037_checkin_records.sql` - 签到记录
16. `047_community_members.sql` - 社群成员
25. `082_follows.sql` - 关注关系
26. `085_friends.sql` - 好友关系

**第三优先级 - 内容表:**
30. `041_communities.sql` - 社群
31. `048_community_posts.sql` - 社群帖子
32. `072_events.sql` - 活动
33. `090_inspiration_mindmaps.sql` - 灵感思维导图
34. `091_inspiration_nodes.sql` - 灵感节点 ⚠️ 大文件
35. `130_posts.sql` - 帖子
36. `133_products.sql` - 产品
37. `205_works.sql` - 作品

**第四优先级 - 关联表（需要前面表的数据）:**
40. `023_bookmarks.sql` - 收藏
41. `039_comments.sql` - 评论
42. `074_favorites.sql` - 喜欢
43. `099_likes.sql` - 点赞
44. `207_works_likes.sql` - 作品点赞 ⚠️ 大文件

**第五优先级 - 日志和统计表:**
50. `021_audit_logs.sql` - 审计日志 ⚠️ 超大文件
51. `123_page_views.sql` - 页面访问 ⚠️ 大文件
52. `166_traffic_sources.sql` - 流量来源 ⚠️ 大文件

## 🔧 导入步骤

### 步骤 1: 先创建表结构
在 Supabase SQL Editor 中执行：
```sql
-- 执行 create_all_tables_full.sql
```

### 步骤 2: 按顺序导入数据
1. 先导入小文件（< 100KB）
2. 再导入中等文件（100KB - 500KB）
3. 最后处理大文件（> 500KB）

### 步骤 3: 处理超大文件
对于超过 1MB 的文件，需要进一步分割：
- `021_audit_logs.sql` (5.98MB) - 按 1000 行分割
- `197_users.sql` (1.50MB) - 可能需要分割
- `123_page_views.sql` (1.10MB) - 可能需要分割
- `207_works_likes.sql` (893KB) - 可能需要分割

## ⚠️ 注意事项

1. **users 表必须先导入**，因为很多表有外键依赖
2. **如果导入失败**，检查是否因为外键约束，需要调整导入顺序
3. **大文件导入**，Supabase SQL Editor 可能有大小限制，需要分割
4. **空表可以跳过**，很多表只有 COPY 语句没有实际数据

## 📁 文件位置

所有分割后的文件保存在：`c:\git-repo\data_by_table\`
