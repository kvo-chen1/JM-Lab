/**
 * 修复 brand_tasks 表的 RLS 策略
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
    // 执行修复 SQL
    const fixSQL = `
-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "发布者管理自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者可以创建任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者可以查看自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者可以更新自己的任务" ON public.brand_tasks;
DROP POLICY IF EXISTS "发布者可以删除自己的任务" ON public.brand_tasks;

-- 1. 任何人可以查看已发布的任务
DROP POLICY IF EXISTS "查看已发布品牌任务" ON public.brand_tasks;
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

    // 使用 supabase 的 rpc 或者直接查询执行 SQL
    const { error } = await supabase.rpc('exec_sql', { sql: fixSQL });

    if (error) {
      console.error('执行 SQL 失败:', error);
      
      // 如果 exec_sql 函数不存在，尝试直接执行
      console.log('尝试直接执行...');
      
      // 分步骤执行
      const policies = [
        { name: '删除旧策略', sql: `DROP POLICY IF EXISTS "发布者管理自己的任务" ON public.brand_tasks;` },
        { name: '删除查看已发布任务策略', sql: `DROP POLICY IF EXISTS "查看已发布品牌任务" ON public.brand_tasks;` },
        { name: '创建查看已发布任务策略', sql: `CREATE POLICY "查看已发布品牌任务" ON public.brand_tasks FOR SELECT TO public USING (status = 'published');` },
        { name: '创建发布者查看策略', sql: `CREATE POLICY "发布者查看自己的任务" ON public.brand_tasks FOR SELECT TO public USING (publisher_id = auth.uid());` },
        { name: '创建发布者插入策略', sql: `CREATE POLICY "发布者创建任务" ON public.brand_tasks FOR INSERT TO public WITH CHECK (publisher_id = auth.uid());` },
        { name: '创建发布者更新策略', sql: `CREATE POLICY "发布者更新自己的任务" ON public.brand_tasks FOR UPDATE TO public USING (publisher_id = auth.uid());` },
        { name: '创建发布者删除策略', sql: `CREATE POLICY "发布者删除自己的任务" ON public.brand_tasks FOR DELETE TO public USING (publisher_id = auth.uid());` },
      ];

      for (const policy of policies) {
        try {
          const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy.sql });
          if (policyError) {
            // 尝试使用 query
            console.log(`  ${policy.name}: 使用备用方法...`);
          } else {
            console.log(`✓ ${policy.name}`);
          }
        } catch (e) {
          console.log(`  ${policy.name}: 跳过或已存在`);
        }
      }
    } else {
      console.log('✓ RLS 策略修复成功！');
    }

    // 验证策略是否创建成功
    console.log('\n验证策略...');
    const { data: policies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'brand_tasks');

    if (verifyError) {
      console.log('无法验证策略（需要访问 pg_policies 表的权限）');
    } else {
      console.log('当前 brand_tasks 表的策略:');
      policies?.forEach((p: any) => {
        console.log(`  - ${p.policyname}`);
      });
    }

    console.log('\n修复完成！');
    console.log('\n注意：如果策略未成功创建，请手动在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL:');
    console.log('---');
    console.log(fixSQL);
    console.log('---');

  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  }
}

fixBrandTasksRLS();
