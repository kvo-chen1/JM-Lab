/**
 * 检查 products 和 points_products 表的数据
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkData() {
  console.log('🔍 检查数据库表数据...\n');

  // 1. 检查 products 表
  console.log('📦 检查 products 表...');
  try {
    const response = await fetch(`${API_URL}/products?select=*&limit=10`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ products 表有 ${data.length} 条记录`);
      if (data.length > 0) {
        console.log('样品数据:');
        data.slice(0, 3).forEach(p => {
          console.log(`  - ${p.name} (价格: ¥${p.price}, 状态: ${p.status})`);
        });
      }
    } else {
      console.log('❌ 无法获取 products 表数据:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查 products 表失败:', error.message);
  }

  // 2. 检查 points_products 表
  console.log('\n🎁 检查 points_products 表...');
  try {
    const response = await fetch(`${API_URL}/points_products?select=*&limit=10`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ points_products 表有 ${data.length} 条记录`);
      if (data.length > 0) {
        console.log('样品数据:');
        data.slice(0, 3).forEach(p => {
          console.log(`  - ${p.name} (积分: ${p.points_price || p.price}, 分类: ${p.category})`);
        });
      }
    } else {
      console.log('❌ 无法获取 points_products 表数据:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查 points_products 表失败:', error.message);
  }

  // 3. 检查 product_details 视图
  console.log('\n📋 检查 product_details 视图...');
  try {
    const response = await fetch(`${API_URL}/product_details?select=*&limit=10`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ product_details 视图有 ${data.length} 条记录`);
      if (data.length > 0) {
        console.log('样品数据:');
        data.slice(0, 3).forEach(p => {
          console.log(`  - ${p.name} (价格: ¥${p.price}, 状态: ${p.status})`);
        });
      }
    } else {
      console.log('❌ 无法获取 product_details 视图数据:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查 product_details 视图失败:', error.message);
  }
}

checkData();
