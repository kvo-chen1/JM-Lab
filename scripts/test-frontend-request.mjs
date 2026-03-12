// 模拟前端请求
import fetch from 'node-fetch';

async function testFrontendRequest() {
  console.log('========================================');
  console.log('模拟前端请求获取余额');
  console.log('========================================\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

  // 模拟前端的 token
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmM2RlZGY3OS01YzVlLTQwZmQtOTUxMy1kMGZiMDk5NWQ0MjkiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNjgwMDAwMDAwfQ.test';

  try {
    // 方式1: 不带 Authorization 头（模拟未登录）
    console.log('1. 测试不带 Authorization 头:');
    const response1 = await fetch(
      `http://localhost:3030/api/db/rest/v1/user_jinbi_balance?select=*&user_id=eq.${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': 'local-proxy-key',
        },
      }
    );
    console.log('   状态:', response1.status);
    const data1 = await response1.json();
    console.log('   数据:', JSON.stringify(data1, null, 2).substring(0, 200));

    // 方式2: 带 Authorization 头（模拟已登录）
    console.log('\n2. 测试带 Authorization 头:');
    const response2 = await fetch(
      `http://localhost:3030/api/db/rest/v1/user_jinbi_balance?select=*&user_id=eq.${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': 'local-proxy-key',
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    console.log('   状态:', response2.status);
    const data2 = await response2.json();
    console.log('   数据:', JSON.stringify(data2, null, 2).substring(0, 200));

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }

  console.log('\n========================================');
}

testFrontendRequest();
