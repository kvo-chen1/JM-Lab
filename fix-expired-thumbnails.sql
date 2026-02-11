-- 修复已过期的作品缩略图
-- 将阿里云和 DashScope 的临时 URL 替换为默认图片

-- 方案1：替换为默认图片
UPDATE works
SET thumbnail = 'https://images.unsplash.com/photo-1558655146-d09347e0c766?q=80&w=2560&auto=format&fit=crop'
WHERE thumbnail LIKE '%aliyuncs.com%' 
   OR thumbnail LIKE '%dashscope%'
   OR thumbnail LIKE 'blob:%';

-- 查看更新后的结果
SELECT id, title, thumbnail
FROM works
ORDER BY created_at DESC
LIMIT 10;
