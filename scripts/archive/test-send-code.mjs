// 测试发送验证码 API
async function testSendCode() {
  // 使用正确的邮箱格式
  const email = '1530592463@gmail.com';

  console.log('========================================');
  console.log('测试发送验证码');
  console.log('========================================');
  console.log('邮箱:', email);
  console.log('');

  try {
    const response = await fetch('http://localhost:3005/api/auth/send-email-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(data, null, 2));

    if (data.code === 0) {
      console.log('');
      console.log('✅ 验证码发送成功！');
      console.log('请检查你的邮箱收件箱。');
    } else {
      console.log('');
      console.log('❌ 发送失败:', data.message);
    }
  } catch (error) {
    console.error('');
    console.error('❌ 请求失败:', error.message);
  }
}

testSendCode();
