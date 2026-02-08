// 测试排行榜 API
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
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (e) {
          resolve({ raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testLeaderboardAPI() {
  console.log('========================================');
  console.log('测试排行榜 API');
  console.log('========================================\n');

  try {
    // 测试获取作品列表（排行榜用）
    console.log('🔍 测试 GET /api/works...\n');
    const result = await makeRequest('/api/works?limit=10');
    
    if (result.code === 0) {
      console.log(`✅ 成功获取 ${result.data?.length || 0} 个作品\n`);
      
      if (result.data && result.data.length > 0) {
        console.log('作品数据示例:');
        const work = result.data[0];
        console.log('  ID:', work.id);
        console.log('  标题:', work.title);
        console.log('  likes_count:', work.likes_count);
        console.log('  comments_count:', work.comments_count);
        console.log('  views:', work.views);
      } else {
        console.log('ℹ️ 没有作品数据');
      }
      
      console.log('\n✅ API 正常工作！');
    } else {
      console.log('❌ API 返回错误:', result.message || result);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n请确保服务器正在运行 (npm run dev:server)');
  }
}

testLeaderboardAPI();
