#!/usr/bin/env node
/**
 * 调试数据库表结构
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTables() {
  console.log('🔍 调试数据库表结构...\n');

  try {
    // 1. 检查 posts 表
    console.log('1️⃣ 检查 posts 表...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(3);

    if (postsError) {
      console.log('   ❌ posts 表错误:', postsError.message);
    } else {
      console.log(`   ✅ posts 表存在，找到 ${posts?.length || 0} 条记录`);
      if (posts && posts.length > 0) {
        console.log('   字段:', Object.keys(posts[0]).join(', '));
      }
    }

    // 2. 检查 threads 表
    console.log('\n2️⃣ 检查 threads 表...');
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('*')
      .limit(3);

    if (threadsError) {
      console.log('   ❌ threads 表错误:', threadsError.message);
    } else {
      console.log(`   ✅ threads 表存在，找到 ${threads?.length || 0} 条记录`);
      if (threads && threads.length > 0) {
        console.log('   字段:', Object.keys(threads[0]).join(', '));
      }
    }

    // 3. 检查 comments 表
    console.log('\n3️⃣ 检查 comments 表...');
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(3);

    if (commentsError) {
      console.log('   ❌ comments 表错误:', commentsError.message);
    } else {
      console.log(`   ✅ comments 表存在，找到 ${comments?.length || 0} 条记录`);
    }

    // 4. 检查 thread_comments 表
    console.log('\n4️⃣ 检查 thread_comments 表...');
    const { data: threadComments, error: threadCommentsError } = await supabase
      .from('thread_comments')
      .select('*')
      .limit(3);

    if (threadCommentsError) {
      console.log('   ❌ thread_comments 表错误:', threadCommentsError.message);
    } else {
      console.log(`   ✅ thread_comments 表存在，找到 ${threadComments?.length || 0} 条记录`);
    }

    // 5. 检查 communities 表
    console.log('\n5️⃣ 检查 communities 表...');
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .limit(3);

    if (communitiesError) {
      console.log('   ❌ communities 表错误:', communitiesError.message);
    } else {
      console.log(`   ✅ communities 表存在，找到 ${communities?.length || 0} 条记录`);
      if (communities && communities.length > 0) {
        console.log('   第一个社区:', communities[0].name, '(ID:', communities[0].id + ')');
      }
    }

    console.log('\n✅ 调试完成！');

  } catch (error) {
    console.error('\n❌ 调试失败:', error.message);
  }
}

debugTables();
