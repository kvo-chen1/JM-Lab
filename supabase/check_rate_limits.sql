-- 检查 Supabase Auth 的 Rate Limit 设置
-- 注意：这些配置通常在 Supabase Dashboard > Authentication > Rate Limits 中设置

-- 查看当前的 Auth 配置
SELECT 
  name,
  value
FROM auth.config 
WHERE name LIKE 'rate_limit%';

-- 或者查看应用配置（如果可用）
SELECT 
  key,
  value
FROM storage.config 
WHERE key LIKE 'rate_limit%';
