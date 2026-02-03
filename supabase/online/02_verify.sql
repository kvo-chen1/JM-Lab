-- 线上补丁执行后快速自检（只读）

-- 1) 核心表是否存在
SELECT t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'users','posts','comments','likes','follows',
    'messages','friend_requests','user_status','user_history'
  )
ORDER BY t.table_name;

-- 2) messages 关键字段是否齐全（避免前端 update/is_read 报错）
SELECT
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'messages'
  AND c.column_name IN (
    'channel_id','sender_id','receiver_id','content','status','type',
    'metadata','retry_count','is_read','delivered_at','read_at','created_at'
  )
ORDER BY c.column_name;

-- 3) user_history 关键字段是否齐全（避免 historyService 写入失败）
SELECT
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'user_history'
ORDER BY c.ordinal_position;

-- 4) RLS 开关状态
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'users','posts','comments','likes','follows',
    'messages','friend_requests','user_status','user_history'
  )
ORDER BY c.relname;

-- 5) 策略是否创建完成（重点关注 messages/user_history）
SELECT
  p.tablename,
  p.policyname,
  p.cmd
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('messages','user_history','friend_requests','user_status','posts','comments','likes','follows','users')
ORDER BY p.tablename, p.policyname;

