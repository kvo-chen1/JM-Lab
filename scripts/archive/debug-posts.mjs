#!/usr/bin/env node
/**
 * 调试 posts 表数据
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPosts() {
  console.log('🔍 调试 posts 表数据...\n');

  try {
    // 获取社区ID
    const { data: communities } = await supabase
      .from('communities')
      .select('id, name')
      .limit(1);

    if (!communities || communities.length === 0) {
      console.log('❌ 没有找到社区');
      return;
    }

    const communityId = communities[0].id;
    console.log('社区:', communities[0].name, '(ID:', communityId + ')');

    // 1. 获取该社区的所有帖子
    console.log('\n1️⃣ 获取该社区的帖子...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('community_id', communityId);

    if (postsError) {
      console.log('   ❌ 查询错误:', postsError.message);
    } else {
      console.log(`   ✅ 找到 ${posts?.length || 0} 条帖子`);
      if (posts && posts.length > 0) {
        posts.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.title} (ID: ${p.id})`);
          console.log(`      - 点赞: ${p.upvotes || 0}, 评论: ${p.comments_count || 0}`);
          console.log(`      - 创建时间: ${p.created_at}`);
        });
      }
    }

    // 2. 获取本周帖子
    console.log('\n2️⃣ 获取本周帖子...');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weeklyPosts, error: weeklyError } = await supabase
      .from('posts')
      .select('*')
      .eq('community_id', communityId)
      .gte('created_at', weekAgo.toISOString());

    if (weeklyError) {
      console.log('   ❌ 查询错误:', weeklyError.message);
    } else {
      console.log(`   ✅ 本周有 ${weeklyPosts?.length || 0} 条帖子`);
    }

    // 3. 获取评论
    console.log('\n3️⃣ 获取该社区的评论...');
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('community_id', communityId);

    if (commentsError) {
      console.log('   ❌ 查询错误:', commentsError.message);
      console.log('   尝试通过 post_id 查询...');
      
      // 尝试通过 post_id 查询
      const postIds = posts?.map(p => p.id) || [];
      if (postIds.length > 0) {
        const { data: postComments, error: postCommentsError } = await supabase
          .from('comments')
          .select('*')
          .in('post_id', postIds);
        
        if (postCommentsError) {
          console.log('   ❌ 查询错误:', postCommentsError.message);
        } else {
          console.log(`   ✅ 找到 ${postComments?.length || 0} 条评论`);
        }
      }
    } else {
      console.log(`   ✅ 找到 ${comments?.length || 0} 条评论`);
    }

    console.log('\n✅ 调试完成！');

  } catch (error) {
    console.error('\n❌ 调试失败:', error.message);
  }
}

debugPosts();
