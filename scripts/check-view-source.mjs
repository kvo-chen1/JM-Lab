/**
 * 检查 product_details 视图的数据来源
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkViewSource() {
  console.log('🔍 检查视图数据来源...\n');

  // 1. 检查 products 表
  console.log('1. products 表:');
  try {
    const response = await fetch(`${API_URL}/products?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   记录数: ${data.length}`);
      data.forEach(p => console.log(`   - ${p.name}`));
    }
  } catch (error) {
    console.error('   ❌ 错误:', error.message);
  }

  // 2. 检查 merchant_products 表
  console.log('\n2. merchant_products 表:');
  try {
    const response = await fetch(`${API_URL}/merchant_products?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   记录数: ${data.length}`);
      data.forEach(p => console.log(`   - ${p.name}`));
    }
  } catch (error) {
    console.error('   ❌ 错误:', error.message);
  }

  // 3. 检查 product_details 视图
  console.log('\n3. product_details 视图:');
  try {
    const response = await fetch(`${API_URL}/product_details?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   记录数: ${data.length}`);
      data.forEach(p => console.log(`   - ${p.name}`));
    }
  } catch (error) {
    console.error('   ❌ 错误:', error.message);
  }
}

checkViewSource();
