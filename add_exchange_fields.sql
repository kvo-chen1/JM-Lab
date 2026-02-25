-- 添加 exchange_records 表的管理员相关字段
-- 用于订单管理功能

-- 添加管理员备注字段
ALTER TABLE IF EXISTS public.exchange_records
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 添加处理人字段
ALTER TABLE IF EXISTS public.exchange_records
ADD COLUMN IF NOT EXISTS processed_by VARCHAR(100);

-- 添加处理时间字段
ALTER TABLE IF EXISTS public.exchange_records
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- 添加商品图片字段（用于订单列表显示）
ALTER TABLE IF EXISTS public.exchange_records
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- 添加用户邮箱字段
ALTER TABLE IF EXISTS public.exchange_records
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 添加联系电话字段
ALTER TABLE IF EXISTS public.exchange_records
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

-- 添加配送地址字段
ALTER TABLE IF EXISTS public.exchange_records
ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- 添加更新时间字段（如果不存在）
ALTER TABLE IF EXISTS public.exchange_records
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

-- 创建执行 SQL 的函数（用于客户端执行 DDL）
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

COMMENT ON FUNCTION public.exec_sql(text) IS '执行任意 SQL 语句（仅服务角色可用）';
