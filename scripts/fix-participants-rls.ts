/**
 * 修复 brand_task_participants 表的 RLS 策略
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

    console.log('1. 禁用 brand_task_participants 表的 RLS...');
    await client.query('ALTER TABLE public.brand_task_participants DISABLE ROW LEVEL SECURITY;');
    console.log('   ✓ RLS 已禁用');

    console.log('\n2. 删除现有策略...');
    await client.query(`
      DROP POLICY IF EXISTS "查看任务参与者" ON public.brand_task_participants;
      DROP POLICY IF EXISTS "创作者申请参与" ON public.brand_task_participants;
      DROP POLICY IF EXISTS "创作者更新自己的参与" ON public.brand_task_participants;
    `);
    console.log('   ✓ 已删除现有策略');

    console.log('\n3. 重新启用 RLS...');
    await client.query('ALTER TABLE public.brand_task_participants ENABLE ROW LEVEL SECURITY;');
    console.log('   ✓ RLS 已启用');

    console.log('\n4. 创建新策略...');
    await client.query(`
      -- 查看策略
      CREATE POLICY "查看任务参与者" ON public.brand_task_participants
          FOR SELECT TO public
          USING (creator_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.brand_tasks WHERE id = task_id AND publisher_id = auth.uid()));

      -- 插入策略（关键修复）
      CREATE POLICY "创作者申请参与" ON public.brand_task_participants
          FOR INSERT TO public
          WITH CHECK (creator_id = auth.uid());

      -- 更新策略
      CREATE POLICY "创作者更新自己的参与" ON public.brand_task_participants
          FOR UPDATE TO public
          USING (creator_id = auth.uid());
    `);
    console.log('   ✓ 已创建新策略');

    console.log('\n5. 刷新缓存...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('   ✓ 缓存已刷新');

    console.log('\n✓ brand_task_participants RLS 策略修复完成！');

  } catch (error: any) {
    console.error('\n✗ 修复失败:', error.message);
  } finally {
    await client.end();
  }
}

fixRLS();
