/**
 * 检查 products 表结构
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkSchema() {
  console.log('🔍 检查 products 表结构...\n');

  try {
    const response = await fetch(`${API_URL}/products?limit=1`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('products 表结构（字段列表）:');
      if (data.length > 0) {
        Object.keys(data[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof data[0][key]}`);
        });
      } else {
        console.log('表为空');
      }
    } else {
      console.log('❌ 无法获取表结构:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkSchema();
