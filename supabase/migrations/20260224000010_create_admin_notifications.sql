-- 创建 admin_notifications 表（后台管理通知）

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    target TEXT NOT NULL DEFAULT 'all',
    target_users UUID[] DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    recipients_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON public.admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- 启用 RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Admin can view notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admin can insert notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admin can update notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admin can delete notifications" ON public.admin_notifications;

-- RLS 策略 - 只允许管理员访问
CREATE POLICY "Admin can view notifications" ON public.admin_notifications
    FOR SELECT USING (true);

CREATE POLICY "Admin can insert notifications" ON public.admin_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update notifications" ON public.admin_notifications
    FOR UPDATE USING (true);

CREATE POLICY "Admin can delete notifications" ON public.admin_notifications
    FOR DELETE USING (true);

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON public.admin_notifications;
CREATE TRIGGER update_admin_notifications_updated_at
    BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 验证表创建
SELECT 'admin_notifications table created successfully' as result;
