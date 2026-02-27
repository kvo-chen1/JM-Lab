-- 插入测试数据（原创保护举报示例）
-- 使用 gen_random_uuid() 生成随机 UUID

INSERT INTO reports (
    reporter_id,
    target_type,
    target_id,
    report_type,
    description,
    status,
    created_at
) VALUES (
    gen_random_uuid(),  -- 随机生成用户ID
    'work',
    gen_random_uuid(),  -- 随机生成目标ID
    'plagiarism',
    '[原创保护举报]
举报身份: 自己举报
权利主体: 个人

问题描述:
该用户发布的视频内容完全抄袭我的原创作品，包括文案、拍摄角度和剪辑节奏，严重侵犯了我的著作权。

相关链接:
https://example.com/video/123',
    'pending',
    NOW()
);

-- 再插入几条不同类型的测试数据
INSERT INTO reports (reporter_id, target_type, target_id, report_type, description, status, created_at) VALUES
(gen_random_uuid(), 'work', gen_random_uuid(), 'portrait', '未经授权使用我的肖像', 'pending', NOW()),
(gen_random_uuid(), 'work', gen_random_uuid(), 'privacy', '泄露了我的个人隐私信息', 'processing', NOW()),
(gen_random_uuid(), 'work', gen_random_uuid(), 'trademark', '假冒我司注册商标', 'resolved', NOW()),
(gen_random_uuid(), 'work', gen_random_uuid(), 'reputation', '恶意诽谤我的个人名誉', 'rejected', NOW());

-- 查看插入的数据
SELECT 
    id,
    report_type,
    status,
    LEFT(description, 50) as description_preview,
    created_at
FROM reports
ORDER BY created_at DESC;
