// 检查并修复 inspiration_mindmaps 表中的 stats 字段
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndFix() {
  console.log('🔄 正在检查 inspiration_mindmaps 表...\n');

  try {
    // 获取所有脉络
    const { data: mindmaps, error } = await supabaseAdmin
      .from('inspiration_mindmaps')
      .select('id, stats');

    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }

    console.log(`找到 ${mindmaps?.length || 0} 条脉络记录\n`);

    for (const mindmap of mindmaps || []) {
      console.log(`检查脉络 ${mindmap.id}:`);
      console.log(`  当前 stats:`, JSON.stringify(mindmap.stats, null, 2));

      // 检查 stats.lastActivityAt 是否为数字
      if (mindmap.stats?.lastActivityAt && typeof mindmap.stats.lastActivityAt === 'number') {
        console.log(`  ⚠️ 发现数字格式的时间戳，需要修复`);

        // 更新为 ISO 格式字符串
        const { error: updateError } = await supabaseAdmin
          .from('inspiration_mindmaps')
          .update({
            stats: {
              ...mindmap.stats,
              lastActivityAt: new Date().toISOString()
            }
          })
          .eq('id', mindmap.id);

        if (updateError) {
          console.error(`  ❌ 修复失败:`, updateError.message);
        } else {
          console.log(`  ✅ 已修复`);
        }
      } else {
        console.log(`  ✅ 无需修复`);
      }
    }

    console.log('\n✅ 检查完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

checkAndFix();
