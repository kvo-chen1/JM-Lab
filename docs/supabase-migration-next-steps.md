# Supabase 迁移后续步骤指南

## 当前状态总结

- ✅ 已创建 Supabase CLI 安装和配置指南
- ✅ 已创建 RLS 配置示例和迁移文件
- ✅ 已解释 Supabase CLI 迁移的优势和最佳实践

现在，让我们继续完成迁移流程，并确保所有配置都正确应用。

## 1. 安装和初始化 Supabase CLI

### 安装 Supabase CLI

```bash
# 使用 npm 安装（推荐）
npm install -g supabase

# 或者使用 yarn
yarn global add supabase

# 验证安装
supabase --version
```

### 初始化 Supabase 项目

```bash
# 在项目根目录初始化
supabase init
```

这将创建一个 `supabase` 目录，包含：
- `migrations/` - 存放迁移文件的目录
- `config.toml` - Supabase CLI 配置文件
- `seed.sql` - 种子数据文件

## 2. 链接到现有 Supabase 项目

### 获取项目引用 ID

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 查看浏览器地址栏，URL 格式为：`https://supabase.com/dashboard/project/<your-project-ref>`
4. 复制 `<your-project-ref>` 部分（例如：`your-project-ref`）

### 链接项目

```bash
supabase link --project-ref <your-project-ref>
# 例如：supabase link --project-ref your-project-ref
```

系统会提示你输入数据库密码，这是你的 Supabase 项目的数据库密码。

## 3. 创建并应用 RLS 迁移

### 创建迁移文件

```bash
supabase migration new enable_rls_and_fix_constraints
```

### 编辑迁移文件

打开创建的迁移文件（位于 `supabase/migrations/` 目录），添加以下内容：

```sql
-- supabase/migrations/20251230000002_enable_rls_and_fix_constraints.sql

-- 修复 users 表的外键约束问题
-- 如果外键约束不存在，则创建它
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_id_fkey') THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 为所有表启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- 为 users 表创建 RLS 策略
CREATE POLICY IF NOT EXISTS "Allow users to view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Allow users to update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 为 posts 表创建 RLS 策略
CREATE POLICY IF NOT EXISTS "Allow public read access to posts" ON public.posts
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow users to create their own posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to update their own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to delete their own posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- 为 comments 表创建 RLS 策略
CREATE POLICY IF NOT EXISTS "Allow public read access to comments" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow users to create their own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- 为 likes 表创建 RLS 策略
CREATE POLICY IF NOT EXISTS "Allow users to view their own likes" ON public.likes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to create their own likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Allow users to delete their own likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);
```

## 4. 应用迁移到数据库

### 验证迁移文件

```bash
# 检查迁移文件语法
# 注意：Supabase CLI 没有内置的语法检查，但你可以使用 PostgreSQL 客户端检查
```

### 应用迁移

```bash
# 将迁移推送到远程 Supabase 数据库
supabase db push
```

### 验证迁移状态

```bash
# 查看迁移历史
supabase migration list

# 查看当前数据库 schema
supabase db schema
```

## 5. 测试 RLS 配置

### 使用 Supabase CLI 测试

```bash
# 启动本地 Supabase 实例（可选，用于本地测试）
supabase start

# 使用 SQL 测试 RLS
supabase sql -c "SELECT * FROM public.users" --role anon
```

### 使用 Supabase Dashboard 测试

1. 登录 Supabase Dashboard
2. 进入 "SQL Editor"
3. 编写测试查询：
   ```sql
   -- 以匿名用户身份测试
   SET ROLE anon;
   SELECT * FROM public.users;
   -- 应该只返回当前用户的数据或空结果
   
   -- 以认证用户身份测试
   SET ROLE authenticated;
   SELECT * FROM public.users;
   -- 应该只返回当前用户的数据
   ```

## 6. 配置种子数据（可选）

编辑 `supabase/seed.sql` 文件，添加初始数据：

```sql
-- supabase/seed.sql

-- 添加示例数据
-- 注意：确保数据符合 RLS 策略
```

应用种子数据：

```bash
supabase db seed
```

## 7. 与 CI/CD 集成

### 创建 GitHub Actions 工作流

创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase db push
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### 添加 GitHub Secrets

1. 登录 GitHub
2. 进入你的仓库
3. 点击 "Settings" → "Secrets and variables" → "Actions"
4. 添加以下 secrets：
   - `SUPABASE_URL`: 你的 Supabase 项目 URL
   - `SUPABASE_SERVICE_ROLE_KEY`: 你的 Supabase 服务角色密钥

## 8. 日常维护

### 查看数据库日志

```bash
# 查看数据库日志
supabase logs db
```

### 监控迁移状态

```bash
# 定期检查迁移状态
supabase migration list
```

### 更新 Supabase CLI

```bash
# 更新 Supabase CLI 到最新版本
npm update -g supabase
```

### 备份数据库

```bash
# 导出数据库备份
supabase db dump > backup.sql
```

## 9. 常见问题和解决方案

### 迁移失败

**问题**：`supabase db push` 失败，提示外键约束错误

**解决方案**：
1. 检查迁移文件中的外键约束
2. 确保引用的表和列存在
3. 考虑使用 `IF NOT EXISTS` 条件
4. 检查数据是否符合约束要求

### RLS 策略不生效

**问题**：用户可以访问不属于他们的数据

**解决方案**：
1. 检查 RLS 是否已启用：`ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
2. 检查 RLS 策略是否正确：`SELECT * FROM pg_policies WHERE tablename = 'users';
3. 确保应用使用了正确的角色：`SET ROLE authenticated;

### 连接问题

**问题**：无法连接到 Supabase 数据库

**解决方案**：
1. 检查网络连接
2. 验证项目引用 ID 正确
3. 检查数据库密码正确
4. 查看数据库日志：`supabase logs db

## 10. 下一步建议

1. **文档化**：为团队成员编写数据库迁移指南
2. **培训**：确保团队成员了解如何使用 Supabase CLI
3. **制定规范**：建立数据库迁移的命名和编写规范
4. **定期审查**：定期审查 RLS 策略和迁移文件
5. **监控**：设置数据库性能和安全监控

## 11. 相关资源

- [Supabase CLI 官方文档](https://supabase.com/docs/reference/cli/supabase)
- [PostgreSQL 迁移最佳实践](https://supabase.com/docs/guides/database/transactions)
- [RLS 策略设计指南](https://supabase.com/docs/guides/auth/row-level-security)
- [GitHub Actions 集成指南](https://supabase.com/docs/guides/deploy/github-actions)

## 12. 总结

通过完成以上步骤，你已经成功：

1. 安装和配置了 Supabase CLI
2. 创建了包含 RLS 配置的迁移文件
3. 应用了迁移到远程数据库
4. 验证了 RLS 配置
5. 配置了 CI/CD 集成
6. 学习了日常维护和故障排除

现在，你的数据库迁移流程已经完整建立，团队可以高效地管理数据库 schema 变更，确保环境一致性和数据安全性。

## 后续支持

如果你在迁移过程中遇到任何问题，或者需要进一步的指导，请：

1. 查看 [Supabase 官方文档](https://supabase.com/docs)
2. 访问 [Supabase 社区](https://github.com/supabase/supabase/discussions)
3. 检查 [GitHub Issues](https://github.com/supabase/supabase/issues)
4. 联系 Supabase 支持团队

祝你迁移顺利！🚀
