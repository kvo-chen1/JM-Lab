/**
 * 检查 product_details 视图查询
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkView() {
  console.log('🔍 检查 product_details 视图...\n');

  // 测试查询
  try {
    const response = await fetch(`${API_URL}/product_details?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 查询成功');
      console.log(`找到 ${data.length} 条记录`);
      if (data.length > 0) {
        console.log('第一条记录:', data[0]);
      }
    } else {
      console.log('❌ 查询失败:', await response.text());
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

checkView();
