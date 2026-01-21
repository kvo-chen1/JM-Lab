// 测试通义千问图片生成功能的脚本
const BASE_URL = 'http://localhost:3021';

async function testQwenImageGeneration() {
  console.log('测试通义千问图片生成功能');
  console.log('基础URL:', BASE_URL);
  
  try {
    // 测试通过本地代理服务器调用图片生成API
    console.log('\n测试通过本地代理服务器调用图片生成API:');
    const response = await fetch(`${BASE_URL}/api/qwen/images/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        prompt: '一只可爱的小猫',
        size: '1024x1024',
        n: 1,
        response_format: 'url',
      }),
    });
    
    console.log('本地代理服务器响应状态:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('本地代理服务器响应数据:', JSON.stringify(data, null, 2));
      console.log('\n✅ 通义千问图片生成测试成功！');
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('本地代理服务器错误响应:', JSON.stringify(errorData, null, 2));
      console.log('\n❌ 通义千问图片生成测试失败！');
    }
  } catch (error) {
    console.error('请求失败:', error.message);
    console.log('\n❌ 测试失败！网络或服务器有问题。');
  }
}

testQwenImageGeneration();
