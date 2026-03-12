/**
 * 检查商家店铺Logo
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkMerchantLogo() {
  console.log('🔍 检查商家店铺Logo...\n');

  try {
    const response = await fetch(`${API_URL}/merchants?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`找到 ${data.length} 条商家记录:\n`);
      
      data.forEach((merchant, index) => {
        console.log(`商家 ${index + 1}:`);
        console.log(`  店铺名称: ${merchant.store_name}`);
        console.log(`  店铺Logo: ${merchant.store_logo || '(空)'}`);
        console.log(`  用户ID: ${merchant.user_id}`);
        console.log('---');
      });
    } else {
      console.log('❌ 查询失败:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkMerchantLogo();
