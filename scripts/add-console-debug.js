// 在页面中添加调试代码
// 在浏览器控制台运行以下代码查看问题

console.log('=== 文创商城调试信息 ===');

// 检查 productService
console.log('productService:', typeof window.productService);

// 检查 supabase
console.log('supabase:', typeof window.supabase);

// 检查 localStorage
const user = localStorage.getItem('user');
console.log('localStorage user:', user ? JSON.parse(user) : null);

// 手动测试 API 调用
fetch('http://localhost:3030/api/db/rest/v1/product_details?select=*', {
  headers: {
    'apikey': 'local-proxy-key',
    'Authorization': 'Bearer local-proxy-key'
  }
})
.then(r => r.json())
.then(data => console.log('API 返回数据:', data))
.catch(e => console.error('API 错误:', e));
