// 测试通过代理获取余额
import fetch from 'node-fetch';

async function testProxyBalance() {
  console.log('========================================');
  console.log('测试通过代理获取余额');
  console.log('========================================\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'; // kvo1

  try {
    // 构建 Supabase 风格的请求 (通过代理)
    const url = `http://localhost:3030/api/db/rest/v1/user_jinbi_balance?user_id=eq.${userId}`;

    console.log('请求 URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': 'local-proxy-key',
      },
    });

    if (!response.ok) {
      console.log('❌ 请求失败:', response.status, response.statusText);
      const text = await response.text();
      console.log('响应:', text);
      return;
    }

    const data = await response.json();
    console.log('✅ 代理返回数据:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }

  console.log('\n========================================');
}

testProxyBalance();
