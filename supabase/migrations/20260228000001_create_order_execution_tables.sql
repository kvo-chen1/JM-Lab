-- 商单执行系统数据库迁移脚本（简化版）
-- 创建时间：2026-02-28
-- 说明：移除复杂的 RLS 策略，使用基础权限控制

-- ============================================================================
-- 1. 商单执行表（创作者接单后创建）
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES order_audits(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id UUID REFERENCES works(id) ON DELETE SET NULL,
  
  -- 商单基本信息
  order_title TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  product_image TEXT,
  
  -- 佣金配置
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  
  -- 状态
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  
  -- 统计数据
  click_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  total_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_order_executions_user_id ON order_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_order_executions_order_id ON order_executions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_executions_brand_name ON order_executions(brand_name);
CREATE INDEX IF NOT EXISTS idx_order_executions_status ON order_executions(status);
CREATE INDEX IF NOT EXISTS idx_order_executions_created_at ON order_executions(created_at DESC);

-- ============================================================================
-- 2. 产品链接表（作品关联的商单链接）
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  order_id UUID REFERENCES order_audits(id) ON DELETE SET NULL,
  
  -- 产品信息
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  product_image TEXT,
  price DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  
  -- 统计数据
  click_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_product_links_work_id ON product_links(work_id);
CREATE INDEX IF NOT EXISTS idx_product_links_order_id ON product_links(order_id);

-- ============================================================================
-- 3. 点击记录表
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_execution_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES order_executions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted BOOLEAN NOT NULL DEFAULT false,
  sale_amount DECIMAL(10,2),
  
  ip_address INET,
  user_agent TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_order_execution_clicks_execution_id ON order_execution_clicks(execution_id);
CREATE INDEX IF NOT EXISTS idx_order_execution_clicks_user_id ON order_execution_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_order_execution_clicks_clicked_at ON order_execution_clicks(clicked_at DESC);

-- ============================================================================
-- 4. 每日统计表
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_execution_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES order_executions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  UNIQUE(execution_id, date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_order_execution_daily_stats_execution_id ON order_execution_daily_stats(execution_id);
CREATE INDEX IF NOT EXISTS idx_order_execution_daily_stats_date ON order_execution_daily_stats(date DESC);

-- ============================================================================
-- 5. 存储过程
-- ============================================================================

-- 更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_executions_updated_at ON order_executions;
CREATE TRIGGER update_order_executions_updated_at
  BEFORE UPDATE ON order_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 增加点击数
CREATE OR REPLACE FUNCTION increment_click_count(p_execution_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE order_executions
  SET click_count = click_count + 1
  WHERE id = p_execution_id;
END;
$$ LANGUAGE plpgsql;

-- 增加转化数
CREATE OR REPLACE FUNCTION increment_conversion(
  p_execution_id UUID,
  p_sale_amount DECIMAL,
  p_earnings DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE order_executions
  SET 
    conversion_count = conversion_count + 1,
    total_sales = total_sales + p_sale_amount,
    total_earnings = total_earnings + p_earnings
  WHERE id = p_execution_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. 注释
-- ============================================================================

COMMENT ON TABLE order_executions IS '商单执行表 - 记录创作者接单后的执行情况';
COMMENT ON TABLE product_links IS '产品链接表 - 作品关联的商单链接';
COMMENT ON TABLE order_execution_clicks IS '点击记录表 - 详细的点击和转化记录';
COMMENT ON TABLE order_execution_daily_stats IS '每日统计表 - 按天聚合的统计数据';

COMMENT ON COLUMN order_executions.commission_rate IS '佣金比例（百分比）';
COMMENT ON COLUMN order_executions.status IS '状态：active-进行中，paused-已暂停，ended-已结束';
COMMENT ON COLUMN order_execution_clicks.converted IS '是否转化（购买）';
COMMENT ON COLUMN order_execution_clicks.sale_amount IS '成交金额';
