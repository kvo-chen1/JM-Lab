-- 线上库自检（只读）
-- 用途：把下面结果复制给我，我就能精确给你“无损升级”的增量脚本

-- 1) 关键表是否存在
SELECT t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'users','posts','comments','likes','follows',
    'messages','friend_requests','user_status','user_history'
  )
ORDER BY t.table_name;

-- 2) 关键表字段明细
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'users','posts','comments','likes','follows',
    'messages','friend_requests','user_status','user_history'
  )
ORDER BY c.table_name, c.ordinal_position;

-- 3) 外键/约束概览（看关联字段名）
SELECT
  tc.table_name,
  tc.constraint_type,
  tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'users','posts','comments','likes','follows',
    'messages','friend_requests','user_status','user_history'
  )
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- 4) 当前 RLS 是否开启
SELECT
  n.nspname AS schema_name,
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

-- 5) 已有策略（policy）列表
SELECT
  p.schemaname,
  p.tablename,
  p.policyname,
  p.permissive,
  p.cmd
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN (
    'users','posts','comments','likes','follows',
    'messages','friend_requests','user_status','user_history'
  )
ORDER BY p.tablename, p.policyname;

