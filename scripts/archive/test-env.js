// 测试环境变量
console.log('Environment Variables Test:');
console.log('VITE_USE_LOCAL_PROXY:', process.env.VITE_USE_LOCAL_PROXY);
console.log('VITE_LOCAL_API_URL:', process.env.VITE_LOCAL_API_URL);
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
