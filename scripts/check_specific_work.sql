-- 查看特定作品的详细信息
-- 替换 'AI创作-2026/2/8' 为实际的作品标题

SELECT 
    id,
    title,
    thumbnail,
    video_url,
    creator_id,
    status,
    visibility,
    created_at,
    updated_at
FROM works
WHERE title LIKE '%AI创作-2026/2/8%'
   OR title LIKE '%AI创作%'
ORDER BY created_at DESC
LIMIT 5;
