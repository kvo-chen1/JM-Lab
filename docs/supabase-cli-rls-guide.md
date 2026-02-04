# 使用 Supabase CLI 管理 RLS 和数据库迁移

## 概述
是的，**Supabase CLI 可以直接帮助你搞定 RLS 配置和数据库迁移**。Supabase CLI 提供了一套完整的工具，用于管理数据库 schema 变更，包括启用 RLS、创建 RLS 策略、修改表结构等。

## Supabase CLI 能做什么？

1. **创建和管理迁移文件**：使用 SQL 编写数据库变更，版本控制
2. **启用和配置 RLS**：通过迁移文件启用 RLS 并创建策略
3. **自动应用迁移**：确保开发、测试和生产环境的数据库一致性
4. **回滚和重置**：轻松回滚到之前的数据库状态
5. **与 CI/CD 集成**：自动化部署数据库变更

## 如何使用 Supabase CLI 配置 RLS？

### 1. 初始化 Supabase 项目

```bash
# 安装 Supabase CLI
npm install -g supabase

# 初始化 Supabase 项目
supabase init
```

### 2. 创建包含 RLS 配置的迁移文件

创建一个新的迁移文件，包含 RLS 配置：

```bash
supabase migration new enable_rls_for_all_tables
```

编辑迁移文件（位于 `supabase/migrations/` 目录）：

```sql
-- supabase/migrations/20251230000001_enable_rls_for_all_tables.sql

-- 为 users 表启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 为 users 表创建 RLS 策略
CREATE POLICY "Allow users to view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 为 posts 表启用 RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 为 posts 表创建 RLS 策略
CREATE POLICY "Allow public read access to posts" ON public.posts
    FOR SELECT USING (true);

CREATE POLICY "Allow users to create their own posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- 为其他表添加类似的 RLS 配置
-- 社区成员表
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow members to view community memberships" ON public.community_members
    FOR SELECT USING (auth.uid() = user_id);

-- 评论表
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to comments" ON public.comments
    FOR SELECT USING (true);
CREATE POLICY "Allow users to create their own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- 点赞表
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view their own likes" ON public.likes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to create their own likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- 收藏表
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view their own collections" ON public.collections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to create their own collections" ON public.collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own collections" ON public.collections
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own collections" ON public.collections
    FOR DELETE USING (auth.uid() = user_id);

-- 消息表
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Allow users to send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Allow users to update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);
```

### 3. 链接到现有 Supabase 项目

```bash
supabase link --project-ref <your-project-ref>
# 例如：supabase link --project-ref pptqdicaaewtnaiflfcs
```

### 4. 应用迁移

```bash
# 将迁移推送到远程 Supabase 数据库
supabase db push
```

### 5. 验证 RLS 配置

```bash
# 检查迁移状态
supabase migration list

# 查看数据库 schema
supabase db schema
```

## Supabase CLI 迁移的优势

1. **版本控制**：所有数据库变更都保存在迁移文件中，便于跟踪和回滚
2. **环境一致性**：确保开发、测试和生产环境的数据库结构完全一致
3. **自动化部署**：可以与 GitHub Actions 集成，实现自动部署
4. **减少人为错误**：避免手动修改数据库导致的错误
5. **团队协作**：多个开发者可以协作管理数据库 schema

## 如何处理现有数据库？

如果你的数据库已经有一些表和数据，Supabase CLI 仍然可以使用：

1. **初始化迁移**：创建初始迁移文件，包含现有表结构
2. **增量变更**：后续的变更通过新的迁移文件添加
3. **数据迁移**：如果需要迁移数据，可以在迁移文件中添加 SQL 脚本

## 与 Supabase Dashboard 的区别

| 特性 | Supabase CLI | Supabase Dashboard |
|------|--------------|-------------------|
| 版本控制 | ✅ 支持 | ❌ 不支持 |
| 自动化部署 | ✅ 支持 | ❌ 手动操作 |
| 回滚和重置 | ✅ 支持 | ❌ 有限支持 |
| 团队协作 | ✅ 支持 | ❌ 有限支持 |
| 复杂变更管理 | ✅ 支持 | ❌ 有限支持 |
| 快速原型开发 | ❌ 较慢 | ✅ 快速 |

## 最佳实践

1. **始终使用迁移**：所有数据库变更都应该通过迁移文件进行
2. **编写清晰的迁移名称**：使用描述性的名称，如 `create_users_table` 或 `enable_rls_for_posts`
3. **测试迁移**：在开发环境测试迁移，确保它们能正确执行
4. **备份数据**：在应用迁移之前，备份重要数据
5. **使用事务**：在迁移文件中使用事务，确保变更的原子性

## 常见问题

### 1. 迁移失败怎么办？

- 查看错误信息，修复迁移文件
- 使用 `supabase db rollback` 回滚到之前的状态
- 重新应用迁移

### 2. 如何处理数据依赖？

- 使用事务确保相关变更的原子性
- 按照正确的顺序编写迁移文件
- 考虑使用种子数据（seed data）初始化必要数据

### 3. 如何管理敏感数据？

- 不要在迁移文件中包含敏感数据
- 使用环境变量存储敏感信息
- 限制数据库访问权限

## 总结

是的，**Supabase CLI 可以直接帮助你搞定 RLS 配置和数据库迁移**。通过使用 Supabase CLI，你可以：

1. 版本控制数据库 schema
2. 自动应用数据库变更
3. 确保环境一致性
4. 简化团队协作
5. 提高数据库安全性

如果你刚开始使用 Supabase CLI，建议从简单的迁移开始，逐步掌握其功能。随着项目的发展，Supabase CLI 将成为你管理数据库的重要工具。