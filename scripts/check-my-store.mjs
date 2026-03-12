/**
 * 检查当前用户是否有店铺
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkMyStore() {
  console.log('🔍 检查店铺记录...\n');

  try {
    // 获取所有店铺记录
    const response = await fetch(`${API_URL}/merchant_stores?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`找到 ${data.length} 条店铺记录:\n`);
      
      data.forEach((store, index) => {
        console.log(`店铺 ${index + 1}:`);
        console.log(`  ID: ${store.id}`);
        console.log(`  用户ID: ${store.user_id}`);
        console.log(`  店铺名称: ${store.store_name}`);
        console.log(`  状态: ${store.status}`);
        console.log(`  创建时间: ${store.created_at}`);
        console.log('---');
      });

      if (data.length === 0) {
        console.log('没有找到任何店铺记录');
      }
    } else {
      console.log('❌ 查询失败:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkMyStore();
