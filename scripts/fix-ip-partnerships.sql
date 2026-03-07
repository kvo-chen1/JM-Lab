-- 修复 ip_partnerships 表，添加缺失的列

-- 添加缺失的列（如果不存在）
DO $$
BEGIN
    -- 添加 brand_id 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ip_partnerships' AND column_name = 'brand_id'
    ) THEN
        ALTER TABLE ip_partnerships ADD COLUMN brand_id UUID;
        RAISE NOTICE 'Added brand_id column';
    END IF;
    
    -- 添加 brand_name 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ip_partnerships' AND column_name = 'brand_name'
    ) THEN
        ALTER TABLE ip_partnerships ADD COLUMN brand_name TEXT;
        RAISE NOTICE 'Added brand_name column';
    END IF;
    
    -- 添加 brand_logo 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ip_partnerships' AND column_name = 'brand_logo'
    ) THEN
        ALTER TABLE ip_partnerships ADD COLUMN brand_logo TEXT;
        RAISE NOTICE 'Added brand_logo column';
    END IF;
    
    -- 添加 description 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ip_partnerships' AND column_name = 'description'
    ) THEN
        ALTER TABLE ip_partnerships ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;
    
    -- 添加 reward 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ip_partnerships' AND column_name = 'reward'
    ) THEN
        ALTER TABLE ip_partnerships ADD COLUMN reward TEXT;
        RAISE NOTICE 'Added reward column';
    END IF;
    
    -- 添加 status 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ip_partnerships' AND column_name = 'status'
    ) THEN
        ALTER TABLE ip_partnerships ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE 'Added status column';
    END IF;
    
    -- 添加 created_at 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ip_partnerships' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE ip_partnerships ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    -- 添加 updated_at 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ip_partnerships' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE ip_partnerships ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_ip_asset_id ON ip_partnerships(ip_asset_id);
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_status ON ip_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_ip_partnerships_brand_id ON ip_partnerships(brand_id);

-- 启用 RLS（如果不存在）
DO $$
BEGIN
    ALTER TABLE ip_partnerships ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'RLS already enabled or error: %', SQLERRM;
END $$;

-- 删除已存在的策略（避免冲突）
DROP POLICY IF EXISTS "Users can view own IP partnerships" ON ip_partnerships;
DROP POLICY IF EXISTS "Users can create own IP partnerships" ON ip_partnerships;
DROP POLICY IF EXISTS "Users can update own IP partnerships" ON ip_partnerships;
DROP POLICY IF EXISTS "Users can delete own IP partnerships" ON ip_partnerships;

-- 创建 RLS 策略
CREATE POLICY "Users can view own IP partnerships" ON ip_partnerships FOR SELECT USING (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users can create own IP partnerships" ON ip_partnerships FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users can update own IP partnerships" ON ip_partnerships FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);
CREATE POLICY "Users can delete own IP partnerships" ON ip_partnerships FOR DELETE USING (
    EXISTS (SELECT 1 FROM ip_assets a WHERE a.id = ip_asset_id AND a.user_id = auth.uid())
);

SELECT 'ip_partnerships 表修复完成!' as result;
