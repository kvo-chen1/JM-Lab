/**
 * 检查 points_products 表结构 - 使用系统表
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkSchema() {
  console.log('🔍 检查 points_products 表结构...\n');

  // 尝试不同的字段组合
  const testFields = [
    { name: '测试1', price: 100, stock: 10 },
    { name: '测试2', points_price: 100, stock: 10 },
    { name: '测试3', points: 100, stock: 10 },
  ];

  for (const testData of testFields) {
    try {
      console.log(`尝试字段: ${JSON.stringify(Object.keys(testData))}`);
      const response = await fetch(`${API_URL}/points_products`, {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      if (response.ok) {
        console.log('✅ 成功！正确的字段:', Object.keys(testData));
        // 删除测试数据
        await fetch(`${API_URL}/points_products?name=eq.${testData.name}`, {
          method: 'DELETE',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        break;
      } else {
        const error = await response.text();
        console.log('❌ 失败:', error.substring(0, 100));
      }
    } catch (error) {
      console.error('❌ 请求失败:', error.message);
    }
  }
}

checkSchema();
