-- ============================================
-- 积分商城商品表创建脚本
-- ============================================

-- 创建积分商城商品表
CREATE TABLE IF NOT EXISTS public.points_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT CHECK (category IN ('virtual', 'physical', 'service', 'rights', 'experience')),
    image_url TEXT,
    tags JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
    is_featured BOOLEAN DEFAULT false,
    is_limited BOOLEAN DEFAULT false,
    limit_per_user INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加表注释
COMMENT ON TABLE public.points_products IS '积分商城商品表';
COMMENT ON COLUMN public.points_products.points IS '所需积分';
COMMENT ON COLUMN public.points_products.category IS '商品分类: virtual-虚拟, physical-实物, service-服务, rights-权益, experience-体验';
COMMENT ON COLUMN public.points_products.status IS '商品状态: active-上架, inactive-下架, sold_out-售罄';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_points_products_status ON public.points_products(status);
CREATE INDEX IF NOT EXISTS idx_points_products_category ON public.points_products(category);
CREATE INDEX IF NOT EXISTS idx_points_products_featured ON public.points_products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_points_products_sort_order ON public.points_products(sort_order);

-- 启用 RLS
ALTER TABLE public.points_products ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 所有人可以查看上架的商品
CREATE POLICY "Anyone can view active points products" ON public.points_products
    FOR SELECT USING (status = 'active');

-- 管理员可以管理所有商品
CREATE POLICY "Admin can manage all points products" ON public.points_products
    FOR ALL USING (true) WITH CHECK (true);

-- 服务角色可以管理所有商品
CREATE POLICY "Service role can manage all points products" ON public.points_products
    FOR ALL USING (true) WITH CHECK (true);

-- 授予权限
GRANT ALL ON public.points_products TO anon, authenticated, service_role;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION public.set_points_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_points_products_updated_at ON public.points_products;
CREATE TRIGGER set_points_products_updated_at
    BEFORE UPDATE ON public.points_products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_points_products_updated_at();

-- 插入默认商品数据（与截图中类似的商品）
INSERT INTO public.points_products (name, description, points, stock, category, image_url, tags, status, is_featured, sort_order) VALUES
('无线充电宝', '10000mAh 无线充电宝，支持快充，轻薄便携。', 1200, 99, 'physical', 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400', '["充电宝", "无线", "数码"]', 'active', true, 1),
('智能保温杯', '智能温度显示保温杯，24小时保温保冷，办公出行必备。', 899, 158, 'physical', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', '["保温杯", "智能", "办公"]', 'active', true, 2),
('津小脉毛绒公仔', '可爱津小脉IP毛绒公仔，高30cm，手感柔软，适合收藏和送礼。', 599, 50, 'physical', 'https://images.unsplash.com/photo-1556012018-50c5c0da73bf?w=400', '["公仔", "毛绒玩具", "津小脉"]', 'active', true, 3),
('天津文化明信片套装', '精美天津文化主题明信片，一套12张，适合收藏和邮寄。', 299, 200, 'physical', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400', '["明信片", "文化", "收藏"]', 'active', false, 4),
('津脉智坊定制笔记本', '津脉智坊品牌定制笔记本，高质量纸张，精美封面设计。', 399, 100, 'physical', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400', '["笔记本", "文具", "定制"]', 'active', false, 5),
('津小脉文创T恤', '津小脉IP文创T恤，纯棉材质，舒适透气，多尺码可选。', 699, 80, 'physical', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', '["T恤", "文创", "津小脉"]', 'active', false, 6),
('平台会员7天体验', '享受会员专属功能和特权，7天体验卡。', 300, 100, 'virtual', 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', '["会员", "虚拟", "体验"]', 'active', true, 7),
('创作素材包', '包含50+优质创作素材，助力内容创作。', 500, 999, 'virtual', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', '["素材", "创作", "虚拟"]', 'active', false, 8),
('创作导师1对1指导', '30分钟专业创作指导，提升创作技能。', 1000, 10, 'service', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400', '["指导", "服务", "导师"]', 'active', true, 9),
('津门老字号文化体验课', '深入了解津门老字号文化，体验传统工艺。', 800, 20, 'experience', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400', '["文化", "体验", "老字号"]', 'active', false, 10)
ON CONFLICT DO NOTHING;

-- 更新 exchange_records 表的 product_id 字段为 UUID 类型（如果还不是）
-- 注意：这会删除现有数据，请谨慎执行
-- ALTER TABLE public.exchange_records DROP COLUMN IF EXISTS product_id;
-- ALTER TABLE public.exchange_records ADD COLUMN product_id UUID REFERENCES public.points_products(id);

SELECT '积分商城商品表创建成功' as status;
