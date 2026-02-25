-- 添加 exchange_records 表的管理员相关字段
-- 用于订单管理功能

-- 添加管理员备注字段
ALTER TABLE public.exchange_records
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 添加处理人字段
ALTER TABLE public.exchange_records
ADD COLUMN IF NOT EXISTS processed_by VARCHAR(100);

-- 添加处理时间字段
ALTER TABLE public.exchange_records
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- 添加商品图片字段（用于订单列表显示）
ALTER TABLE public.exchange_records
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- 添加用户邮箱字段
ALTER TABLE public.exchange_records
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 添加联系电话字段
ALTER TABLE public.exchange_records
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

-- 添加配送地址字段
ALTER TABLE public.exchange_records
ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- 添加更新时间字段（如果不存在）
ALTER TABLE public.exchange_records
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 创建更新时间触发器（如果不存在）
CREATE OR REPLACE FUNCTION public.set_exchange_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_exchange_records_updated_at ON public.exchange_records;
CREATE TRIGGER set_exchange_records_updated_at
    BEFORE UPDATE ON public.exchange_records
    FOR EACH ROW
    EXECUTE FUNCTION public.set_exchange_records_updated_at();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_exchange_records_processed_at ON public.exchange_records(processed_at);
CREATE INDEX IF NOT EXISTS idx_exchange_records_status_created_at ON public.exchange_records(status, created_at DESC);

COMMENT ON COLUMN public.exchange_records.admin_notes IS '管理员处理备注';
COMMENT ON COLUMN public.exchange_records.processed_by IS '处理人ID或名称';
COMMENT ON COLUMN public.exchange_records.processed_at IS '处理时间';
COMMENT ON COLUMN public.exchange_records.product_image IS '商品图片URL';
COMMENT ON COLUMN public.exchange_records.user_email IS '用户邮箱';
COMMENT ON COLUMN public.exchange_records.contact_phone IS '联系电话';
COMMENT ON COLUMN public.exchange_records.shipping_address IS '配送地址';
