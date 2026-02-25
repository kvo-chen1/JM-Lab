/**
 * 修复 brand_tasks 表的 RLS 策略 - 版本2
 * 允许发布者创建任务
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置');
  console.error('请确保设置了 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixBrandTasksRLS() {
  console.log('开始修复 brand_tasks 表的 RLS 策略...\n');

  try {
    // 先检查当前的策略
    console.log('1. 检查当前策略...');
    const { data: currentPolicies, error: checkError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'brand_tasks');

    if (checkError) {
      console.log('   无法查询当前策略:', checkError.message);
    } else {
      console.log('   当前策略:', currentPolicies?.map((p: any) => p.policyname).join(', ') || '无');
    }

    // 删除所有现有策略
    console.log('\n2. 删除所有现有策略...');
    const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "查看已发布品牌任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者管理自己的任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者查看自己的任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者创建任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者更新自己的任务" ON public.brand_tasks;
      DROP POLICY IF EXISTS "发布者删除自己的任务" ON public.brand_tasks;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPoliciesSQL });
    if (dropError) {
      console.log('   删除策略时出错（可能策略不存在）:', dropError.message);
    } else {
      console.log('   ✓ 已删除所有现有策略');
    }

    // 创建新策略
    console.log('\n3. 创建新的 RLS 策略...');
    const createPoliciesSQL = `
      -- 1. 任何人可以查看已发布的任务
      CREATE POLICY "查看已发布品牌任务" ON public.brand_tasks
          FOR SELECT TO public
          USING (status = 'published');

      -- 2. 发布者可以查看自己的所有任务（包括草稿）
      CREATE POLICY "发布者查看自己的任务" ON public.brand_tasks
          FOR SELECT TO public
          USING (publisher_id = auth.uid());

      -- 3. 发布者可以创建任务（关键修复）
      CREATE POLICY "发布者创建任务" ON public.brand_tasks
          FOR INSERT TO public
          WITH CHECK (publisher_id = auth.uid());

      -- 4. 发布者可以更新自己的任务
      CREATE POLICY "发布者更新自己的任务" ON public.brand_tasks
          FOR UPDATE TO public
          USING (publisher_id = auth.uid());

      -- 5. 发布者可以删除自己的任务
      CREATE POLICY "发布者删除自己的任务" ON public.brand_tasks
          FOR DELETE TO public
          USING (publisher_id = auth.uid());
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL });
    if (createError) {
      console.error('   ✗ 创建策略失败:', createError.message);
      throw createError;
    } else {
      console.log('   ✓ 已创建所有新策略');
    }

    // 验证策略是否创建成功
    console.log('\n4. 验证策略...');
    const { data: newPolicies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'brand_tasks');

    if (verifyError) {
      console.log('   无法验证策略:', verifyError.message);
    } else {
      console.log('   当前 brand_tasks 表的策略:');
      newPolicies?.forEach((p: any) => {
        console.log(`     - ${p.policyname}`);
      });
    }

    console.log('\n✓ RLS 策略修复完成！');

  } catch (error: any) {
    console.error('\n✗ 修复失败:', error.message);
    console.error('\n请手动在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL:');
    console.error('---');
    console.error(`
-- 删除所有现有策略
DROP POLICY IF EXISTS "查看已发布品牌任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者管理自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者查看自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者创建任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者更新自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者删除自己的任务" ON public.brand_tasks;

-- 创建新策略
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
    `);
    console.error('---');
    process.exit(1);
  }
}

fixBrandTasksRLS();
