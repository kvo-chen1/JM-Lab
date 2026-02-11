# Storage RLS 策略手动配置指南

由于 SQL Editor 权限限制，需要通过 Supabase Dashboard 手动配置 Storage 策略。

## 步骤 1: 创建 Bucket

1. 登录 Supabase Dashboard
2. 选择您的项目
3. 进入左侧菜单 **Storage**
4. 点击 **New bucket**
5. 输入名称: `works`
6. 勾选 **Public bucket**（允许公开访问）
7. 点击 **Create bucket**

## 步骤 2: 配置 RLS 策略

创建 bucket 后，点击 bucket 名称进入详情页，然后点击 **Policies** 标签。

### 添加 SELECT 策略（允许公开读取）

1. 点击 **New policy**
2. 选择 **For full customization** (高级)
3. 填写:
   - **Policy name**: `Allow public read access on works bucket`
   - **Allowed operation**: SELECT
   - **Target**: All (objects)
   - **WITH CHECK expression**: 留空
   - **USING expression**:
     ```
     bucket_id = 'works'
     ```
4. 点击 **Review** → **Save policy**

### 添加 INSERT 策略（允许认证用户上传）

1. 点击 **New policy**
2. 选择 **For full customization**
3. 填写:
   - **Policy name**: `Allow authenticated users to upload to works bucket`
   - **Allowed operation**: INSERT
   - **Target**: All (objects)
   - **WITH CHECK expression**:
     ```
     bucket_id = 'works' AND auth.role() = 'authenticated'
     ```
   - **USING expression**: 留空
4. 点击 **Review** → **Save policy**

### 添加 UPDATE 策略（允许认证用户更新）

1. 点击 **New policy**
2. 选择 **For full customization**
3. 填写:
   - **Policy name**: `Allow authenticated users to update own files in works bucket`
   - **Allowed operation**: UPDATE
   - **Target**: All (objects)
   - **WITH CHECK expression**:
     ```
     bucket_id = 'works' AND auth.role() = 'authenticated'
     ```
   - **USING expression**:
     ```
     bucket_id = 'works' AND auth.role() = 'authenticated'
     ```
4. 点击 **Review** → **Save policy**

### 添加 DELETE 策略（允许认证用户删除）

1. 点击 **New policy**
2. 选择 **For full customization**
3. 填写:
   - **Policy name**: `Allow authenticated users to delete own files in works bucket`
   - **Allowed operation**: DELETE
   - **Target**: All (objects)
   - **WITH CHECK expression**: 留空
   - **USING expression**:
     ```
     bucket_id = 'works' AND auth.role() = 'authenticated'
     ```
4. 点击 **Review** → **Save policy**

## 步骤 3: 验证配置

配置完成后，您应该看到 4 个策略：

| Policy Name | Operation | Definition |
|------------|-----------|------------|
| Allow public read access on works bucket | SELECT | `bucket_id = 'works'` |
| Allow authenticated users to upload to works bucket | INSERT | `bucket_id = 'works' AND auth.role() = 'authenticated'` |
| Allow authenticated users to update own files in works bucket | UPDATE | `bucket_id = 'works' AND auth.role() = 'authenticated'` |
| Allow authenticated users to delete own files in works bucket | DELETE | `bucket_id = 'works' AND auth.role() = 'authenticated'` |

## 步骤 4: 测试上传

1. 重新登录您的应用
2. 进入个人资料编辑页面
3. 尝试上传头像
4. 如果成功，头像 URL 将保存到数据库

## 故障排除

### 如果上传仍然失败

1. 检查浏览器控制台是否有 CORS 错误
2. 确认您已登录（auth.role() 需要 authenticated 状态）
3. 检查 bucket 是否为 public

### 如果需要更严格的权限

可以将策略改为只允许用户操作自己的文件：

```sql
-- INSERT 策略（只能上传到自己用户ID的文件夹）
bucket_id = 'works' AND auth.uid() = owner

-- 或者基于文件路径
bucket_id = 'works' AND (storage.foldername(name))[1] = auth.uid()::text
```

## 替代方案：使用 Supabase CLI

如果您有 Supabase CLI 配置，可以在本地运行：

```bash
# 登录
supabase login

# 链接项目
supabase link --project-ref your-project-ref

# 推送迁移
supabase db push
```

迁移文件已创建在:
- `supabase/migrations/20260215000000_fix_works_bucket_rls.sql`
