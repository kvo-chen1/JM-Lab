-- 使用 kvo1 的用户ID插入测试数据
-- 用户ID: f3dedf79-5c5e-40fd-9513-d0fb0995d429

INSERT INTO reports (
    reporter_id,
    target_type,
    target_id,
    report_type,
    description,
    status,
    created_at
) VALUES 
('f3dedf79-5c5e-40fd-9513-d0fb0995d429', 'work', gen_random_uuid(), 'plagiarism', 
'[原创保护举报]
举报身份: 自己举报
权利主体: 个人

问题描述:
该用户发布的视频内容完全抄袭我的原创作品，包括文案、拍摄角度和剪辑节奏，严重侵犯了我的著作权。

相关链接:
https://example.com/video/123', 
'pending', NOW()),

('f3dedf79-5c5e-40fd-9513-d0fb0995d429', 'work', gen_random_uuid(), 'portrait', 
'[原创保护举报]
举报身份: 自己举报
权利主体: 个人

问题描述:
未经授权使用我的肖像，对我的形象造成了负面影响。

相关链接:
https://example.com/video/456', 
'pending', NOW()),

('f3dedf79-5c5e-40fd-9513-d0fb0995d429', 'work', gen_random_uuid(), 'privacy', 
'[原创保护举报]
举报身份: 自己举报
权利主体: 个人

问题描述:
该内容泄露了我的个人隐私信息，包括家庭住址和联系方式。

相关链接:
https://example.com/video/789', 
'processing', NOW()),

('f3dedf79-5c5e-40fd-9513-d0fb0995d429', 'work', gen_random_uuid(), 'trademark', 
'[原创保护举报]
举报身份: 自己举报
权利主体: 组织

问题描述:
该商家未经授权使用我司注册商标进行商业宣传，涉嫌商标侵权。

相关链接:
https://example.com/product/abc', 
'resolved', NOW()),

('f3dedf79-5c5e-40fd-9513-d0fb0995d429', 'work', gen_random_uuid(), 'reputation', 
'[原创保护举报]
举报身份: 自己举报
权利主体: 个人

问题描述:
该用户发布的内容恶意诽谤我的个人名誉，含有大量不实信息。

相关链接:
https://example.com/post/defamation', 
'rejected', NOW());

-- 验证数据
SELECT 
    r.id,
    r.report_type,
    r.status,
    u.username as reporter_name,
    LEFT(r.description, 30) as description_preview,
    r.created_at
FROM reports r
JOIN users u ON r.reporter_id = u.id
WHERE r.reporter_id = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
ORDER BY r.created_at DESC;
