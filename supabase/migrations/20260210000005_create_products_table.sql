-- 创建积分商城商品表
-- 包含商品信息、库存、分类等

-- 1. 商品表
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL CHECK (points > 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('virtual', 'physical', 'service', 'rights')),
    tags TEXT[] DEFAULT '{}',
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    max_exchange_per_user INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.products IS '积分商城商品表';

-- 2. 用户兑换记录详情表（扩展已有的 exchange_records）
-- 注意：exchange_records 表已在 20260209000001_create_points_system.sql 中创建
-- 这里添加一些补充索引和约束

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;

-- 启用 RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- RLS 策略
-- 所有用户可查看活跃商品
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (status = 'active');

-- 管理员可以管理商品（通过 is_admin 函数判断）
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;

-- 创建触发器
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_products_updated_at();

-- 插入默认商品数据
INSERT INTO public.products (name, description, points, stock, status, category, tags, image_url, sort_order, is_featured)
VALUES 
    ('虚拟红包', '1000积分兑换10元虚拟红包', 1000, 100, 'active', 'virtual', ARRAY['红包', '虚拟'], '/images/红包.svg', 1, true),
    ('创意贴纸包', '500积分兑换创意贴纸包', 500, 50, 'active', 'virtual', ARRAY['贴纸', '虚拟'], '/images/周边商品.svg', 2, false),
    ('AI创作工具包', '2000积分兑换高级AI创作工具包', 2000, 30, 'active', 'service', ARRAY['AI工具', '服务'], '/images/数字壁纸.svg', 3, true),
    ('专属成就徽章', '1500积分兑换专属成就徽章', 1500, 100, 'active', 'rights', ARRAY['徽章', '权益'], '/images/限定徽章.svg', 4, false),
    ('实体创意笔记本', '3000积分兑换实体创意笔记本', 3000, 20, 'active', 'physical', ARRAY['笔记本', '实体'], '/images/实物商品.svg', 5, false),
    ('数字艺术壁纸', '800积分兑换精选数字艺术壁纸包', 800, 200, 'active', 'virtual', ARRAY['壁纸', '艺术', '虚拟'], '/images/数字壁纸.svg', 6, false),
    ('表情包合集', '300积分兑换热门表情包合集', 300, 500, 'active', 'virtual', ARRAY['表情包', '虚拟', '社交'], '/images/表情包.svg', 7, false),
    ('虚拟头像框', '600积分兑换限定版虚拟头像框', 600, 150, 'active', 'virtual', ARRAY['头像框', '虚拟', '装饰'], '/images/头像框.svg', 8, false),
    ('电子书籍会员', '2500积分兑换一个月电子书籍会员', 2500, 40, 'active', 'service', ARRAY['电子书', '会员', '服务'], '/images/电子书会员.svg', 9, false),
    ('在线课程券', '1800积分兑换任意在线课程优惠券', 1800, 60, 'active', 'service', ARRAY['课程', '优惠券', '学习'], '/images/优惠券.svg', 10, false),
    ('VIP专属标识', '1200积分兑换VIP专属身份标识', 1200, 80, 'active', 'rights', ARRAY['VIP', '标识', '权益'], '/images/限定称号.svg', 11, false),
    ('优先体验权', '2200积分兑换新功能优先体验权', 2200, 50, 'active', 'rights', ARRAY['优先体验', '权益', '特权'], '/images/限定头像.svg', 12, false),
    ('定制马克杯', '3500积分兑换定制马克杯', 3500, 15, 'active', 'physical', ARRAY['马克杯', '实体', '定制'], '/images/实物商品.svg', 13, false),
    ('创意T恤', '4000积分兑换限量版创意T恤', 4000, 10, 'active', 'physical', ARRAY['T恤', '实体', '限量'], '/images/实物商品.svg', 14, false),
    ('音乐会员月卡', '1600积分兑换音乐平台会员月卡', 1600, 70, 'active', 'service', ARRAY['音乐', '会员', '娱乐'], '/images/音乐会员.svg', 15, false),
    ('游戏皮肤礼包', '2800积分兑换热门游戏皮肤礼包', 2800, 35, 'active', 'virtual', ARRAY['游戏', '皮肤', '虚拟'], '/images/限定皮肤.svg', 16, true),
    ('个性化签名', '900积分兑换AI生成个性化签名', 900, 120, 'active', 'service', ARRAY['签名', 'AI', '个性化'], '/images/数字壁纸.svg', 17, false),
    ('专属昵称颜色', '1100积分兑换专属昵称颜色一个月', 1100, 90, 'active', 'rights', ARRAY['昵称', '颜色', '权益'], '/images/限定背景.svg', 18, false),
    ('实体明信片套装', '1300积分兑换精美明信片套装', 1300, 45, 'active', 'physical', ARRAY['明信片', '实体', '收藏'], '/images/实物商品.svg', 19, false),
    ('虚拟宠物', '700积分兑换可爱虚拟宠物', 700, 180, 'active', 'virtual', ARRAY['宠物', '虚拟', '可爱'], '/images/限定头像.svg', 20, false),
    ('AI生成加速卡(1小时)', '200积分兑换1小时极速生成通道，减少等待时间', 200, 999, 'active', 'service', ARRAY['AI', '加速', '工具'], '/images/AI工具包.svg', 21, true),
    ('高级风格模型解锁', '1500积分解锁一款Pro级艺术风格模型', 1500, 999, 'active', 'virtual', ARRAY['AI', '模型', '权益'], '/images/限定皮肤.svg', 22, false),
    ('单次商业授权证书', '5000积分兑换单次作品商业使用授权', 5000, 100, 'active', 'rights', ARRAY['版权', '商用', '证书'], '/images/成就徽章.svg', 23, false)
