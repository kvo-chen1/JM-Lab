// 测试模拟数据与真实数据切换功能

import { workService } from './src/services/apiService';
import { mockWorks } from './src/mock/works';

async function testMockRealSwitch() {
  console.log('开始测试模拟数据与真实数据切换功能...');
  
  try {
    // 1. 测试使用模拟数据
    console.log('\n1. 测试使用模拟数据:');
    workService.setUseMockData(true);
    console.log('   使用模拟数据模式:', workService.getUseMockData());
    
    const mockWorksResult = await workService.getWorks();
    console.log('   模拟数据获取成功，作品数量:', mockWorksResult.length);
    console.log('   第一个作品:', mockWorksResult[0]?.title);
    
    // 2. 测试切换到真实数据
    console.log('\n2. 测试切换到真实数据:');
    workService.setUseMockData(false);
    console.log('   使用模拟数据模式:', workService.getUseMockData());
    
    try {
      const realWorksResult = await workService.getWorks();
      console.log('   真实数据获取成功，作品数量:', realWorksResult.length);
      console.log('   第一个作品:', realWorksResult[0]?.title);
    } catch (error) {
      console.log('   真实数据获取失败 (预期行为，因为真实API可能未配置):', error.message);
    }
    
    // 3. 测试切换回模拟数据
    console.log('\n3. 测试切换回模拟数据:');
    workService.setUseMockData(true);
    console.log('   使用模拟数据模式:', workService.getUseMockData());
    
    const mockWorksResultAgain = await workService.getWorks();
    console.log('   模拟数据获取成功，作品数量:', mockWorksResultAgain.length);
    console.log('   第一个作品:', mockWorksResultAgain[0]?.title);
    
    console.log('\n✅ 模拟数据与真实数据切换测试完成！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

testMockRealSwitch();
