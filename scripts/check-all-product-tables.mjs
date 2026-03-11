/**
 * 检查所有商品相关的表
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

const tables = [
  'products',
  'points_products',
  'merchant_products',
  'shop_products',
  'goods',
  'items'
];

async function checkTables() {
  console.log('🔍 检查所有商品相关表...\n');

  for (const table of tables) {
    try {
      const response = await fetch(`${API_URL}/${table}?limit=1`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${table} 表存在，有 ${data.length} 条记录`);
        if (data.length > 0) {
          console.log('  字段:', Object.keys(data[0]).join(', '));
        }
      } else if (response.status === 404) {
        console.log(`❌ ${table} 表不存在`);
      } else {
        console.log(`⚠️ ${table} 表: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${table} 表检查失败: ${error.message}`);
    }
    console.log('');
  }
}

checkTables();
