-- 商单审核系统数据库迁移脚本（简化版 - 无 RLS）
-- 创建时间：2026-02-28
-- 说明：移除 RLS 策略，避免权限问题

-- ============================================================================
-- 1. 商单审核表（品牌方发布商单后进入审核）
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE, -- 业务订单 ID
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 发布者 ID
  
  -- 商单基本信息
  title TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  type TEXT NOT NULL, -- design, illustration, video, writing, photography, other
  description TEXT NOT NULL,
  
  -- 预算和时间
  budget_min DECIMAL(10,2) NOT NULL,
  budget_max DECIMAL(10,2) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  duration TEXT NOT NULL, -- 1 天，3 天，7 天等
  
  -- 工作地点和要求
  location TEXT NOT NULL,
  max_applicants INTEGER NOT NULL DEFAULT 10,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  requirements TEXT[] NOT NULL DEFAULT '{}',
  
  -- 标签和附件
  tags TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  
  -- 审核状态
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  audit_opinion TEXT, -- 审核意见
  audited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 审核人
  audited_at TIMESTAMPTZ, -- 审核时间
  
  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_order_audits_user_id ON order_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_order_audits_status ON order_audits(status);
CREATE INDEX IF NOT EXISTS idx_order_audits_type ON order_audits(type);
CREATE INDEX IF NOT EXISTS idx_order_audits_created_at ON order_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_audits_brand_name ON order_audits(brand_name);

-- 注释
COMMENT ON TABLE order_audits IS '商单审核表 - 品牌方发布的商单，需要管理员审核';
COMMENT ON COLUMN order_audits.type IS '商单类型：design-设计，illustration-插画，video-视频，writing-文案，photography-摄影，other-其他';
COMMENT ON COLUMN order_audits.difficulty IS '难度等级：easy-简单，medium-中等，hard-困难';
COMMENT ON COLUMN order_audits.status IS '审核状态：pending-待审核，approved-已通过，rejected-已驳回';
