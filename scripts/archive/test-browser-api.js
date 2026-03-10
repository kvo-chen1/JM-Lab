// 模拟浏览器的API调用测试
import fetch from 'node-fetch';

async function testBrowserApiCall() {
  try {
    console.log('=== 测试浏览器API调用 ===');
    
    // 测试1: 使用前端代理的相对路径
    console.log('\n1. 测试使用相对路径的API调用:');
    
    // 构建测试请求
    const payload = {
      model: 'moonshot-v1-32k',
      messages: [
        {
          role: 'system',
          content: '你是津小脉，津脉智坊平台的专属AI助手，由Kimi模型驱动。你专注于传统文化创作与设计，能够为你提供平台功能导航、创作辅助、文化知识普及等全方位支持。你的使命是连接传统文化与青年创意，推动文化传承与创新。'
        },
        {
          role: 'user',
          content: '你好，我想了解一下平台的创作功能'
        }
      ],
      stream: false,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 500
    };
    
    console.log('请求数据:', JSON.stringify(payload, null, 2));
    
    // 使用前端开发服务器的地址和相对路径
    const frontendUrl = 'http://localhost:3005';
    const apiPath = '/api/kimi/chat/completions';
    const fullUrl = `${frontendUrl}${apiPath}`;
    
    console.log('请求URL:', fullUrl);
    
    // 发送请求
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('响应状态码:', response.status);
    const responseData = await response.json();
    console.log('响应数据:', JSON.stringify(responseData, null, 2));
    
    if (responseData.ok && responseData.data) {
      console.log('\n✅ 测试成功!');
      console.log('助手回复:', responseData.data.choices[0].message.content);
    } else {
      console.error('\n❌ 测试失败:', responseData.error || '未知错误');
    }
    
    // 测试2: 测试健康检查API
    console.log('\n2. 测试健康检查API:');
    const healthResponse = await fetch(`${frontendUrl}/api/health/llms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('健康检查状态码:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('健康检查响应:', JSON.stringify(healthData, null, 2));
    
    if (healthData.ok) {
      console.log('\n✅ 健康检查API测试成功!');
      console.log('Kimi配置状态:', healthData.status.kimi.configured ? '已配置' : '未配置');
      console.log('Qwen配置状态:', healthData.status.qwen.configured ? '已配置' : '未配置');
    } else {
      console.error('\n❌ 健康检查API测试失败:', healthData.error || '未知错误');
    }
    
  } catch (error) {
    console.error('\n❌ 测试异常:', error);
    console.error('错误详情:', error.message);
    console.error('错误栈:', error.stack);
  }
}

testBrowserApiCall();
