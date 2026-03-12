/**
 * 检查商城数据分布
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkData() {
  console.log('🔍 检查商城数据分布...\n');

  // 1. 检查 products 表（商家商品）
  console.log('📦 products 表（商家商品）:');
  try {
    const response = await fetch(`${API_URL}/products?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  记录数: ${data.length}`);
      data.forEach(p => {
        console.log(`  - ${p.name} (¥${p.price}, 商家: ${p.merchant_id?.substring(0, 8)}...)`);
      });
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }

  // 2. 检查 points_products 表（积分商品）
  console.log('\n🎁 points_products 表（积分商品）:');
  try {
    const response = await fetch(`${API_URL}/points_products?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  记录数: ${data.length}`);
      data.forEach(p => {
        console.log(`  - ${p.name} (${p.points}积分)`);
      });
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }

  // 3. 检查 product_details 视图
  console.log('\n📋 product_details 视图:');
  try {
    const response = await fetch(`${API_URL}/product_details?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  记录数: ${data.length}`);
      data.forEach(p => {
        console.log(`  - ${p.name} (¥${p.price})`);
      });
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }

  console.log('\n✅ 检查完成');
  console.log('\n正确的架构应该是:');
  console.log('- 文创商城 (/marketplace) -> 显示 products 表的商家商品');
  console.log('- 积分商城 (/points-mall) -> 显示 points_products 表的积分商品');
}

checkData();
