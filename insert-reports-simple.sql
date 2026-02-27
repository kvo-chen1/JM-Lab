-- 使用子查询直接获取第一个用户的ID并插入数据
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
SELECT 
    id,
    report_type,
    status,
    LEFT(description, 30) as description_preview,
    created_at
FROM reports
ORDER BY created_at DESC;
