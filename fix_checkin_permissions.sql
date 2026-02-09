-- 修复签到和相关表的权限问题
-- 允许匿名用户和认证用户访问

-- 1. 签到记录表权限
ALTER TABLE public.checkin_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on checkin_records" ON public.checkin_records;
DROP POLICY IF EXISTS "Allow anon insert on checkin_records" ON public.checkin_records;
DROP POLICY IF EXISTS "Allow authenticated select on checkin_records" ON public.checkin_records;
DROP POLICY IF EXISTS "Allow authenticated insert on checkin_records" ON public.checkin_records;

CREATE POLICY "Allow anon select on checkin_records" 
  ON public.checkin_records FOR SELECT 
  TO anon USING (true);

CREATE POLICY "Allow anon insert on checkin_records" 
  ON public.checkin_records FOR INSERT 
  TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated select on checkin_records" 
  ON public.checkin_records FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on checkin_records" 
  ON public.checkin_records FOR INSERT 
  TO authenticated WITH CHECK (true);

-- 2. 任务记录表权限
ALTER TABLE public.task_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on task_records" ON public.task_records;
DROP POLICY IF EXISTS "Allow anon insert on task_records" ON public.task_records;
DROP POLICY IF EXISTS "Allow authenticated select on task_records" ON public.task_records;
DROP POLICY IF EXISTS "Allow authenticated insert on task_records" ON public.task_records;

CREATE POLICY "Allow anon select on task_records" 
  ON public.task_records FOR SELECT 
  TO anon USING (true);

CREATE POLICY "Allow anon insert on task_records" 
  ON public.task_records FOR INSERT 
  TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated select on task_records" 
  ON public.task_records FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on task_records" 
  ON public.task_records FOR INSERT 
  TO authenticated WITH CHECK (true);

-- 3. 兑换记录表权限
ALTER TABLE public.exchange_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on exchange_records" ON public.exchange_records;
DROP POLICY IF EXISTS "Allow anon insert on exchange_records" ON public.exchange_records;
DROP POLICY IF EXISTS "Allow authenticated select on exchange_records" ON public.exchange_records;
DROP POLICY IF EXISTS "Allow authenticated insert on exchange_records" ON public.exchange_records;

CREATE POLICY "Allow anon select on exchange_records" 
  ON public.exchange_records FOR SELECT 
  TO anon USING (true);

CREATE POLICY "Allow anon insert on exchange_records" 
  ON public.exchange_records FOR INSERT 
  TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated select on exchange_records" 
  ON public.exchange_records FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on exchange_records" 
  ON public.exchange_records FOR INSERT 
  TO authenticated WITH CHECK (true);

-- 4. 邀请记录表权限
ALTER TABLE public.invite_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on invite_records" ON public.invite_records;
DROP POLICY IF EXISTS "Allow anon insert on invite_records" ON public.invite_records;
DROP POLICY IF EXISTS "Allow authenticated select on invite_records" ON public.invite_records;
DROP POLICY IF EXISTS "Allow authenticated insert on invite_records" ON public.invite_records;

CREATE POLICY "Allow anon select on invite_records" 
  ON public.invite_records FOR SELECT 
  TO anon USING (true);

CREATE POLICY "Allow anon insert on invite_records" 
  ON public.invite_records FOR INSERT 
  TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated select on invite_records" 
  ON public.invite_records FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on invite_records" 
  ON public.invite_records FOR INSERT 
  TO authenticated WITH CHECK (true);

-- 5. 消费记录表权限
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on consumption_records" ON public.consumption_records;
DROP POLICY IF EXISTS "Allow anon insert on consumption_records" ON public.consumption_records;
DROP POLICY IF EXISTS "Allow authenticated select on consumption_records" ON public.consumption_records;
DROP POLICY IF EXISTS "Allow authenticated insert on consumption_records" ON public.consumption_records;

CREATE POLICY "Allow anon select on consumption_records" 
  ON public.consumption_records FOR SELECT 
  TO anon USING (true);

CREATE POLICY "Allow anon insert on consumption_records" 
  ON public.consumption_records FOR INSERT 
  TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated select on consumption_records" 
  ON public.consumption_records FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on consumption_records" 
  ON public.consumption_records FOR INSERT 
  TO authenticated WITH CHECK (true);

-- 6. 积分规则表权限
ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select on points_rules" ON public.points_rules;
DROP POLICY IF EXISTS "Allow authenticated select on points_rules" ON public.points_rules;

CREATE POLICY "Allow anon select on points_rules" 
  ON public.points_rules FOR SELECT 
  TO anon USING (true);

CREATE POLICY "Allow authenticated select on points_rules" 
  ON public.points_rules FOR SELECT 
  TO authenticated USING (true);

-- 授予权限
GRANT ALL ON public.checkin_records TO anon;
GRANT ALL ON public.checkin_records TO authenticated;
GRANT ALL ON public.checkin_records TO service_role;

GRANT ALL ON public.task_records TO anon;
GRANT ALL ON public.task_records TO authenticated;
GRANT ALL ON public.task_records TO service_role;

GRANT ALL ON public.exchange_records TO anon;
GRANT ALL ON public.exchange_records TO authenticated;
GRANT ALL ON public.exchange_records TO service_role;

GRANT ALL ON public.invite_records TO anon;
GRANT ALL ON public.invite_records TO authenticated;
GRANT ALL ON public.invite_records TO service_role;

GRANT ALL ON public.consumption_records TO anon;
GRANT ALL ON public.consumption_records TO authenticated;
GRANT ALL ON public.consumption_records TO service_role;

GRANT ALL ON public.points_rules TO anon;
GRANT ALL ON public.points_rules TO authenticated;
GRANT ALL ON public.points_rules TO service_role;

SELECT 'Permissions fixed successfully' as status;
