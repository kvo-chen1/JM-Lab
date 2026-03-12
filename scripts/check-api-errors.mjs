/**
 * 检查 API 错误
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkErrors() {
  console.log('🔍 检查 API 错误...\n');

  // 测试 products 表查询
  console.log('1. 测试 products 表查询:');
  try {
    const response = await fetch(`${API_URL}/products?select=*&limit=1`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ 成功:', data);
    } else {
      console.log('  ❌ 失败:', await response.text());
    }
  } catch (error) {
    console.error('  ❌ 错误:', error.message);
  }

  // 测试插入数据
  console.log('\n2. 测试插入商品:');
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: '测试商品',
        price: 100,
        stock: 10,
        category: '测试',
        status: 'active'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ 插入成功:', data);
    } else {
      console.log('  ❌ 插入失败:', await response.text());
    }
  } catch (error) {
    console.error('  ❌ 错误:', error.message);
  }
}

checkErrors();
