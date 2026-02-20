-- 为个人收款码支付添加必要的字段
-- 创建时间: 2026-02-20

-- 1. 添加个人收款码支付相关字段到订单表
ALTER TABLE membership_orders 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'enterprise' CHECK (payment_type IN ('enterprise', 'personal_qr')),
ADD COLUMN IF NOT EXISTS payment_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_proof JSONB,
ADD COLUMN IF NOT EXISTS payer_info JSONB,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. 更新状态检查约束，添加 verifying 状态
ALTER TABLE membership_orders 
DROP CONSTRAINT IF EXISTS membership_orders_status_check;

ALTER TABLE membership_orders 
ADD CONSTRAINT membership_orders_status_check 
CHECK (status IN ('pending', 'verifying', 'completed', 'failed', 'cancelled', 'refunded'));

-- 3. 为个人收款码支付创建索引
CREATE INDEX IF NOT EXISTS idx_membership_orders_payment_type ON membership_orders(payment_type);
CREATE INDEX IF NOT EXISTS idx_membership_orders_payment_code ON membership_orders(payment_code);
CREATE INDEX IF NOT EXISTS idx_membership_orders_verified_by ON membership_orders(verified_by);

-- 4. 添加注释
COMMENT ON COLUMN membership_orders.payment_type IS '支付类型: enterprise(企业支付), personal_qr(个人收款码)';
COMMENT ON COLUMN membership_orders.payment_code IS '个人收款码支付的识别码';
COMMENT ON COLUMN membership_orders.payment_proof IS '支付凭证信息(JSON)';
COMMENT ON COLUMN membership_orders.payer_info IS '付款人信息(JSON)';
COMMENT ON COLUMN membership_orders.verified_by IS '审核人ID';
COMMENT ON COLUMN membership_orders.verified_at IS '审核时间';
COMMENT ON COLUMN membership_orders.notes IS '备注信息';

-- 5. 创建支付证明存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payments', 'payments', true)
ON CONFLICT (id) DO NOTHING;

-- 6. 设置存储桶权限
-- 允许认证用户上传
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'payments');

-- 允许公开读取
CREATE POLICY "Allow public read" ON storage.objects
    FOR SELECT TO anon 
    USING (bucket_id = 'payments');

-- 允许认证用户删除自己的文件
CREATE POLICY "Allow authenticated delete own files" ON storage.objects
    FOR DELETE TO authenticated 
    USING (bucket_id = 'payments' AND auth.uid()::text = (storage.foldername(name))[1]);
