/**
 * 检查 product_details 视图
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkView() {
  console.log('🔍 检查 product_details 视图...\n');

  try {
    const response = await fetch(`${API_URL}/product_details?limit=1`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ product_details 视图存在');
      if (data.length > 0) {
        console.log('字段:', Object.keys(data[0]).join(', '));
        console.log('\n样品数据:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('视图为空');
      }
    } else {
      console.log('❌ 无法获取视图:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkView();
