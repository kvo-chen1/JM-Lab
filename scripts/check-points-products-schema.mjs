/**
 * 检查 points_products 表结构
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkSchema() {
  console.log('🔍 检查 points_products 表结构...\n');

  try {
    // 获取表的一条记录来查看结构
    const response = await fetch(`${API_URL}/points_products?limit=1`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('表结构（字段列表）:');
      if (data.length > 0) {
        Object.keys(data[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof data[0][key]}`);
        });
      } else {
        console.log('表为空，无法查看结构');
        
        // 尝试插入一条测试数据来查看错误信息
        console.log('\n尝试插入测试数据...');
        const testResponse = await fetch(`${API_URL}/points_products`, {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: '测试商品',
            description: '测试描述',
            points_price: 100,
            stock: 10,
            category: 'virtual',
            status: 'active'
          })
        });
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.log('错误信息:', errorText);
        } else {
          console.log('测试数据插入成功');
          // 删除测试数据
          await fetch(`${API_URL}/points_products?name=eq.测试商品`, {
            method: 'DELETE',
            headers: {
              'apikey': API_KEY,
              'Authorization': `Bearer ${API_KEY}`
            }
          });
        }
      }
    } else {
      console.log('❌ 无法获取表结构:', await response.text());
    }
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkSchema();
