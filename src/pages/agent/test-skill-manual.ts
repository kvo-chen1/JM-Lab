/**
 * Skill 架构手动测试脚本
 * 运行: npx ts-node test-skill-manual.ts
 */

import {
  getSkillRegistry,
  resetSkillRegistry,
  ImageGenerationSkill,
  IntentRecognitionSkill,
  RequirementAnalysisSkill,
  DirectorAgent,
  DesignerAgent,
  SkillMatcher,
  getSkillMatcher
} from './services';

async function testSkillRegistry() {
  console.log('=== 测试 SkillRegistry ===\n');

  const registry = getSkillRegistry();

  // 注册 Skill
  console.log('1. 注册 Skill...');
  registry.register(new IntentRecognitionSkill(), 100);
  registry.register(new ImageGenerationSkill(), 90);
  registry.register(new RequirementAnalysisSkill(), 80);

  // 查看统计
  console.log('2. 查看注册统计:');
  const stats = registry.getRegistryStats();
  console.log(`   - 总 Skill 数: ${stats.totalSkills}`);
  console.log(`   - 启用数: ${stats.enabledSkills}`);
  console.log(`   - 按分类:`, stats.byCategory);

  // 获取 Skill
  console.log('\n3. 获取 Skill:');
  const intentSkill = registry.getSkill('intent-recognition');
  console.log(`   - 意图识别 Skill: ${intentSkill?.name}`);

  // 按分类获取
  console.log('\n4. 按分类获取:');
  const creationSkills = registry.getSkillsByCategory('creation');
  console.log(`   - 创作类 Skill: ${creationSkills.map(s => s.name).join(', ')}`);
}

async function testIntentRecognition() {
  console.log('\n\n=== 测试意图识别 ===\n');

  const registry = getSkillRegistry();
  const skill = registry.getSkill('intent-recognition');

  if (!skill) {
    console.log('意图识别 Skill 未找到');
    return;
  }

  const testMessages = [
    '帮我画一个Logo',
    '生成一个海报',
    '写个品牌文案',
    '做个视频动画',
    '你好',
    '不确定想要什么'
  ];

  for (const message of testMessages) {
    console.log(`\n测试: "${message}"`);
    const result = await skill.execute({
      userId: 'test',
      sessionId: 'test',
      message,
      history: []
    });

    if (result.success && result.metadata) {
      console.log(`  意图: ${result.metadata.intent}`);
      console.log(`  置信度: ${result.metadata.confidence}`);
      console.log(`  关键词: ${result.metadata.keywords?.join(', ')}`);
      console.log(`  实体:`, result.metadata.entities);
      if (result.metadata.clarificationNeeded) {
        console.log(`  需要澄清: ${result.metadata.suggestedResponse}`);
      }
    }
  }
}

async function testSkillMatcher() {
  console.log('\n\n=== 测试 SkillMatcher ===\n');

  const registry = getSkillRegistry();
  const matcher = getSkillMatcher(registry);

  const testIntents = [
    {
      type: 'image-generation',
      confidence: 0.9,
      keywords: ['画', '图像', 'Logo'],
      entities: {},
      rawMessage: '帮我画一个Logo'
    },
    {
      type: 'text-generation',
      confidence: 0.8,
      keywords: ['文案', '写作'],
      entities: {},
      rawMessage: '写个文案'
    }
  ];

  for (const intent of testIntents) {
    console.log(`\n测试意图: ${intent.type}`);
    const matches = matcher.match(intent);

    console.log(`  匹配到 ${matches.length} 个 Skill:`);
    matches.slice(0, 3).forEach((match, i) => {
      console.log(`    ${i + 1}. ${match.skill.name} (分数: ${match.score.toFixed(2)}, 置信度: ${match.confidence})`);
    });
  }
}

async function testAgents() {
  console.log('\n\n=== 测试 Agent ===\n');

  // 确保 Skill 已注册
  const registry = getSkillRegistry();
  if (!registry.hasSkill('intent-recognition')) {
    registry.register(new IntentRecognitionSkill());
  }

  console.log('1. 测试 Director Agent:');
  const director = new DirectorAgent();
  const directorResponse = await director.handleMessage('你好', {
    userId: 'test',
    sessionId: 'test',
    message: '你好',
    history: []
  });
  console.log(`   响应: ${directorResponse.content.substring(0, 50)}...`);

  console.log('\n2. 测试 Designer Agent:');
  const designer = new DesignerAgent();
  const designerResponse = await designer.handleMessage('帮我设计一个Logo', {
    userId: 'test',
    sessionId: 'test',
    message: '帮我设计一个Logo',
    history: []
  });
  console.log(`   响应: ${designerResponse.content.substring(0, 50)}...`);
}

async function runAllTests() {
  console.log('开始 Skill 架构手动测试\n');
  console.log('=' .repeat(50));

  try {
    // 重置注册中心
    resetSkillRegistry();

    // 运行测试
    await testSkillRegistry();
    await testIntentRecognition();
    await testSkillMatcher();
    await testAgents();

    console.log('\n\n' + '='.repeat(50));
    console.log('测试完成!');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
runAllTests();
