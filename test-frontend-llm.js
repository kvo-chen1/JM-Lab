// 模拟前端AI服务调用测试
import fetch from 'node-fetch';

async function testFrontendLLMCall() {
  try {
    console.log('=== 测试前端AI服务完整调用流程 ===');
    
    // 模拟前端的directGenerateResponse调用
    console.log('\n1. 测试directGenerateResponse调用流程:');
    
    // 构建系统消息
    const systemMessage = {
      role: 'system',
      content: '你是津小脉，津脉智坊平台的专属AI助手，由Kimi模型驱动。你专注于传统文化创作与设计，能够为你提供平台功能导航、创作辅助、文化知识普及等全方位支持。你的使命是连接传统文化与青年创意，推动文化传承与创新。'
    };
    
    // 构建用户消息
    const userMessage = {
      role: 'user',
      content: '你好，我想了解一下平台的创作功能'
    };
    
    // 构建完整的消息数组
    const messages = [systemMessage, userMessage];
    
    console.log('系统消息:', systemMessage.content.substring(0, 100) + '...');
    console.log('用户消息:', userMessage.content);
    
    // 测试Kimi API调用
    console.log('\n2. 测试Kimi API调用:');
    const kimiResponse = await fetch('http://localhost:3022/api/kimi/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshot-v1-32k',
        messages: messages,
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500
      })
    });
    
    console.log('Kimi API状态码:', kimiResponse.status);
    const kimiData = await kimiResponse.json();
    console.log('Kimi API响应:', JSON.stringify(kimiData, null, 2));
    
    if (kimiData.ok && kimiData.data) {
      console.log('Kimi API调用成功!');
      console.log('助手回复:', kimiData.data.choices[0].message.content);
    } else {
      console.error('Kimi API调用失败:', kimiData.error || '未知错误');
    }
    
    // 测试Qwen API调用（作为兜底）
    console.log('\n3. 测试Qwen API调用（作为兜底）:');
    const qwenResponse = await fetch('http://localhost:3022/api/qwen/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: messages,
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500
      })
    });
    
    console.log('Qwen API状态码:', qwenResponse.status);
    const qwenData = await qwenResponse.json();
    console.log('Qwen API响应:', JSON.stringify(qwenData, null, 2));
    
    if (qwenData.ok && qwenData.data) {
      console.log('Qwen API调用成功!');
      console.log('助手回复:', qwenData.data.choices[0].message.content);
    } else {
      console.error('Qwen API调用失败:', qwenData.error || '未知错误');
    }
    
    // 测试健康检查
    console.log('\n4. 测试健康检查:');
    const healthResponse = await fetch('http://localhost:3022/api/health/llms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('健康检查状态码:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('健康检查响应:', JSON.stringify(healthData, null, 2));
    
    console.log('\n=== 测试完成 ===');
    console.log('所有测试步骤都已执行完成！');
    
  } catch (error) {
    console.error('测试失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误栈:', error.stack);
  }
}

testFrontendLLMCall();
