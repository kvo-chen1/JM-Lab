/**
 * 调试分类查询
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function debugCategory() {
  console.log('🔍 调试分类查询...\n');

  // 1. 检查商品的 category_id
  console.log('1. 检查 product_details 视图中的商品:');
  try {
    const response = await fetch(`${API_URL}/product_details?select=name,category_id`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('  商品:', data);
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }

  // 2. 测试带 category_id 过滤的查询
  console.log('\n2. 测试带 category_id 过滤的查询:');
  try {
    const response = await fetch(`${API_URL}/product_details?select=*&category_id=eq.文创产品`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  找到 ${data.length} 条记录`);
    } else {
      console.log('  ❌ 查询失败:', await response.text());
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }

  // 3. 测试不带过滤的查询
  console.log('\n3. 测试不带过滤的查询:');
  try {
    const response = await fetch(`${API_URL}/product_details?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  找到 ${data.length} 条记录`);
      if (data.length > 0) {
        console.log('  第一条:', data[0]);
      }
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }
}

debugCategory();
