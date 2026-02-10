-- 查看具体的缩略图URL
SELECT 
    id,
    title,
    thumbnail,
    LEFT(thumbnail, 100) as thumbnail_preview
FROM works
ORDER BY created_at DESC
LIMIT 10;
