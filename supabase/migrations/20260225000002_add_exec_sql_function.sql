-- 创建执行 SQL 的函数（用于客户端执行 DDL）
-- 注意：此函数仅允许服务角色调用

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 只允许服务角色执行
  IF (SELECT current_user) != 'postgres' AND (SELECT current_user) NOT LIKE 'supabase_admin%' THEN
    RAISE EXCEPTION 'Permission denied: only service role can execute SQL';
  END IF;
  
  EXECUTE sql;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION public.exec_sql(text) IS '执行任意 SQL 语句（仅服务角色可用）';
