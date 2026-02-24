import { supabaseAdmin } from '../src/lib/supabaseClient';

async function addStatusToWorks() {
  console.log('开始为 works 表添加 status 字段...');

  try {
    // 1. 添加 status 列（如果不存在）
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.works
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
      `
    });

    if (alterError) {
      console.log('添加列时出错（可能已存在）:', alterError.message);
    } else {
      console.log('✓ status 列添加成功');
    }

    // 2. 更新现有数据
    const { error: updateError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        UPDATE public.works
        SET status = 'approved'
        WHERE status IS NULL;
      `
    });

    if (updateError) {
      console.log('更新数据时出错:', updateError.message);
    } else {
      console.log('✓ 现有数据已更新为 approved');
    }

    // 3. 创建索引
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_works_status ON public.works(status);
      `
    });

    if (indexError) {
      console.log('创建索引时出错:', indexError.message);
    } else {
      console.log('✓ 索引创建成功');
    }

    // 4. 验证更新结果
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('works')
      .select('status, count')
      .select('status');

    if (statsError) {
      console.log('获取统计信息失败:', statsError.message);
    } else {
      console.log('\n更新后的状态分布:');
      const { data: statusCounts } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: `
            SELECT status, COUNT(*) as count 
            FROM public.works 
            GROUP BY status;
          `
        });
      console.log(statusCounts);
    }

    console.log('\n✅ 完成！works 表 status 字段已添加并更新');
  } catch (error) {
    console.error('执行失败:', error);
  }
}

addStatusToWorks();
