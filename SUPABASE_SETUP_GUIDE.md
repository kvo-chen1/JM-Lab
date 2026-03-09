# Supabase 数据库设置指南

## 项目信息
- **项目名称**: 超珊瑚蓝
- **项目 URL**: https://kizgwttrsmkjelddotup.supabase.co
- **状态**: ✅ 已创建，等待配置

---

## 步骤 1：获取 Supabase API 密钥

1. 访问 [Supabase 控制台](https://supabase.com/dashboard)
2. 选择项目 "超珊瑚蓝"
3. 点击左侧菜单 **Project Settings** → **API**
4. 复制以下信息：
   - **Project URL**: `https://kizgwttrsmkjelddotup.supabase.co`
   - **anon public** (匿名密钥)
   - **service_role secret** (服务角色密钥) - 在 Data API 部分

---

## 步骤 2：更新本地环境变量

编辑 `.env.local` 文件，替换以下内容：

```env
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

将 `your-anon-key-here` 和 `your-service-role-key-here` 替换为实际的密钥。

---

## 步骤 3：在 Supabase 中创建数据库表

### 方法 A：使用 SQL 编辑器（推荐）

1. 在 Supabase 控制台，点击 **SQL Editor**
2. 创建新查询
3. 复制并执行 `database-schema.sql` 文件中的内容：
   ```sql
   -- 从文件 database-schema.sql 复制所有 SQL
   ```

### 方法 B：使用迁移文件

1. 在 Supabase 控制台，点击 **SQL Editor**
2. 按顺序执行 `supabase/migrations/` 目录下的所有 SQL 文件

### 方法 C：使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref kizgwttrsmkjelddotup

# 执行迁移
supabase db push
```

---

## 步骤 4：配置身份验证（Auth）

1. 在 Supabase 控制台，点击 **Authentication** → **Providers**
2. 启用需要的登录方式：
   - ✅ Email (默认启用)
   - ✅ GitHub (如果需要)
   - ✅ 其他 OAuth 提供商

3. 配置 Site URL 和 Redirect URLs：
   - Site URL: `http://localhost:3005` (开发环境)
   - Redirect URLs: `http://localhost:3005/auth/callback`

---

## 步骤 5：配置存储（Storage）

1. 在 Supabase 控制台，点击 **Storage**
2. 创建以下存储桶：
   - `avatars` - 用户头像
   - `works` - 作品图片/视频
   - `attachments` - 附件文件

3. 配置存储桶权限（RLS policies）

---

## 步骤 6：测试连接

运行测试脚本验证连接：

```bash
# 创建测试脚本
node scripts/check-supabase-connection.mjs
```

或者手动测试：

```bash
# 启动开发服务器
pnpm dev

# 在浏览器中打开应用
# 检查控制台是否有 Supabase 连接成功的日志
```

---

## 数据迁移（如果需要）

由于 Neon 数据库已无法连接，你有以下选择：

### 选项 1：重新开始（推荐用于开发）
- 直接在 Supabase 中创建新的表结构
- 使用应用创建测试数据

### 选项 2：从备份恢复
- 如果有 SQL 备份文件，在 SQL Editor 中执行

### 选项 3：使用旧的 Supabase 项目
- 如果之前的 Supabase 项目还有数据，可以继续使用
- 项目 URL: `https://pptqdicaaewtnaiflfcs.supabase.co`

---

## 环境变量参考

完整的 `.env.local` 配置：

```env
# ==========================================
# 数据库配置 - 使用 Supabase
# ==========================================
VITE_SUPABASE_URL=https://kizgwttrsmkjelddotup.supabase.co
SUPABASE_URL=https://kizgwttrsmkjelddotup.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # 替换为实际密钥
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...      # 替换为实际密钥
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # 替换为实际密钥
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...      # 替换为实际密钥

DB_TYPE=supabase
VITE_USE_LOCAL_PROXY=false
```

---

## 常见问题

### Q: 如何找到 Service Role Key？
A: 在 Supabase 控制台 → Project Settings → API → Data API → service_role secret

### Q: 连接失败怎么办？
A: 检查：
1. 环境变量是否正确设置
2. 密钥是否完整（不要截断）
3. 项目 URL 是否正确

### Q: 表不存在错误？
A: 需要先执行 SQL 迁移脚本创建表结构

### Q: 权限错误？
A: 检查 RLS (Row Level Security) 策略是否正确配置

---

## 下一步

1. ✅ 获取 Supabase API 密钥
2. ✅ 更新 `.env.local` 文件
3. ⬜ 在 Supabase 中创建数据库表
4. ⬜ 配置身份验证和存储
5. ⬜ 测试连接
6. ⬜ 部署到 Vercel（环境变量会自动配置）

---

需要帮助？
- Supabase 文档: https://supabase.com/docs
- 项目控制台: https://supabase.com/dashboard/project/kizgwttrsmkjelddotup
