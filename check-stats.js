import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kizgwtrrsmkjeiddotup.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpemd3dHJyc21ramVpZGRvdHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxOTI2NSwiZXhwIjoyMDg4Mzk1MjY1fQ.Joc5d8ORWUfijvns7szuBONRkoIJubd6_B30fIM8HB0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkStats() {
  console.log('📊 检查平台统计数据\n');
  console.log('═══════════════════════════════════════\n');

  // 1. 检查 posts 表
  console.log('📋 1. 作品统计 (posts 表)');
  try {
    const { count: totalPosts, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    
    if (postsError) throw postsError;
    
    const { count: publishedPosts, error: publishedError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    if (publishedError) throw publishedError;
    
    console.log(`   总作品数: ${totalPosts || 0}`);
    console.log(`   已发布作品: ${publishedPosts || 0}`);
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }

  // 2. 检查 users 表
  console.log('\n👥 2. 用户统计 (users 表)');
  try {
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) throw usersError;
    
    console.log(`   总用户数: ${totalUsers || 0}`);
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }

  // 3. 检查 user_activities 表
  console.log('\n📈 3. 用户活动统计 (user_activities 表)');
  try {
    const { count: totalActivities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true });
    
    if (activitiesError) throw activitiesError;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayActivities, error: todayError } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    if (todayError) throw todayError;
    
    console.log(`   总活动数: ${totalActivities || 0}`);
    console.log(`   今日活动: ${todayActivities || 0}`);
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }

  // 4. 检查业务数据表
  console.log('\n💼 4. 业务数据统计');
  
  // 推广订单
  try {
    const { count: promotionOrders, error: poError } = await supabase
      .from('promotion_orders')
      .select('*', { count: 'exact', head: true });
    console.log(`   推广订单: ${promotionOrders || 0}`);
  } catch (error) {
    console.log(`   推广订单: 表不存在或错误`);
  }
  
  // 品牌任务
  try {
    const { count: brandTasks, error: btError } = await supabase
      .from('brand_tasks')
      .select('*', { count: 'exact', head: true });
    console.log(`   品牌任务: ${brandTasks || 0}`);
  } catch (error) {
    console.log(`   品牌任务: 表不存在或错误`);
  }
  
  // 待审任务
  try {
    const { count: pendingTasks, error: ptError } = await supabase
      .from('brand_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    console.log(`   待审任务: ${pendingTasks || 0}`);
  } catch (error) {
    console.log(`   待审任务: 表不存在或错误`);
  }

  // 5. 检查活动审核统计
  console.log('\n📝 5. 活动审核统计');
  try {
    const { count: pendingEvents, error: peError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    const { count: approvedEvents, error: aeError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    const { count: rejectedEvents, error: reError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');
    
    console.log(`   待审核: ${pendingEvents || 0}`);
    console.log(`   已通过: ${approvedEvents || 0}`);
    console.log(`   已拒绝: ${rejectedEvents || 0}`);
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 统计检查完成');
}

checkStats();
