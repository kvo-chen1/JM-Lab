-- ✅ 验证表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_behavior_logs', 'conversion_events');

-- ✅ 查看 user_behavior_logs 表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_behavior_logs'
ORDER BY ordinal_position;

-- ✅ 查看 conversion_events 表结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'conversion_events'
ORDER BY ordinal_position;

-- ✅ 查看表的索引
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('user_behavior_logs', 'conversion_events')
ORDER BY tablename, indexname;

-- ✅ 查看 RLS 策略
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('user_behavior_logs', 'conversion_events');
