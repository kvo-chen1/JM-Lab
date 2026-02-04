import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing env: SUPABASE_URL (or VITE_/NEXT_PUBLIC_) and SUPABASE_SERVICE_ROLE_KEY (or ANON key)');
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteTestCommunities() {
  try {
    console.log('开始删除测试社群...');
    
    // 要删除的社群名称
    const communityNames = [
      '111',
      '1111',
      '测试社群'
    ];
    
    let deletedCount = 0;
    
    for (const name of communityNames) {
      try {
        console.log(`处理社群: ${name}`);
        
        // 查找社群
        const { data: communities, error: findError } = await supabase
          .from('communities')
          .select('id')
          .eq('name', name);
        
        if (findError) {
          console.error(`查找社群 ${name} 时出错:`, findError.message);
          continue;
        }
        
        if (communities && communities.length > 0) {
          const communityId = communities[0].id;
          console.log(`找到社群 ${name}，ID: ${communityId}`);
          
          // 删除社群成员
          const { error: membersError } = await supabase
            .from('community_members')
            .delete()
            .eq('community_id', communityId);
          
          if (membersError) {
            console.error(`删除社群成员时出错:`, membersError.message);
            // 继续执行，不因为成员删除失败而中断
          } else {
            console.log(`已删除社群 ${name} 的所有成员`);
          }
          
          // 删除社群帖子
          const { error: postsError } = await supabase
            .from('posts')
            .delete()
            .eq('community_id', communityId);
          
          if (postsError) {
            console.error(`删除社群帖子时出错:`, postsError.message);
            // 继续执行，不因为帖子删除失败而中断
          } else {
            console.log(`已删除社群 ${name} 的所有帖子`);
          }
          
          // 删除社群本身
          const { error: deleteError } = await supabase
            .from('communities')
            .delete()
            .eq('id', communityId);
          
          if (deleteError) {
            console.error(`删除社群 ${name} 时出错:`, deleteError.message);
          } else {
            console.log(`成功删除社群: ${name}`);
            deletedCount++;
          }
        } else {
          console.log(`未找到社群: ${name}`);
        }
      } catch (error) {
        console.error(`处理社群 ${name} 时发生错误:`, error.message);
      }
    }
    
    console.log(`删除完成，共删除 ${deletedCount} 个社群`);
    
    // 验证删除结果
    console.log('\n验证删除结果...');
    const { data: remainingCommunities, error: verifyError } = await supabase
      .from('communities')
      .select('name');
    
    if (verifyError) {
      console.error('验证删除结果时出错:', verifyError.message);
    } else {
      console.log('剩余社群:');
      remainingCommunities.forEach(community => {
        console.log(`- ${community.name}`);
      });
    }
    
  } catch (error) {
    console.error('删除测试社群时出错:', error);
  }
}

deleteTestCommunities();
