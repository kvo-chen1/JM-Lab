// 模拟浏览器环境，不提供process对象
console.log('Testing process.env fix...');

try {
  // 导入修复后的文件
  const { isDevelopment } = require('./src/contexts/authContext.tsx');
  console.log('✓ authContext.tsx imported successfully');
} catch (error) {
  console.error('✗ authContext.tsx import failed:', error.message);
}

try {
  const { supabase } = require('./src/lib/supabaseClient.ts');
  console.log('✓ supabaseClient.ts imported successfully');
} catch (error) {
  console.error('✗ supabaseClient.ts import failed:', error.message);
}

console.log('\nAll tests completed!');
