// 模拟前端连接测试
import fetch from 'node-fetch';

async function testFrontendConnection() {
  try {
    console.log('=== 测试前端AI服务连接 ===');
    
    // 测试1: 服务器健康状态
    console.log('\n1. 测试服务器健康状态:');
    const healthResponse = await fetch('http://localhost:3022/api/health/ping', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('状态码:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('响应:', JSON.stringify(healthData, null, 2));
    
    // 测试2: LLM模型配置状态
    console.log('\n2. 测试LLM模型配置状态:');
    const llmResponse = await fetch('http://localhost:3022/api/health/llms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('状态码:', llmResponse.status);
    const llmData = await llmResponse.json();
    console.log('响应:', JSON.stringify(llmData, null, 2));
    
    // 测试3: Kimi API调用
    console.log('\n3. 测试Kimi API调用:');
    const kimiResponse = await fetch('http://localhost:3022/api/kimi/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshot-v1-32k',
        messages: [
          { role: 'user', content: '你好' }
        ],
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 100
      })
    });
    console.log('状态码:', kimiResponse.status);
    const kimiData = await kimiResponse.json();
    console.log('响应:', JSON.stringify(kimiData, null, 2));
    
    // 测试4: Qwen API调用
    console.log('\n4. 测试Qwen API调用:');
    const qwenResponse = await fetch('http://localhost:3022/api/qwen/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'user', content: '你好' }
        ],
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 100
      })
    });
    console.log('状态码:', qwenResponse.status);
    const qwenData = await qwenResponse.json();
    console.log('响应:', JSON.stringify(qwenData, null, 2));
    
    console.log('\n=== 测试完成 ===');
    console.log('所有测试都已成功完成！');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testFrontendConnection();
