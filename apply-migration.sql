-- 更新举报表以支持原创保护相关举报类型
-- 先删除旧的 CHECK 约束
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_report_type_check;

-- 添加新的 CHECK 约束，包含原创保护相关类型
ALTER TABLE reports ADD CONSTRAINT reports_report_type_check 
CHECK (report_type IN (
    'spam',           -- 垃圾广告
    'provocative',    -- 引战
    'pornographic',   -- 色情
    'personal_attack',-- 人身攻击
    'illegal',        -- 违法信息
    'political_rumor',-- 涉政谣言
    'social_rumor',   -- 涉社会事件谣言
    'false_info',     -- 虚假不实信息
    'external_link',  -- 违法信息外链
    -- 原创保护相关类型
    'portrait',       -- 曝光肖像
    'privacy',        -- 泄露隐私
    'impersonation',  -- 冒充身份
    'reputation',     -- 损害个人名誉
    'business_reputation', -- 损害企业名誉
    'plagiarism',     -- 搬运/抄袭/洗稿
    'trademark',      -- 假冒商标
    'patent',         -- 假冒专利
    'other'           -- 其他
));

-- 更新表注释
COMMENT ON COLUMN reports.report_type IS '举报类型：spam-垃圾广告, provocative-引战, pornographic-色情, personal_attack-人身攻击, illegal-违法信息, political_rumor-涉政谣言, social_rumor-涉社会事件谣言, false_info-虚假不实信息, external_link-违法信息外链, portrait-曝光肖像, privacy-泄露隐私, impersonation-冒充身份, reputation-损害个人名誉, business_reputation-损害企业名誉, plagiarism-搬运/抄袭/洗稿, trademark-假冒商标, patent-假冒专利, other-其他';

-- 插入测试数据（原创保护举报示例）
INSERT INTO reports (
    reporter_id,
    target_type,
    target_id,
    report_type,
    description,
    status,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',  -- 请替换为实际的用户ID
    'work',
    '00000000-0000-0000-0000-000000000002',  -- 请替换为实际的作品ID
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

-- 查看更新后的约束
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'reports'::regclass AND conname = 'reports_report_type_check';
