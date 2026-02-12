#!/usr/bin/env node
/**
 * 调试 works 表
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWorks() {
  console.log('🔍 调试 works 表...\n');

  try {
    // 检查 works 表
    console.log('1️⃣ 检查 works 表...');
    const { data: works, error: worksError } = await supabase
      .from('works')
      .select('*')
      .limit(5);

    if (worksError) {
      console.log('   ❌ works 表错误:', worksError.message);
    } else {
      console.log(`   ✅ works 表存在，找到 ${works?.length || 0} 条记录`);
    }

    // 检查 posts 表
    console.log('\n2️⃣ 检查 posts 表...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(5);

    if (postsError) {
      console.log('   ❌ posts 表错误:', postsError.message);
    } else {
      console.log(`   ✅ posts 表存在，找到 ${posts?.length || 0} 条记录`);
    }

    // 检查 creator_works 表
    console.log('\n3️⃣ 检查 creator_works 表...');
    const { data: creatorWorks, error: creatorWorksError } = await supabase
      .from('creator_works')
      .select('*')
      .limit(5);

    if (creatorWorksError) {
      console.log('   ❌ creator_works 表错误:', creatorWorksError.message);
    } else {
      console.log(`   ✅ creator_works 表存在，找到 ${creatorWorks?.length || 0} 条记录`);
    }

    console.log('\n✅ 调试完成！');

  } catch (error) {
    console.error('\n❌ 调试失败:', error.message);
  }
}

debugWorks();
