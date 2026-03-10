#!/usr/bin/env node
/**
 * 调试 works 表查询
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWorksQuery() {
  console.log('🔍 调试 works 表查询...\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

  // 计算30天前的时间戳（秒）
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const thirtyDaysAgoSeconds = Math.floor(thirtyDaysAgo.getTime() / 1000);
  const nowSeconds = Math.floor(now.getTime() / 1000);

  console.log('当前时间:', now.toISOString());
  console.log('30天前:', thirtyDaysAgo.toISOString());
  console.log('30天前时间戳(秒):', thirtyDaysAgoSeconds);
  console.log('当前时间戳(秒):', nowSeconds);
  console.log('');

  try {
    // 使用秒级时间戳查询
    console.log('1️⃣ 使用秒级时间戳查询...');
    const { data: works1, error: error1 } = await supabase
      .from('works')
      .select('id, title, created_at')
      .eq('creator_id', userId)
      .gte('created_at', thirtyDaysAgoSeconds)
      .lte('created_at', nowSeconds);

    if (error1) {
      console.log('   ❌ 查询错误:', error1.message);
    } else {
      console.log(`   ✅ 找到 ${works1?.length || 0} 个作品`);
    }

    // 不使用时间过滤查询
    console.log('\n2️⃣ 不使用时间过滤查询...');
    const { data: works2, error: error2 } = await supabase
      .from('works')
      .select('id, title, created_at')
      .eq('creator_id', userId);

    if (error2) {
      console.log('   ❌ 查询错误:', error2.message);
    } else {
      console.log(`   ✅ 找到 ${works2?.length || 0} 个作品`);
      if (works2 && works2.length > 0) {
        works2.forEach((w, i) => {
          const createdAtSec = w.created_at > 10000000000 ? Math.floor(w.created_at / 1000) : w.created_at;
          const isInRange = createdAtSec >= thirtyDaysAgoSeconds && createdAtSec <= nowSeconds;
          console.log(`   ${i + 1}. ${w.title || '无标题'} - created_at: ${w.created_at} - 在范围内: ${isInRange ? '✅' : '❌'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugWorksQuery();
