/**
 * 检查 products 表数据
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkProducts() {
  console.log('🔍 检查 products 表数据...\n');

  try {
    const response = await fetch(`${API_URL}/products?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`找到 ${data.length} 条商品记录:\n`);
      
      if (data.length === 0) {
        console.log('(空表 - 没有商品数据)');
      } else {
        data.forEach((product, index) => {
          console.log(`商品 ${index + 1}:`);
          console.log(`  名称: ${product.name}`);
          console.log(`  价格: ¥${product.price}`);
          console.log(`  库存: ${product.stock}`);
          console.log(`  状态: ${product.status}`);
          console.log(`  商家ID: ${product.merchant_id || '(空)'}`);
          console.log('---');
        });
      }
    } else {
      console.log('❌ 查询失败:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkProducts();
