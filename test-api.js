// 测试API请求，模拟Vercel环境下的行为
import handler from './server/local-api.mjs';

// 模拟请求对象
function createMockRequest(method, path, body = {}) {
  return {
    method,
    url: path,
    headers: {
      'content-type': 'application/json',
      host: 'localhost:3021'
    },
    body: JSON.stringify(body)
  };
}

// 模拟响应对象
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(data) {
      this.body = data;
      return Promise.resolve();
    }
  };
  return res;
}

// 测试发送邮箱验证码API
async function testSendEmailCode() {
  console.log('测试发送邮箱验证码API...');
  
  const req = createMockRequest('POST', '/api/auth/send-email-code', {
    email: '15959355938@qq.com'
  });
  
  const res = createMockResponse();
  
  try {
    await handler(req, res);
    console.log('API响应状态码:', res.statusCode);
    console.log('API响应体:', res.body);
    
    if (res.statusCode === 200) {
      console.log('测试成功！发送邮箱验证码API正常工作。');
    } else {
      console.log('测试失败！API返回了错误状态码。');
    }
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 测试注册邮箱验证码API
async function testSendRegisterEmailCode() {
  console.log('\n测试发送注册邮箱验证码API...');
  
  const req = createMockRequest('POST', '/api/auth/send-register-email-code', {
    email: 'test@example.com'
  });
  
  const res = createMockResponse();
  
  try {
    await handler(req, res);
    console.log('API响应状态码:', res.statusCode);
    console.log('API响应体:', res.body);
    
    if (res.statusCode === 200) {
      console.log('测试成功！发送注册邮箱验证码API正常工作。');
    } else {
      console.log('测试失败！API返回了错误状态码。');
    }
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行测试
testSendEmailCode().then(testSendRegisterEmailCode);