/**
 * 检查文创商城商品数据来源
 */

const API_URL = 'http://localhost:3030/api/db/rest/v1';
const API_KEY = 'local-proxy-key';

async function checkSources() {
  console.log('🔍 检查文创商城可能的商品数据来源...\n');

  // 1. 检查所有可能的表和视图
  const sources = [
    { name: 'products', desc: '积分商品表' },
    { name: 'points_products', desc: '积分商品表2' },
    { name: 'merchant_products', desc: '商家商品表' },
    { name: 'product_details', desc: '商品详情视图' },
    { name: 'merchant_product_details', desc: '商家商品详情视图' },
  ];

  for (const source of sources) {
    try {
      const response = await fetch(`${API_URL}/${source.name}?limit=3`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`\n📦 ${source.name} (${source.desc}):`);
        console.log(`  记录数: ${data.length}`);
        if (data.length > 0) {
          data.forEach(p => {
            const price = p.price || p.points || 'N/A';
            console.log(`  - ${p.name} (${price})`);
          });
        }
      }
    } catch (error) {
      console.log(`\n❌ ${source.name}: ${error.message}`);
    }
  }

  console.log('\n\n💡 分析:');
  console.log('- 如果 products 表有数据，可能是页面还在用它');
  console.log('- 如果 merchant_products 表为空，需要商家上架商品');
}

checkSources();
