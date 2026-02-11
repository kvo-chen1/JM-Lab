-- 创建品牌向导草稿表
-- 用于存储用户在品牌向导中的创作进度

-- 1. 创建品牌向导草稿表
CREATE TABLE IF NOT EXISTS public.brand_wizard_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '未命名草稿',
    brand_name TEXT NOT NULL DEFAULT '未命名品牌',
    brand_id TEXT,
    current_step INTEGER NOT NULL DEFAULT 1,
    data JSONB NOT NULL DEFAULT '{}',
    thumbnail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 添加表注释
COMMENT ON TABLE public.brand_wizard_drafts IS '品牌向导草稿表，存储用户的创作进度';
COMMENT ON COLUMN public.brand_wizard_drafts.user_id IS '用户ID';
COMMENT ON COLUMN public.brand_wizard_drafts.title IS '草稿标题';
COMMENT ON COLUMN public.brand_wizard_drafts.brand_name IS '品牌名称';
COMMENT ON COLUMN public.brand_wizard_drafts.brand_id IS '品牌ID';
COMMENT ON COLUMN public.brand_wizard_drafts.current_step IS '当前步骤（1-4）';
COMMENT ON COLUMN public.brand_wizard_drafts.data IS '草稿数据（JSON格式）';
COMMENT ON COLUMN public.brand_wizard_drafts.thumbnail IS '缩略图URL';

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_brand_wizard_drafts_user_id ON public.brand_wizard_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_wizard_drafts_updated_at ON public.brand_wizard_drafts(updated_at DESC);

-- 4. 启用 RLS
ALTER TABLE public.brand_wizard_drafts ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
-- 用户只能查看自己的草稿
CREATE POLICY "Users can view own drafts" ON public.brand_wizard_drafts
    FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的草稿
CREATE POLICY "Users can insert own drafts" ON public.brand_wizard_drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的草稿
CREATE POLICY "Users can update own drafts" ON public.brand_wizard_drafts
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的草稿
CREATE POLICY "Users can delete own drafts" ON public.brand_wizard_drafts
    FOR DELETE USING (auth.uid() = user_id);

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION public.update_brand_wizard_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_brand_wizard_drafts_updated_at ON public.brand_wizard_drafts;

CREATE TRIGGER update_brand_wizard_drafts_updated_at
    BEFORE UPDATE ON public.brand_wizard_drafts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_brand_wizard_drafts_updated_at();

-- 7. 创建清理旧草稿的函数（可选，用于定期清理）
CREATE OR REPLACE FUNCTION public.cleanup_old_brand_wizard_drafts(days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.brand_wizard_drafts
    WHERE updated_at < NOW() - INTERVAL '1 day' * days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_brand_wizard_drafts IS '清理指定天数前未更新的品牌向导草稿';