ON CONFLICT DO NOTHING;

-- 创建 RPC 函数: 兑换商品（带库存检查和扣减）
CREATE OR REPLACE FUNCTION public.exchange_product(
    p_user_id UUID,
    p_product_id UUID,
    p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product RECORD;
    v_user_balance INTEGER;
    v_total_cost INTEGER;
    v_exchange_id UUID;
    v_result JSONB;
BEGIN
    -- 获取商品信息并锁定行
    SELECT * INTO v_product
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF v_product IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_message', '商品不存在'
        );
    END IF;

    -- 检查商品状态
    IF v_product.status != 'active' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_message', '商品已下架'
        );
    END IF;

    -- 检查库存
    IF v_product.stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_message', '商品库存不足'
        );
    END IF;

    -- 计算总积分消耗
    v_total_cost := v_product.points * p_quantity;

    -- 获取用户积分余额
    SELECT balance INTO v_user_balance
    FROM public.user_points_balance
    WHERE user_id = p_user_id;

    IF v_user_balance IS NULL THEN
        v_user_balance := 0;
    END IF;

    -- 检查积分是否足够
    IF v_user_balance < v_total_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_message', '积分余额不足'
        );
    END IF;

    -- 扣减库存
    UPDATE public.products
    SET stock = stock - p_quantity,
        status = CASE WHEN stock - p_quantity <= 0 THEN 'sold_out' ELSE status END
    WHERE id = p_product_id;

    -- 扣减用户积分
    PERFORM public.update_user_points_balance(
        p_user_id,
        -v_total_cost,
        'spent',
        '积分商城',
        'exchange',
        '兑换商品：' || v_product.name || ' x' || p_quantity
    );

    -- 创建兑换记录
    INSERT INTO public.exchange_records (
        user_id,
        product_id,
        product_name,
        product_category,
        points_cost,
        quantity,
        status
    ) VALUES (
        p_user_id,
        p_product_id::TEXT,
        v_product.name,
        v_product.category,
        v_total_cost,
        p_quantity,
        'completed'
    )
    RETURNING id INTO v_exchange_id;

    RETURN jsonb_build_object(
        'success', true,
        'exchange_id', v_exchange_id,
        'points_cost', v_total_cost,
        'remaining_stock', v_product.stock - p_quantity
    );
END;
$$;

-- 创建 RPC 函数: 获取商品列表（带筛选）
CREATE OR REPLACE FUNCTION public.get_products(
    p_category VARCHAR(50) DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'active',
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER;
    v_products JSONB;
BEGIN
    -- 获取总数
    SELECT COUNT(*) INTO v_total
    FROM public.products
    WHERE (p_status IS NULL OR status = p_status)
      AND (p_category IS NULL OR category = p_category)
      AND (p_search IS NULL OR 
           name ILIKE '%' || p_search || '%' OR 
           description ILIKE '%' || p_search || '%' OR
           EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || p_search || '%'));

    -- 获取商品列表
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'name', name,
            'description', description,
            'points', points,
            'stock', stock,
            'status', status,
            'category', category,
            'tags', tags,
            'image_url', image_url,
            'is_featured', is_featured,
            'created_at', created_at
        ) ORDER BY sort_order ASC, created_at DESC
    ) INTO v_products
    FROM (
        SELECT *
        FROM public.products
        WHERE (p_status IS NULL OR status = p_status)
          AND (p_category IS NULL OR category = p_category)
          AND (p_search IS NULL OR 
               name ILIKE '%' || p_search || '%' OR 
               description ILIKE '%' || p_search || '%' OR
               EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || p_search || '%'))
        ORDER BY sort_order ASC, created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) sub;

    RETURN jsonb_build_object(
        'total', v_total,
        'products', COALESCE(v_products, '[]'::JSONB),
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;

-- 创建 RPC 函数: 获取用户兑换记录（带商品详情）
CREATE OR REPLACE FUNCTION public.get_user_exchange_records_with_products(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER;
    v_records JSONB;
BEGIN
    -- 获取总数
    SELECT COUNT(*) INTO v_total
    FROM public.exchange_records
    WHERE user_id = p_user_id;

    -- 获取记录列表
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', er.id,
            'product_id', er.product_id,
            'product_name', er.product_name,
            'product_category', er.product_category,
            'points_cost', er.points_cost,
            'quantity', er.quantity,
            'status', er.status,
            'created_at', er.created_at,
            'product_image', p.image_url
        ) ORDER BY er.created_at DESC
    ) INTO v_records
    FROM (
        SELECT *
        FROM public.exchange_records
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) er
    LEFT JOIN public.products p ON p.id = er.product_id::UUID;

    RETURN jsonb_build_object(
        'total', v_total,
        'records', COALESCE(v_records, '[]'::JSONB),
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;
