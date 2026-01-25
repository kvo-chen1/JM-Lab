// 测试修复后的API响应
import handler from './server/local-api.mjs';

// 模拟Vercel Serverless Function环境的请求对象
function createVercelRequest(method, path, body = {}) {
  return {
    method,
    url: path,
    headers: {
      'content-type': 'application/json',
      host: 'localhost:3021'
    },
    body // Vercel环境中，body已经是解析后的对象
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
  
  const req = createVercelRequest('POST', '/api/auth/send-email-code', {
    email: '15959355938@qq.com'
  });
  
  const res = createMockResponse();
  
  try {
    await handler(req, res);
    console.log('API响应状态码:', res.statusCode);
    console.log('API响应体:', res.body);
    
    // 尝试解析响应体
    try {
      const jsonBody = JSON.parse(res.body);
      console.log('响应体解析成功:', jsonBody);
      console.log('测试成功！API返回了有效的JSON响应。');
    } catch (parseError) {
      console.error('响应体解析失败:', parseError);
      console.log('测试失败！API返回的不是有效的JSON。');
    }
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行测试
testSendEmailCode();