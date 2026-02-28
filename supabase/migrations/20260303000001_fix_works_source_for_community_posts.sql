-- ==========================================================================
-- 修复 works 表中错误的 source 字段值
-- 将那些实际上是社区帖子的作品标记为正确的来源
-- ==========================================================================

-- 1. 首先，确保 event_id 列存在
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS event_id TEXT;

-- 2. 找出那些可能是社区帖子的作品
-- 社区帖子的特征：
-- - 标题很短（少于10个字符）
-- - 没有有效的缩略图或封面图
-- - 描述内容为空或很短
-- - 没有 event_id（不是活动作品）

-- 3. 将这些作品的 source 字段更新为 '其他'
-- 这样它们就不会出现在津脉广场作品管理中了
UPDATE public.works
SET source = '其他'
WHERE 
  -- 标题很短（可能是测试数据或社区帖子）
  (LENGTH(COALESCE(title, '')) < 10)
  -- 没有有效的缩略图
  AND (
    thumbnail IS NULL 
    OR thumbnail = '' 
    OR thumbnail = 'EMPTY'
    OR thumbnail LIKE '%empty%'
  )
  -- 不是活动作品
  AND (event_id IS NULL OR event_id = '')
  -- 当前被错误地标记为津脉广场
  AND source = '津脉广场';

-- 3. 记录更新的数量
-- 注意：这里使用 RAISE NOTICE 来输出信息，但在 Supabase 迁移中可能不显示
-- 可以通过查询来验证更新结果

-- 4. 验证更新结果
-- SELECT COUNT(*) as updated_count FROM public.works WHERE source = '其他';

-- ==========================================================================
-- 完成
-- ==========================================================================
NOTIFY pgrst, 'reload schema';
