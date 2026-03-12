/**
 * 检查 products 表结构
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkStructure() {
  console.log('🔍 检查 products 表结构...\n');

  try {
    // 获取一条记录来查看结构
    const response = await fetch(`${API_URL}/products?limit=1`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        console.log('products 表字段:');
        Object.keys(data[0]).forEach(key => {
          console.log(`  - ${key}`);
        });
      } else {
        console.log('products 表为空，尝试插入测试数据查看结构...');
        
        // 尝试插入一条测试数据
        const testResponse = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: '测试商品',
            price: 100
          })
        });
        
        if (!testResponse.ok) {
          const error = await testResponse.text();
          console.log('错误信息:', error);
        }
      }
    } else {
      console.log('❌ 查询失败:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkStructure();
