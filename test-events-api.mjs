// 测试 Events API
import http from 'http';

const API_PORT = 3022;
const API_HOST = 'localhost';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
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

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEventsAPI() {
  console.log('========================================');
  console.log('测试 Events API');
  console.log('========================================\n');

  try {
    console.log('🔍 测试 GET /api/events...\n');
    const result = await makeRequest('/api/events');
    
    if (result.code === 0 && Array.isArray(result.data)) {
      console.log(`✅ 成功获取 ${result.data.length} 个活动\n`);
      
      if (result.data.length > 0) {
        console.log('活动数据示例:');
        const event = result.data[0];
        console.log('  ID:', event.id);
        console.log('  标题:', event.title);
        console.log('  描述:', event.description?.substring(0, 50) + '...');
        console.log('  startTime:', event.startTime);
        console.log('  endTime:', event.endTime);
        console.log('  location:', event.location);
        console.log('  status:', event.status);
        console.log('  type:', event.type);
        console.log('  category:', event.category);
        console.log('  tags:', event.tags);
        console.log('  participantCount:', event.participantCount);
        console.log('  media:', JSON.stringify(event.media));
        console.log('  organizer:', JSON.stringify(event.organizer));
        
        // 验证字段格式
        console.log('\n--- 字段格式验证 ---');
        const checks = [
          { name: 'startTime', valid: typeof event.startTime === 'string' && event.startTime.includes('T') },
          { name: 'endTime', valid: typeof event.endTime === 'string' && event.endTime.includes('T') },
          { name: 'media', valid: Array.isArray(event.media) },
          { name: 'organizer', valid: typeof event.organizer === 'object' && event.organizer !== null },
          { name: 'tags', valid: Array.isArray(event.tags) }
        ];
        
        let allValid = true;
        checks.forEach(check => {
          const status = check.valid ? '✅' : '❌';
          console.log(`  ${status} ${check.name}`);
          if (!check.valid) allValid = false;
        });
        
        if (allValid) {
          console.log('\n🎉 所有字段格式正确！');
        } else {
          console.log('\n⚠️ 部分字段格式不正确');
        }
      } else {
        console.log('⚠️ 没有活动数据');
      }
    } else {
      console.log('❌ API 返回错误:', result.message || result);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n请确保服务器正在运行 (npm run dev:server)');
  }
}

testEventsAPI();
