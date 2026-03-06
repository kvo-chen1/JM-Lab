// 测试数据库代理功能
async function testDbProxy() {
  const baseUrl = 'http://localhost:3023/api/db';
  
  console.log('Testing database proxy...\n');
  
  // 测试 1: 查询 brand_partnerships 表
  try {
    console.log('Test 1: GET /brand_partnerships');
    const response = await fetch(`${baseUrl}/brand_partnerships?select=*&status=eq.approved`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    console.log('✅ Test 1 passed\n');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
  
  // 测试 2: 查询 hot_themes 表
  try {
    console.log('Test 2: GET /hot_themes');
    const response = await fetch(`${baseUrl}/hot_themes?select=*`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('✅ Test 2 passed\n');
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  // 测试 3: 查询 user_points_balance 表
  try {
    console.log('Test 3: GET /user_points_balance');
    const response = await fetch(`${baseUrl}/user_points_balance?select=*&limit=5`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    console.log('✅ Test 3 passed\n');
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
}

testDbProxy();
