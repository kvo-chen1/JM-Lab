/**
 * 检查 product_details 视图
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkView() {
  console.log('🔍 检查 product_details 视图...\n');

  try {
    const response = await fetch(`${API_URL}/product_details?select=*&limit=5`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`找到 ${data.length} 条记录:\n`);
      
      if (data.length === 0) {
        console.log('(空视图)');
      } else {
        data.forEach((item, index) => {
          console.log(`记录 ${index + 1}:`);
          console.log(`  名称: ${item.name}`);
          console.log(`  价格: ${item.price}`);
          console.log(`  商家ID: ${item.seller_id || item.merchant_id || '(空)'}`);
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

checkView();
