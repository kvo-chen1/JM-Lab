/**
 * 检查商家记录
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkRecords() {
  console.log('🔍 检查商家记录...\n');

  // 1. 检查 merchant_stores 表
  console.log('📦 merchant_stores 表:');
  try {
    const response = await fetch(`${API_URL}/merchant_stores?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  记录数: ${data.length}`);
      data.forEach(s => {
        console.log(`  - ${s.store_name} (用户ID: ${s.user_id})`);
      });
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }

  // 2. 检查 merchants 表
  console.log('\n🏪 merchants 表:');
  try {
    const response = await fetch(`${API_URL}/merchants?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  记录数: ${data.length}`);
      data.forEach(m => {
        console.log(`  - ${m.store_name} (用户ID: ${m.user_id})`);
      });
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }
}

checkRecords();
