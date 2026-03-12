/**
 * 测试商家商品 API
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function testAPI() {
  console.log('🔍 测试商家商品 API...\n');

  // 测试 getMerchantProducts 的等效查询
  console.log('1. 测试 product_details 视图查询:');
  try {
    const response = await fetch(`${API_URL}/product_details?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ 成功，找到 ${data.length} 条记录`);
      if (data.length > 0) {
        console.log('  第一条记录:', JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log('  ❌ 失败:', await response.text());
    }
  } catch (error) {
    console.error('  ❌ 错误:', error.message);
  }

  // 测试带排序的查询
  console.log('\n2. 测试带排序的查询:');
  try {
    const response = await fetch(`${API_URL}/product_details?select=*&order=created_at.desc`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ 成功，找到 ${data.length} 条记录`);
    } else {
      console.log('  ❌ 失败:', await response.text());
    }
  } catch (error) {
    console.error('  ❌ 错误:', error.message);
  }
}

testAPI();
