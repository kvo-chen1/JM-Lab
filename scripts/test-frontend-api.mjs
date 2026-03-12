/**
 * 模拟前端 API 调用测试
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function testFrontendAPI() {
  console.log('🔍 模拟前端 API 调用...\n');

  // 测试 getMerchantProducts 的等效调用（不带参数）
  console.log('1. 测试 getMerchantProducts（默认参数）:');
  try {
    // 默认排序：created_at.desc
    const response = await fetch(`${API_URL}/product_details?select=*&order=created_at.desc`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ 成功，找到 ${data.length} 条记录`);
      if (data.length > 0) {
        console.log('  商品:', data.map(p => p.name).join(', '));
      }
    } else {
      console.log('  ❌ 失败:', await response.text());
    }
  } catch (error) {
    console.error('  ❌ 错误:', error.message);
  }

  // 测试带 count 的查询
  console.log('\n2. 测试带 count 的查询:');
  try {
    const response = await fetch(`${API_URL}/product_details?select=*&order=created_at.desc`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const count = response.headers.get('content-range');
      console.log(`  ✅ 成功，找到 ${data.length} 条记录`);
      console.log(`  Content-Range: ${count}`);
    } else {
      console.log('  ❌ 失败:', await response.text());
    }
  } catch (error) {
    console.error('  ❌ 错误:', error.message);
  }

  // 测试 status 过滤
  console.log('\n3. 测试 status=active 过滤:');
  try {
    const response = await fetch(`${API_URL}/product_details?select=*&status=eq.active&order=created_at.desc`, {
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

testFrontendAPI();
