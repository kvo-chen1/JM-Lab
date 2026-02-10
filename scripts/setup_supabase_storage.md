# Supabase Storage 配置指南

使用 Supabase Storage 存储图片，获得永久稳定的图片 URL。

## 1. 创建 Storage Bucket

### 在 Supabase 控制台中：

1. 打开 Supabase 控制台 → Storage
2. 点击 "New bucket"
3. 输入名称：`works`
4. 选择 "Public bucket"（公开访问）
5. 点击 "Create bucket"

## 2. 配置 Bucket 权限

### 设置 RLS 策略：

1. 点击 `works` bucket
2. 切换到 "Policies" 标签
3. 添加以下策略：

**SELECT 策略（允许所有人查看）：**
```sql
CREATE POLICY "Allow public access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'works');
```

**INSERT 策略（允许登录用户上传）：**
```sql
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'works');
```

**DELETE 策略（允许用户删除自己的文件）：**
```sql
CREATE POLICY "Allow users to delete own files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'works' AND owner = auth.uid());
```

## 3. 使用代码上传图片

### 示例代码：

```typescript
import { uploadImage, generateFilePath } from '../services/supabaseStorageService';

// 上传图片
async function handleUpload(file: File, workId: string) {
  const filePath = generateFilePath(workId, file.name);
  
  const { url, error } = await uploadImage(file, filePath);
  
  if (error) {
    console.error('上传失败:', error);
    return;
  }
  
  console.log('上传成功，URL:', url);
  // 将 url 保存到数据库
}
```

## 4. 迁移现有图片

### 将现有作品的缩略图迁移到 Supabase Storage：

1. 下载现有图片
2. 上传到 Supabase Storage
3. 更新数据库中的 thumbnail URL

### 批量迁移脚本：

```sql
-- 查看所有需要迁移的图片
SELECT id, title, thumbnail 
FROM works 
WHERE thumbnail LIKE '%aliyuncs.com%' 
   OR thumbnail LIKE '%dashscope%';

-- 更新为 Supabase Storage URL（手动上传后执行）
UPDATE works 
SET thumbnail = 'https://{your-project}.supabase.co/storage/v1/object/public/works/{new-path}'
WHERE id = '{work-id}';
```

## 5. 前端使用

### 直接使用 Storage URL：

```tsx
<img 
  src="https://{your-project}.supabase.co/storage/v1/object/public/works/{path}" 
  alt="作品缩略图"
/>
```

### 使用服务函数：

```tsx
import { getImageUrl } from '../services/supabaseStorageService';

const imageUrl = getImageUrl('works/123/thumbnail.jpg');
```

## 6. 注意事项

1. **免费套餐限制**：
   - Storage: 1GB
   - 出口流量: 5GB/月

2. **图片优化**：
   - 上传前压缩图片
   - 使用适当的图片格式（WebP）
   - 限制图片大小（建议最大 5MB）

3. **安全性**：
   - 使用 RLS 策略控制访问
   - 验证文件类型（只允许图片）
   - 限制文件大小

## 7. 替代方案

如果 Supabase Storage 不够用：

1. **Cloudinary**：专业的图片托管服务
2. **AWS S3**：亚马逊云存储
3. **阿里云 OSS**：国内访问速度快

## 总结

Supabase Storage 提供：
- ✅ 永久稳定的图片 URL
- ✅ 免费 1GB 存储空间
- ✅ 与 Supabase 数据库集成
- ✅ 简单的 API 接口
- ✅ 自动的 CDN 分发
