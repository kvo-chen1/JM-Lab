// 执行数据库迁移脚本
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
-- 创建品牌合作申请表
CREATE TABLE IF NOT EXISTS public.brand_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name TEXT NOT NULL,
    brand_logo TEXT,
    brand_id TEXT,
    description TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    reward TEXT DEFAULT '待协商',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'negotiating', 'approved', 'rejected')),
    applicant_id UUID REFERENCES public.users(id),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建品牌合作活动表（品牌方创建的活动需要审核）
CREATE TABLE IF NOT EXISTS public.brand_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    brand_id UUID REFERENCES public.brand_partnerships(id),
    brand_name TEXT NOT NULL,
    organizer_id UUID NOT NULL REFERENCES public.users(id),
    participants INTEGER NOT NULL DEFAULT 0,
    max_participants INTEGER,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    type TEXT NOT NULL CHECK (type IN ('online', 'offline')),
    tags JSONB DEFAULT '[]'::jsonb,
    thumbnail_url TEXT,
    media JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为品牌合作申请表添加触发器
DROP TRIGGER IF EXISTS update_brand_partnerships_updated_at ON public.brand_partnerships;
CREATE TRIGGER update_brand_partnerships_updated_at
    BEFORE UPDATE ON public.brand_partnerships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为品牌活动表添加触发器
DROP TRIGGER IF EXISTS update_brand_events_updated_at ON public.brand_events;
CREATE TRIGGER update_brand_events_updated_at
    BEFORE UPDATE ON public.brand_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE public.brand_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_events ENABLE ROW LEVEL SECURITY;

-- 品牌合作申请表的 RLS 策略
-- 任何人都可以创建申请
CREATE POLICY "任何人可以创建品牌合作申请" ON public.brand_partnerships
    FOR INSERT TO public
    WITH CHECK (true);

-- 申请人可以查看自己的申请
CREATE POLICY "申请人可以查看自己的申请" ON public.brand_partnerships
    FOR SELECT TO public
    USING (applicant_id = auth.uid() OR status = 'approved');

-- 管理员可以查看所有申请
CREATE POLICY "管理员可以查看所有品牌合作申请" ON public.brand_partnerships
    FOR SELECT TO public
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    ));

-- 管理员可以更新申请
CREATE POLICY "管理员可以更新品牌合作申请" ON public.brand_partnerships
    FOR UPDATE TO public
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    ));

-- 品牌活动表的 RLS 策略
-- 品牌方可以创建活动
CREATE POLICY "品牌方可以创建活动" ON public.brand_events
    FOR INSERT TO public
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.brand_partnerships 
        WHERE id = brand_id AND applicant_id = auth.uid() AND status = 'approved'
    ));

-- 任何人可以查看已发布的活动
CREATE POLICY "任何人可以查看已发布的品牌活动" ON public.brand_events
    FOR SELECT TO public
    USING (status = 'published' OR organizer_id = auth.uid());

-- 管理员可以查看所有活动
CREATE POLICY "管理员可以查看所有品牌活动" ON public.brand_events
    FOR SELECT TO public
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    ));

-- 品牌方可以更新自己的活动
CREATE POLICY "品牌方可以更新自己的活动" ON public.brand_events
    FOR UPDATE TO public
    USING (organizer_id = auth.uid());

-- 管理员可以更新所有活动
CREATE POLICY "管理员可以更新所有品牌活动" ON public.brand_events
    FOR UPDATE TO public
    USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    ));

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_brand_partnerships_status ON public.brand_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_brand_partnerships_applicant ON public.brand_partnerships(applicant_id);
CREATE INDEX IF NOT EXISTS idx_brand_events_status ON public.brand_events(status);
CREATE INDEX IF NOT EXISTS idx_brand_events_brand ON public.brand_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_events_organizer ON public.brand_events(organizer_id);
`;

async function runMigration() {
  console.log('开始执行数据库迁移...');
  
  try {
    // 使用 Supabase 的 rpc 执行 SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('迁移失败:', error);
      
      // 如果 exec_sql 函数不存在，尝试直接创建表
      console.log('尝试直接创建表...');
      
      // 创建品牌合作申请表
      const { error: table1Error } = await supabase
        .from('brand_partnerships')
        .select('count', { count: 'exact', head: true });
      
      if (table1Error && table1Error.code === '42P01') {
        console.log('brand_partnerships 表不存在，需要创建');
        console.log('请在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL:');
        console.log('\n' + migrationSQL);
      } else {
        console.log('brand_partnerships 表已存在');
      }
      
      process.exit(1);
    }
    
    console.log('迁移成功！');
  } catch (error) {
    console.error('执行迁移时出错:', error);
    process.exit(1);
  }
}

runMigration();
