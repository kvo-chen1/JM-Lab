-- 修复无效的用户头像 URL
-- 1. 清空所有 blob URL
-- 2. 清空所有 localhost URL
-- 3. 为空头像的用户设置默认头像

-- 查看当前状态
SELECT username, email, avatar_url
FROM users
WHERE avatar_url LIKE 'blob:%' 
   OR avatar_url LIKE '%localhost%'
   OR avatar_url IS NULL 
   OR avatar_url = '';

-- 清空无效的 blob URL 和 localhost URL
UPDATE users
SET avatar_url = NULL
WHERE avatar_url LIKE 'blob:%' 
   OR avatar_url LIKE '%localhost%';

-- 为所有没有头像的用户设置默认头像
UPDATE users
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || COALESCE(username, email, id::text)
WHERE avatar_url IS NULL OR avatar_url = '';

-- 查看修复后的结果
SELECT username, email, avatar_url
FROM users
ORDER BY username;
