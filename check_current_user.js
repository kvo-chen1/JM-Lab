// 在浏览器控制台运行此代码检查当前登录用户
async function checkCurrentUser() {
  console.log('🔍 检查当前登录用户...\n');
  
  // 获取当前用户
  const { data: { user }, error } = await window.supabase.auth.getUser();
  
  if (error) {
    console.log('❌ 获取用户失败:', error);
    return;
  }
  
  if (!user) {
    console.log('❌ 用户未登录');
    return;
  }
  
  console.log('当前登录用户:');
  console.log('  ID:', user.id);
  console.log('  邮箱:', user.email);
  console.log('  元数据:', user.user_metadata);
  
  // 查询积分
  console.log('\n查询积分...');
  const { data: balance, error: balanceError } = await window.supabase
    .from('user_points_balance')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (balanceError) {
    console.log('❌ 查询积分失败:', balanceError);
  } else {
    console.log('✅ 积分余额:', balance);
  }
}

checkCurrentUser();
