/**
 * Agent 架构手动测试脚本
 * 运行: npx ts-node test-skill-manual.ts
 */

import { createAgent } from './agents';

async function testAgents() {
  console.log('=== 测试 Agent ===\n');

  const agentTypes = ['director', 'designer', 'illustrator', 'copywriter', 'animator', 'researcher'] as const;

  for (const agentType of agentTypes) {
    console.log(`\n1. 测试 ${agentType} Agent:`);
    try {
      const agent = createAgent(agentType);
      const response = await agent.handleMessage('你好', {
        userId: 'test',
        sessionId: 'test',
        message: '你好',
        history: []
      });
      console.log(`   名称: ${agent.name}`);
      console.log(`   描述: ${agent.description}`);
      console.log(`   响应: ${response.content.substring(0, 50)}...`);
    } catch (error) {
      console.error(`   错误:`, error);
    }
  }
}

async function runAllTests() {
  console.log('开始 Agent 架构手动测试\n');
  console.log('=' .repeat(50));

  try {
    await testAgents();

    console.log('\n\n' + '='.repeat(50));
    console.log('测试完成!');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
runAllTests();
