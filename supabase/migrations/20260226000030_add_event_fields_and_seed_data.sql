-- ==========================================================================
-- 添加 events 表缺失字段并插入真实活动数据
-- ==========================================================================

-- 1. 添加缺失的字段
DO $$
BEGIN
    -- 添加 visibility 字段 (如果不存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'visibility'
    ) THEN
        ALTER TABLE public.events ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
        RAISE NOTICE 'Added visibility column to events table';
    END IF;

    -- 添加 rewards 字段 (如果存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'rewards'
    ) THEN
        ALTER TABLE public.events ADD COLUMN rewards TEXT;
        RAISE NOTICE 'Added rewards column to events table';
    END IF;

    -- 添加 category 字段 (如果存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.events ADD COLUMN category TEXT;
        RAISE NOTICE 'Added category column to events table';
    END IF;

    -- 添加 requirements 字段 (如果存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'requirements'
    ) THEN
        ALTER TABLE public.events ADD COLUMN requirements TEXT;
        RAISE NOTICE 'Added requirements column to events table';
    END IF;

    -- 添加 image_url 字段 (如果存在，用于存储活动封面图)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.events ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column to events table';
    END IF;

    -- 添加 registration_deadline 字段 (报名截止时间)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'registration_deadline'
    ) THEN
        ALTER TABLE public.events ADD COLUMN registration_deadline TIMESTAMPTZ;
        RAISE NOTICE 'Added registration_deadline column to events table';
    END IF;
END
$$;

-- 2. 插入真实的天津文化活动数据
-- 首先检查是否已存在数据，避免重复插入
DO $$
DECLARE
    v_count INTEGER;
    v_organizer_id UUID;
