// 测试登录 API
async function testLogin() {
  const email = '1530592463@gmail.com';
  const code = '123456'; // 使用默认验证码测试

  console.log('========================================');
  console.log('测试登录');
  console.log('========================================');
  console.log('邮箱:', email);
  console.log('验证码:', code);
  console.log('');

  try {
    const response = await fetch('http://localhost:3005/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, code })
    });

    const data = await response.json();
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(data, null, 2));

    if (data.code === 0) {
      console.log('');
      console.log('✅ 登录成功！');
      console.log('用户ID:', data.data?.user?.id);
      console.log('用户名:', data.data?.user?.username);
    } else {
      console.log('');
      console.log('❌ 登录失败:', data.message);
    }
  } catch (error) {
    console.error('');
    console.error('❌ 请求失败:', error.message);
  }
}

testLogin();
