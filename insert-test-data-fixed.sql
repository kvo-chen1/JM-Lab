-- 先查询一个实际存在的用户ID
SELECT id, username FROM users LIMIT 1;

-- 使用查询到的用户ID插入测试数据
-- 请把下面的 'YOUR_USER_ID' 替换为上面查询到的实际用户ID
INSERT INTO reports (
    reporter_id,
    target_type,
    target_id,
    report_type,
    description,
    status,
    created_at
) VALUES 
('YOUR_USER_ID', 'work', gen_random_uuid(), 'plagiarism', '搬运/抄袭我的作品', 'pending', NOW()),
('YOUR_USER_ID', 'work', gen_random_uuid(), 'portrait', '未经授权使用我的肖像', 'pending', NOW()),
('YOUR_USER_ID', 'work', gen_random_uuid(), 'privacy', '泄露个人隐私信息', 'processing', NOW()),
('YOUR_USER_ID', 'work', gen_random_uuid(), 'trademark', '假冒商标', 'resolved', NOW()),
('YOUR_USER_ID', 'work', gen_random_uuid(), 'reputation', '损害个人名誉', 'rejected', NOW());

-- 或者使用子查询直接获取第一个用户的ID
INSERT INTO reports (
    reporter_id,
    target_type,
    target_id,
    report_type,
    description,
    status,
    created_at
) 
SELECT 
    (SELECT id FROM users LIMIT 1),
    'work',
    gen_random_uuid(),
    'plagiarism',
    '搬运/抄袭我的作品',
    'pending',
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM users LIMIT 1),
    'work',
    gen_random_uuid(),
    'portrait',
    '未经授权使用我的肖像',
    'pending',
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM users LIMIT 1),
    'work',
    gen_random_uuid(),
    'privacy',
    '泄露个人隐私信息',
    'processing',
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM users LIMIT 1),
    'work',
    gen_random_uuid(),
    'trademark',
    '假冒商标',
    'resolved',
    NOW()
UNION ALL
SELECT 
    (SELECT id FROM users LIMIT 1),
    'work',
    gen_random_uuid(),
    'reputation',
    '损害个人名誉',
    'rejected',
    NOW();

-- 验证数据
SELECT * FROM reports;
