// 简单的Kimi API测试脚本
import fetch from 'node-fetch';

async function testKimiAPI() {
  try {
    console.log('=== 测试Kimi API连接 ===');
    
    // 构建测试请求
    const payload = {
      model: 'moonshot-v1-32k',
      messages: [
        { role: 'user', content: '你好，我是测试' }
      ],
      stream: false,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 1000
    };
    
    console.log('测试请求:', JSON.stringify(payload, null, 2));
    
    // 调用本地代理的Kimi API
    const response = await fetch('http://localhost:3022/api/kimi/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('\n=== 响应信息 ===');
    console.log('状态码:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers));
    
    // 解析响应
    const responseBody = await response.text();
    console.log('\n响应体:', responseBody);
    
    try {
      const jsonBody = JSON.parse(responseBody);
      console.log('\n=== 解析后的响应 ===');
      console.log(JSON.stringify(jsonBody, null, 2));
    } catch (parseError) {
      console.log('\n=== 响应解析失败 ===');
      console.error('解析错误:', parseError);
    }
    
  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error('错误:', error);
  }
}

testKimiAPI();