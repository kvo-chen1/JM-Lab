// 在浏览器控制台运行此代码检查认证状态
async function debugAuth() {
  console.log('🔍 检查认证状态...\n');
  
  // 1. 检查 localStorage
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  
  console.log('localStorage:');
  console.log('  user:', storedUser ? JSON.parse(storedUser) : null);
  console.log('  token:', storedToken ? '存在' : '不存在');
  console.log('  isAuthenticated:', isAuthenticated);
  
  // 2. 检查 Supabase session
  console.log('\nSupabase session:');
  const { data: { session }, error } = await window.supabase.auth.getSession();
  console.log('  session:', session);
  console.log('  error:', error);
  
  if (session?.user) {
    console.log('  Supabase user ID:', session.user.id);
  }
  
  // 3. 比较两个用户ID
  if (storedUser) {
    const user = JSON.parse(storedUser);
    console.log('\n用户ID比较:');
    console.log('  localStorage user ID:', user.id);
    console.log('  Supabase user ID:', session?.user?.id);
    console.log('  是否匹配:', user.id === session?.user?.id);
  }
}

debugAuth();