BEGIN
    -- 检查是否已有活动数据
    SELECT COUNT(*) INTO v_count FROM public.events WHERE status = 'published';
    
    IF v_count > 0 THEN
        RAISE NOTICE 'Events already exist, skipping seed data insertion';
    ELSE
        -- 尝试获取一个有效的用户ID作为组织者
        SELECT id INTO v_organizer_id 
        FROM auth.users 
        LIMIT 1;
        
        -- 如果没有找到用户，使用一个默认的 UUID
        IF v_organizer_id IS NULL THEN
            v_organizer_id := '00000000-0000-0000-0000-000000000001'::UUID;
        END IF;

        -- 插入活动 1: 天津老字号品牌创新设计大赛
        INSERT INTO public.events (
            id, title, description, content, 
            start_time, end_time, registration_deadline,
            location, organizer_id, 
            max_participants, participants,
            type, status, visibility,
            rewards, category, requirements,
            tags, image_url,
            published_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            '2025 天津老字号品牌创新设计大赛',
            '面向设计师和创意团队征集天津老字号品牌的创新设计方案，包括品牌视觉、包装设计、文创产品等',
            '## 活动背景
天津老字号承载着城市的历史记忆与文化底蕴。本次大赛旨在通过创新设计，让老字号焕发新的生机。

## 征集内容
1. 品牌视觉设计：Logo、VI系统、品牌手册
2. 包装设计：产品包装、礼盒设计
3. 文创产品：基于老字号元素的文创衍生品
4. 数字媒体：短视频、动画、交互设计

## 奖项设置
- 金奖：1名，奖金5万元 + 证书
- 银奖：2名，奖金3万元 + 证书  
- 铜奖：3名，奖金1万元 + 证书
- 优秀奖：10名，奖金2000元 + 证书

## 参赛要求
- 个人或团队均可参赛
- 作品需体现天津文化元素
- 提交作品需为原创设计',
            '2025-01-01 00:00:00+08'::TIMESTAMPTZ,
            '2025-12-31 23:59:59+08'::TIMESTAMPTZ,
            '2025-11-30 23:59:59+08'::TIMESTAMPTZ,
            '天津市',
            v_organizer_id,
            500, 0,
            'online', 'published', 'public',
            '金奖5万元、银奖3万元、铜奖1万元',
            '品牌设计',
            '面向设计师和创意团队，作品需体现天津文化元素',
            '["品牌设计", "老字号", "文创", "天津文化"]'::JSONB,
            'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
            NOW(), NOW(), NOW()
        );

        -- 插入活动 2: 津门非遗文创设计大赛
        INSERT INTO public.events (
            id, title, description, content, 
            start_time, end_time, registration_deadline,
            location, organizer_id, 
            max_participants, participants,
            type, status, visibility,
            rewards, category, requirements,
            tags, image_url,
            published_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            '2025 津门非遗文创设计大赛',
            '以天津非物质文化遗产为灵感，设计具有天津特色的文创产品，传承和弘扬传统文化',
            '## 活动介绍
天津拥有丰富的非物质文化遗产，包括杨柳青年画、泥人张、风筝魏等。本次大赛鼓励设计师从这些非遗项目中汲取灵感，创作现代文创产品。

## 设计方向
1. 杨柳青年画元素文创
2. 泥人张彩塑周边设计
3. 风筝魏风筝主题产品
4. 天津曲艺文化衍生品
5. 传统美食包装设计

## 奖项设置
- 最佳设计奖：1名，奖金3万元
- 创新奖：3名，奖金1万元
- 人气奖：5名，奖金5000元
- 入围奖：20名，颁发证书',
            '2025-03-01 00:00:00+08'::TIMESTAMPTZ,
            '2025-09-30 23:59:59+08'::TIMESTAMPTZ,
            '2025-08-31 23:59:59+08'::TIMESTAMPTZ,
            '天津市',
            v_organizer_id,
            300, 0,
            'online', 'published', 'public',
            '最佳设计奖3万元、创新奖1万元、人气奖5000元',
            '文创设计',
            '作品需基于天津非遗元素进行创新设计',
            '["非遗", "文创", "杨柳青年画", "泥人张", "天津文化"]'::JSONB,
            'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&h=400&fit=crop',
            NOW(), NOW(), NOW()
        );

        -- 插入活动 3: 天津城市IP形象设计大赛
        INSERT INTO public.events (
            id, title, description, content, 
            start_time, end_time, registration_deadline,
            location, organizer_id, 
            max_participants, participants,
            type, status, visibility,
            rewards, category, requirements,
            tags, image_url,
            published_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            '2025 天津城市IP形象设计大赛',
            '为天津设计独特的城市IP形象，展现天津的历史文化、城市精神和时代风貌',
            '## 大赛主题
"津彩无限"——用创意诠释天津魅力

## 设计要求
1. IP形象需体现天津特色（如相声、美食、建筑等）
2. 形象可爱、亲和，易于传播
3. 需设计基础形象及3个以上延展场景
4. 提供设计说明文档

## 评选标准
- 创意性（30%）
- 文化契合度（30%）
- 视觉表现力（20%）
- 延展应用性（20%）

## 奖项设置
- 金奖：1名，奖金8万元
- 银奖：2名，奖金4万元
- 铜奖：3名，奖金2万元
- 优秀奖：10名',
            '2025-02-15 00:00:00+08'::TIMESTAMPTZ,
            '2025-08-15 23:59:59+08'::TIMESTAMPTZ,
            '2025-07-15 23:59:59+08'::TIMESTAMPTZ,
            '天津市',
            v_organizer_id,
            1000, 0,
            'online', 'published', 'public',
            '金奖8万元、银奖4万元、铜奖2万元',
            'IP设计',
            '个人或团队参赛，作品需原创',
            '["IP设计", "城市形象", "吉祥物", "天津"]'::JSONB,
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
            NOW(), NOW(), NOW()
        );

        -- 插入活动 4: 海河文化海报设计大赛
        INSERT INTO public.events (
            id, title, description, content, 
            start_time, end_time, registration_deadline,
            location, organizer_id, 
            max_participants, participants,
            type, status, visibility,
            rewards, category, requirements,
            tags, image_url,
            published_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            '2025 海河文化海报设计大赛',
            '以海河文化为主题，设计展现天津母亲河魅力的海报作品',
            '## 活动背景
海河是天津的母亲河，见证了天津的沧桑巨变。本次大赛邀请设计师用海报形式展现海河之美。

## 创作主题
1. 海河风光：桥梁、建筑、夜景
2. 海河人文：码头文化、航运历史
3. 海河生态：绿色发展、生态文明
4. 海河未来：城市愿景、创新发展

## 作品规格
- 尺寸：A3（297×420mm）
- 分辨率：300dpi
- 格式：JPG/PNG

## 奖项设置
- 一等奖：1名，奖金2万元
- 二等奖：3名，奖金1万元
- 三等奖：5名，奖金5000元
- 入围奖：30名',
            '2025-04-01 00:00:00+08'::TIMESTAMPTZ,
            '2025-10-31 23:59:59+08'::TIMESTAMPTZ,
            '2025-09-30 23:59:59+08'::TIMESTAMPTZ,
            '天津市',
            v_organizer_id,
            800, 0,
            'online', 'published', 'public',
            '一等奖2万元、二等奖1万元、三等奖5000元',
            '海报设计',
            '作品需围绕海河文化主题创作',
            '["海报设计", "海河", "天津", "平面设计"]'::JSONB,
            'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=400&fit=crop',
            NOW(), NOW(), NOW()
        );

        RAISE NOTICE 'Successfully inserted 4 real events into the database';
    END IF;
END
$$;

-- 3. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
