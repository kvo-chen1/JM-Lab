-- ============================================================
-- 奖品系统数据库迁移
-- 创建奖品相关表和索引
-- ============================================================

-- 奖品表
CREATE TABLE IF NOT EXISTS event_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    rank_name VARCHAR(100) NOT NULL,
    combination_type VARCHAR(20) NOT NULL DEFAULT 'single',
    single_prize JSONB,
    sub_prizes JSONB,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_highlight BOOLEAN NOT NULL DEFAULT false,
    highlight_color VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 获奖者表
CREATE TABLE IF NOT EXISTS prize_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prize_id UUID NOT NULL REFERENCES event_prizes(id) ON DELETE CASCADE,
    won_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMPTZ,
    shipping_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_prizes_event_id ON event_prizes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_prizes_level ON event_prizes(level);
CREATE INDEX IF NOT EXISTS idx_event_prizes_status ON event_prizes(status);
CREATE INDEX IF NOT EXISTS idx_event_prizes_display_order ON event_prizes(display_order);

CREATE INDEX IF NOT EXISTS idx_prize_winners_event_id ON prize_winners(event_id);
CREATE INDEX IF NOT EXISTS idx_prize_winners_user_id ON prize_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_prize_winners_prize_id ON prize_winners(prize_id);
CREATE INDEX IF NOT EXISTS idx_prize_winners_claimed ON prize_winners(claimed);

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为奖品表创建触发器
DROP TRIGGER IF EXISTS update_event_prizes_updated_at ON event_prizes;
CREATE TRIGGER update_event_prizes_updated_at
    BEFORE UPDATE ON event_prizes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为获奖者表创建触发器
DROP TRIGGER IF EXISTS update_prize_winners_updated_at ON prize_winners;
CREATE TRIGGER update_prize_winners_updated_at
    BEFORE UPDATE ON prize_winners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用RLS
ALTER TABLE event_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_winners ENABLE ROW LEVEL SECURITY;

-- 奖品表策略
-- 任何人可以查看活动的奖品
CREATE POLICY "允许查看活动奖品" ON event_prizes
    FOR SELECT USING (true);

-- 只有活动组织者或管理员可以创建奖品
CREATE POLICY "允许组织者创建奖品" ON event_prizes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );

-- 只有活动组织者或管理员可以更新奖品
CREATE POLICY "允许组织者更新奖品" ON event_prizes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );

-- 只有活动组织者或管理员可以删除奖品
CREATE POLICY "允许组织者删除奖品" ON event_prizes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );

-- 获奖者表策略
-- 用户可以查看自己的获奖记录
CREATE POLICY "允许用户查看自己的获奖记录" ON prize_winners
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );

-- 只有活动组织者可以创建获奖记录
CREATE POLICY "允许组织者创建获奖记录" ON prize_winners
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );

-- 用户可以更新自己的领奖状态
CREATE POLICY "允许用户更新自己的领奖状态" ON prize_winners
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND e.organizer_id = auth.uid()
        )
    );

-- 添加注释
COMMENT ON TABLE event_prizes IS '活动奖品表，存储每个活动的奖品配置';
COMMENT ON TABLE prize_winners IS '获奖者表，存储用户获奖记录';

COMMENT ON COLUMN event_prizes.level IS '奖品等级：1=一等奖, 2=二等奖, 3=三等奖, 4=四等奖, 5=五等奖, 0=特别奖, 99=参与奖';
COMMENT ON COLUMN event_prizes.combination_type IS '奖品组合类型：single=单一奖品, compound=复合奖品';
COMMENT ON COLUMN event_prizes.single_prize IS '单一奖品详情，JSON格式';
COMMENT ON COLUMN event_prizes.sub_prizes IS '复合奖品子奖品列表，JSON数组格式';
