/**
 * 检查 merchant_stores 表数据
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkStoreData() {
  console.log('🔍 检查 merchant_stores 表数据...\n');

  try {
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
        console.log(`  店铺名称: ${store.store_name}`);
        console.log(`  店铺Logo: ${store.store_logo || '(空)'}`);
        console.log(`  店铺描述: ${store.store_description || '(空)'}`);
        console.log(`  用户ID: ${store.user_id}`);
        console.log('---');
      });
    } else {
      console.log('❌ 查询失败:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkStoreData();
