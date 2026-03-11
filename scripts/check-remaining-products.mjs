/**
 * 检查 products 表中剩余的虚拟商品
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkRemaining() {
  console.log('🔍 检查 products 表中剩余的商品...\n');

  try {
    const response = await fetch(`${API_URL}/products?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`总计: ${data.length} 条记录\n`);
      
      data.forEach(p => {
        console.log('商品信息:');
        console.log(`  ID: ${p.id}`);
        console.log(`  名称: ${p.name}`);
        console.log(`  分类: ${p.category}`);
        console.log(`  商家ID: ${p.merchant_id}`);
        console.log(`  状态: ${p.status}`);
        console.log(`  积分: ${p.points}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

checkRemaining();
