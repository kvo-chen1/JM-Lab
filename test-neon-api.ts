// 测试 Neon Data API 连接
import { neonDataApiService } from './src/services/neonDataApiService';

async function testNeonDataApi() {
  console.log('Testing Neon Data API connection...');
  
  try {
    // 测试获取 users 表数据
    console.log('Fetching users data...');
    const users = await neonDataApiService.getTableData('users', {
      select: '*',
      limit: 5
    });
    
    console.log('Users data:', users);
    console.log('Test successful!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testNeonDataApi();
