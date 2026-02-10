-- 修复过期的缩略图 URL
-- 将阿里云临时 URL 替换为稳定的占位图

-- 查看所有阿里云 OSS 的缩略图
SELECT 
    id,
    title,
    thumbnail,
    CASE 
        WHEN thumbnail LIKE '%aliyuncs.com%' THEN 'Aliyun OSS'
        WHEN thumbnail LIKE '%picsum.photos%' THEN 'Picsum'
        ELSE 'Other'
    END as url_type
FROM works
WHERE thumbnail LIKE '%aliyuncs.com%'
   OR thumbnail LIKE '%dashscope%'
ORDER BY created_at DESC;

-- 将过期的阿里云 OSS URL 替换为稳定的占位图
-- 使用 Picsum 的随机图片作为占位图
UPDATE works
SET thumbnail = 'https://picsum.photos/seed/' || id || '/800/600'
WHERE thumbnail LIKE '%aliyuncs.com%'
   OR thumbnail LIKE '%dashscope%';

-- 验证更新结果
SELECT 
    id,
    title,
    LEFT(thumbnail, 80) as thumbnail_preview
FROM works
ORDER BY created_at DESC
LIMIT 10;
