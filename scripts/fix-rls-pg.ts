/**
 * 使用 pg 库直接连接 PostgreSQL 修复 RLS
 */
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('错误: 缺少 DATABASE_URL 环境变量');
  process.exit(1);
}

async function fixRLS() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('连接到 PostgreSQL...\n');
    await client.connect();

    console.log('1. 禁用 RLS...');
    await client.query('ALTER TABLE public.brand_tasks DISABLE ROW LEVEL SECURITY;');
    console.log('   ✓ RLS 已禁用');

    console.log('\n2. 删除现有策略...');
    const dropPolicies = `
      DROP POLICY IF EXISTS "查看已发布品牌任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者管理自己的任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者查看自己的任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者创建任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者更新自己的任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者删除自己的任务" ON public.brand_tasks;
    `;
    await client.query(dropPolicies);
    console.log('   ✓ 已删除现有策略');

    console.log('\n3. 重新启用 RLS...');
    await client.query('ALTER TABLE public.brand_tasks ENABLE ROW LEVEL SECURITY;');
    console.log('   ✓ RLS 已启用');

    console.log('\n4. 创建新策略...');
    const createPolicies = `
      CREATE POLICY "查看已发布品牌任务" ON public.brand_tasks
          FOR SELECT TO public
          USING (status = 'published');

      CREATE POLICY "发布者查看自己的任务" ON public.brand_tasks
          FOR SELECT TO public
          USING (publisher_id = auth.uid());

      CREATE POLICY "发布者创建任务" ON public.brand_tasks
          FOR INSERT TO public
          WITH CHECK (publisher_id = auth.uid());

      CREATE POLICY "发布者更新自己的任务" ON public.brand_tasks
          FOR UPDATE TO public
          USING (publisher_id = auth.uid());

      CREATE POLICY "发布者删除自己的任务" ON public.brand_tasks
          FOR DELETE TO public
          USING (publisher_id = auth.uid());
    `;
    await client.query(createPolicies);
    console.log('   ✓ 已创建新策略');

    console.log('\n5. 刷新缓存...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('   ✓ 缓存已刷新');

    console.log('\n✓ RLS 策略修复完成！');
    console.log('现在可以刷新浏览器页面，创建任务应该能正常工作了。');

  } catch (error: any) {
    console.error('\n✗ 修复失败:', error.message);
    console.error('\n请手动在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL:');
    console.error('---');
    console.error(`
ALTER TABLE public.brand_tasks DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "查看已发布品牌任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者管理自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者查看自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者创建任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者更新自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者删除自己的任务" ON public.brand_tasks;

ALTER TABLE public.brand_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "查看已发布品牌任务" ON public.brand_tasks
    FOR SELECT TO public
    USING (status = 'published');

CREATE POLICY "发布者查看自己的任务" ON public.brand_tasks
    FOR SELECT TO public
    USING (publisher_id = auth.uid());

CREATE POLICY "发布者创建任务" ON public.brand_tasks
    FOR INSERT TO public
    WITH CHECK (publisher_id = auth.uid());

CREATE POLICY "发布者更新自己的任务" ON public.brand_tasks
    FOR UPDATE TO public
    USING (publisher_id = auth.uid());

CREATE POLICY "发布者删除自己的任务" ON public.brand_tasks
    FOR DELETE TO public
    USING (publisher_id = auth.uid());

NOTIFY pgrst, 'reload schema';
    `);
    console.error('---');
  } finally {
    await client.end();
  }
}

fixRLS();
