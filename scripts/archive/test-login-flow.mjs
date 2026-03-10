// 测试完整的登录流程
import http from 'http';

const PORT = 3023;
const EMAIL = '1530592463@kvo@gmail.com';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testLoginFlow() {
  console.log('========================================');
  console.log('测试登录流程');
  console.log('========================================');
  console.log('邮箱:', EMAIL);
  console.log('');

  // 步骤1: 发送验证码
  console.log('步骤1: 发送验证码...');
  try {
    const sendResult = await makeRequest('/api/auth/send-email-code', 'POST', { email: EMAIL });
    console.log('  状态码:', sendResult.status);
    console.log('  响应:', JSON.stringify(sendResult.body, null, 2));

    if (sendResult.body.code === 0) {
      console.log('  ✅ 验证码发送成功');
      console.log('');
      console.log('⚠️  注意: 由于邮件配置问题，验证码会显示在服务器控制台中');
      console.log('   请在运行 npm run dev:server 的终端窗口中查找验证码');
      console.log('   搜索关键词: [EmailService] 或 MOCK_CODE');
    } else {
      console.log('  ❌ 发送失败:', sendResult.body.message);
    }
  } catch (error) {
    console.error('  ❌ 请求失败:', error.message);
    console.log('');
    console.log('⚠️  请确保后端服务器正在运行:');
    console.log('   npm run dev:server');
  }

  console.log('');
  console.log('========================================');
  console.log('提示: 开发环境可以使用默认验证码 123456');
  console.log('========================================');
}

testLoginFlow();
