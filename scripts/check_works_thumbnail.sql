-- 检查作品的缩略图数据
-- 在 Supabase SQL Editor 中执行

-- 查看所有作品的缩略图URL
SELECT 
    id,
    title,
    thumbnail,
    video_url,
    CASE 
        WHEN thumbnail IS NULL THEN 'NULL'
        WHEN thumbnail = '' THEN 'Empty'
        WHEN thumbnail LIKE 'http%' THEN 'Valid URL'
        WHEN thumbnail LIKE '/%' THEN 'Local Path'
        ELSE 'Other'
    END as thumbnail_type
FROM works
ORDER BY created_at DESC
LIMIT 20;

-- 统计缩略图类型分布
SELECT 
    CASE 
        WHEN thumbnail IS NULL THEN 'NULL'
        WHEN thumbnail = '' THEN 'Empty'
        WHEN thumbnail LIKE 'http%' THEN 'Valid URL'
        WHEN thumbnail LIKE '/%' THEN 'Local Path'
        ELSE 'Other'
    END as thumbnail_type,
    COUNT(*) as count
FROM works
GROUP BY thumbnail_type;
