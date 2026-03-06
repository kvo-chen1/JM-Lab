// 测试认证系统
import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试配置
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123456';
const TEST_NAME = 'Test User';

// 启动本地API服务器
function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['server/local-api.mjs'], {
      cwd: path.resolve(__dirname),
      stdio: 'inherit'
    });

    server.on('error', (err) => {
      console.error('服务器启动失败:', err);
      reject(err);
    });

    server.on('exit', (code) => {
      console.log('服务器已退出，退出码:', code);
    });

    // 等待服务器启动
    setTimeout(() => {
      resolve(server);
    }, 3000);
  });
}

// 发送HTTP请求
function sendRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// 测试注册
async function testRegister() {
  console.log('\n=== 测试注册功能 ===');
  
  const options = {
    hostname: 'localhost',
    port: 3022,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: TEST_NAME
  };

  try {
    const response = await sendRequest(options, body);
    console.log('注册响应状态码:', response.statusCode);
    console.log('注册响应数据:', response.data);
    
    if (response.statusCode === 201 && response.data.success) {
      console.log('✅ 注册测试通过');
      return response.data.token;
    } else {
      console.log('❌ 注册测试失败');
      return null;
    }
  } catch (error) {
    console.error('注册测试出错:', error);
    return null;
  }
}

// 测试登录
async function testLogin() {
  console.log('\n=== 测试登录功能 ===');
  
  const options = {
    hostname: 'localhost',
    port: 3022,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  };

  try {
    const response = await sendRequest(options, body);
    console.log('登录响应状态码:', response.statusCode);
    console.log('登录响应数据:', response.data);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ 登录测试通过');
      return response.data.token;
    } else {
      console.log('❌ 登录测试失败');
      return null;
    }
  } catch (error) {
    console.error('登录测试出错:', error);
    return null;
  }
}

// 测试验证令牌
async function testVerify(token) {
  console.log('\n=== 测试验证令牌功能 ===');
  
  const options = {
    hostname: 'localhost',
    port: 3022,
    path: '/api/auth/verify',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  try {
    const response = await sendRequest(options);
    console.log('验证响应状态码:', response.statusCode);
    console.log('验证响应数据:', response.data);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ 验证令牌测试通过');
      return true;
    } else {
      console.log('❌ 验证令牌测试失败');
      return false;
    }
  } catch (error) {
    console.error('验证令牌测试出错:', error);
    return false;
  }
}

// 测试登出
async function testLogout(token) {
  console.log('\n=== 测试登出功能 ===');
  
  const options = {
    hostname: 'localhost',
    port: 3022,
    path: '/api/auth/logout',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  try {
    const response = await sendRequest(options);
    console.log('登出响应状态码:', response.statusCode);
    console.log('登出响应数据:', response.data);
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ 登出测试通过');
      return true;
    } else {
      console.log('❌ 登出测试失败');
      return false;
    }
  } catch (error) {
    console.error('登出测试出错:', error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试认证系统...');
  
  let server;
  try {
    // 启动服务器
    server = await startServer();
    console.log('服务器已启动');
    
    // 运行测试
    const registerToken = await testRegister();
    
    if (registerToken) {
      await testVerify(registerToken);
      await testLogout(registerToken);
    }
    
    const loginToken = await testLogin();
    
    if (loginToken) {
      await testVerify(loginToken);
      await testLogout(loginToken);
    }
    
    console.log('\n=== 测试完成 ===');
    console.log('所有测试已执行');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    // 停止服务器
    if (server) {
      server.kill();
      console.log('服务器已停止');
    }
  }
}

// 运行测试
runTests();