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

-- 查看更新后的约束
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'reports'::regclass AND conname = 'reports_report_type_check';
