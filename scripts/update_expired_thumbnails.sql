-- 将过期的阿里云 OSS URL 替换为稳定的 Picsum 图片
UPDATE works
SET thumbnail = 'https://picsum.photos/seed/' || id || '/800/600'
WHERE thumbnail LIKE '%aliyuncs.com%'
   OR thumbnail LIKE '%dashscope%';

-- 验证更新结果
SELECT 
    id,
    title,
    LEFT(thumbnail, 80) as thumbnail_preview,
    CASE 
        WHEN thumbnail LIKE '%picsum.photos%' THEN 'Picsum (Updated)'
        ELSE 'Other'
    END as url_type
FROM works
ORDER BY created_at DESC
LIMIT 10;
