// 调试积分系统
// 在浏览器控制台运行此代码来检查当前登录用户的积分

async function debugPoints() {
  console.log('🔍 调试积分系统...\n');
  
  // 1. 获取当前用户
  const { data: { user } } = await window.supabase.auth.getUser();
  console.log('当前登录用户:', user);
  console.log('用户ID:', user?.id);
  
  if (!user) {
    console.log('❌ 用户未登录');
    return;
  }
  
  // 2. 查询积分余额
  console.log('\n查询积分余额...');
  const { data: balance, error: balanceError } = await window.supabase
    .from('user_points_balance')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (balanceError) {
    console.log('❌ 查询余额失败:', balanceError);
  } else {
    console.log('✅ 余额:', balance);
  }
  
  // 3. 查询积分记录
  console.log('\n查询积分记录...');
  const { data: records, error: recordsError } = await window.supabase
    .from('points_records')
    .select('*')
    .eq('user_id', user.id)
    .limit(5);
  
  if (recordsError) {
    console.log('❌ 查询记录失败:', recordsError);
  } else {
    console.log('✅ 记录:', records);
  }
  
  // 4. 查询所有用户的积分（测试 RLS）
  console.log('\n查询所有积分（测试 RLS）...');
  const { data: allBalances, error: allError } = await window.supabase
    .from('user_points_balance')
    .select('*');
  
  if (allError) {
    console.log('❌ 查询所有余额失败:', allError);
  } else {
    console.log('✅ 所有余额:', allBalances);
  }
}

debugPoints();
