/**
 * 验证数据修复结果
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function verifyData() {
  console.log('🔍 验证数据修复结果...\n');

  // 1. 检查 merchant_products 表
  console.log('📦 merchant_products 表（商家商品）:');
  try {
    const response = await fetch(`${API_URL}/merchant_products?limit=10`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  记录数: ${data.length}`);
      if (data.length > 0) {
        data.forEach(p => {
          console.log(`  - ${p.name} (¥${p.price})`);
        });
      } else {
        console.log('  (空表 - 等待商家上架商品)');
      }
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }

  // 2. 检查 merchant_product_details 视图
  console.log('\n📋 merchant_product_details 视图（文创商城）:');
  try {
    const response = await fetch(`${API_URL}/merchant_product_details?limit=10`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  记录数: ${data.length}`);
      if (data.length > 0) {
        data.forEach(p => {
          console.log(`  - ${p.name} (¥${p.price})`);
        });
      } else {
        console.log('  (空视图 - 等待商家上架商品)');
      }
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }

  // 3. 检查 products 表（积分商品）
  console.log('\n🎁 products 表（积分商品）:');
  try {
    const response = await fetch(`${API_URL}/products?limit=5`, {
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

  // 4. 检查 product_details 视图
  console.log('\n📋 product_details 视图（积分商城）:');
  try {
    const response = await fetch(`${API_URL}/product_details?limit=5`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  记录数: ${data.length}`);
      data.forEach(p => {
        console.log(`  - ${p.name} (${p.price}积分)`);
      });
    }
  } catch (error) {
    console.error('  ❌ 查询失败:', error.message);
  }

  console.log('\n✅ 验证完成');
  console.log('\n总结:');
  console.log('- 文创商城应该显示 merchant_product_details 视图的数据');
  console.log('- 积分商城应该显示 product_details 视图的数据');
  console.log('- 目前商家商品表为空，需要商家上架商品后文创商城才会有数据');
}

verifyData();
