// 测试 Events API - 查看原始返回
import http from 'http';

const API_PORT = 3022;
const API_HOST = 'localhost';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve(responseData);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testEventsAPI() {
  console.log('========================================');
  console.log('测试 Events API - 原始数据');
  console.log('========================================\n');

  try {
    console.log('🔍 测试 GET /api/events...\n');
    const result = await makeRequest('/api/events');
    console.log('原始响应:');
    console.log(result);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n请确保服务器正在运行 (npm run dev:server)');
  }
}

testEventsAPI();
