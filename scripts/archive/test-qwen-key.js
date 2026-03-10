// 测试通义千问API密钥的脚本
const API_KEY = process.env.QWEN_API_KEY || '';
const MODEL_ID = 'qwen-plus';
const BASE_URL = 'http://localhost:3010';

async function testQwenApi() {
  console.log('测试通义千问API密钥:', API_KEY);
  console.log('模型:', MODEL_ID);
  console.log('基础URL:', BASE_URL);
  
  try {
    // 1. 测试通过本地代理服务器调用
    console.log('\n1. 测试通过本地代理服务器调用:');
    const proxyResponse = await fetch(`${BASE_URL}/api/qwen/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 100,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
      }),
    });
    
    console.log('本地代理服务器响应状态:', proxyResponse.status);
    
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      console.log('本地代理服务器响应数据:', JSON.stringify(data, null, 2));
      console.log('\n✅ 本地代理服务器测试成功！');
    } else {
      const errorData = await proxyResponse.json().catch(() => ({}));
      console.log('本地代理服务器错误响应:', JSON.stringify(errorData, null, 2));
      console.log('\n❌ 本地代理服务器测试失败！');
    }
    
    // 2. 直接调用DashScope API测试
    console.log('\n2. 直接调用DashScope API测试:');
    const dashscopeResponse = await fetch(`https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        input: {
          messages: [{ role: 'user', content: '你好' }]
        },
        parameters: {
          max_tokens: 100,
          temperature: 0.7,
          top_p: 0.9
        }
      }),
    });
    
    console.log('直接调用DashScope API响应状态:', dashscopeResponse.status);
    
    if (dashscopeResponse.ok) {
      const data = await dashscopeResponse.json();
      console.log('直接调用DashScope API响应数据:', JSON.stringify(data, null, 2));
      console.log('\n✅ 直接调用DashScope API测试成功！API密钥有效。');
    } else {
      const errorData = await dashscopeResponse.json().catch(() => ({}));
      console.log('直接调用DashScope API错误响应:', JSON.stringify(errorData, null, 2));
      console.log('\n❌ 直接调用DashScope API测试失败！API密钥可能无效或配置有问题。');
    }
    
  } catch (error) {
    console.error('请求失败:', error.message);
    console.log('\n❌ 测试失败！网络或服务器有问题。');
  }
}

testQwenApi();

// 如何在应用中更新API密钥的说明：
console.log('\n========================================');
console.log('在应用中更新API密钥的步骤：');
console.log('1. 设置环境变量 QWEN_API_KEY');
console.log('2. 运行: QWEN_API_KEY=your-actual-key node test-qwen-key.js');
console.log('3. 或在 .env 文件中添加: QWEN_API_KEY=your-actual-key');
console.log('========================================');
