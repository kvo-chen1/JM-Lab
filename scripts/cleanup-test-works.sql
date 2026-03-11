-- ============================================
-- 清理测试/模拟作品数据
-- 删除标题为简单数字、描述为空或缩略图为空的作品
-- ============================================

-- 先查看将要删除的数据（预览模式）
-- 取消注释下一行可以预览要删除的数据
-- SELECT id, title, description, thumbnail, creator_id, created_at FROM works 
-- WHERE 
--   title IS NULL 
--   OR title = '' 
--   OR title ~ '^[0-9]+$'  -- 标题是纯数字
--   OR title IN ('cs', 'test', '测试', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0')
--   OR (description IS NULL OR description = '')
--   OR (thumbnail IS NULL OR thumbnail = '');

-- ============================================
-- 正式删除测试数据
-- ============================================

-- 删除前记录数量
SELECT '删除前作品总数' as info, COUNT(*) as count FROM works;

-- 删除标题为纯数字的作品（测试数据）
DELETE FROM works 
WHERE title ~ '^[0-9]+$';  -- 标题是纯数字如 "1", "2", "28" 等

-- 删除标题为常见测试词的作品
DELETE FROM works 
WHERE title IN ('cs', 'test', '测试', 'ceshi', 'temp', 'tmp', 'a', 'b', 'c', 'd', 'e');

-- 删除标题和描述都为空的作品
DELETE FROM works 
WHERE (title IS NULL OR title = '') 
  AND (description IS NULL OR description = '');

-- 删除缩略图为空且创建时间较早的作品（可能是测试数据）
-- 注意：这会删除没有上传图片的作品，谨慎使用
-- DELETE FROM works 
-- WHERE (thumbnail IS NULL OR thumbnail = '') 
--   AND created_at < NOW() - INTERVAL '7 days';

-- 删除后记录数量
SELECT '删除后作品总数' as info, COUNT(*) as count FROM works;

-- 显示剩余的作品数量统计
SELECT 
  '作品状态统计' as info,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
  COUNT(CASE WHEN thumbnail IS NULL OR thumbnail = '' THEN 1 END) as missing_thumbnail
FROM works;
