/**
 * Skill 自动化测试脚本
 * 直接测试 Skill 核心功能：意图识别、需求分析、上下文引用
 */

import { recognizeIntent } from './src/pages/skill/chat/services/intentService';
import { analyzeRequirements } from './src/pages/skill/chat/services/requirementService';

interface TestResult {
  name: string;
  passed: boolean;
  expected?: string;
  actual: string;
  error?: string;
}

const testResults: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<boolean>, expected: string, actual: string) {
  try {
    const passed = await testFn();
    testResults.push({ name, passed, expected, actual });
    console.log(passed ? `✅ ${name}` : `❌ ${name}`);
    if (!passed) {
      console.log(`   预期: ${expected}`);
      console.log(`   实际: ${actual}`);
    }
  } catch (error) {
    testResults.push({
      name,
      passed: false,
      expected,
      actual: '测试执行出错',
      error: error instanceof Error ? error.message : String(error)
    });
    console.log(`❌ ${name} - 执行错误: ${error}`);
  }
}

// ==================== 第一部分：意图识别测试 ====================

async function testIntentRecognition() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 第一部分：意图识别测试');
  console.log('='.repeat(60) + '\n');

  // 场景1：基础图片生成
  await runTest(
    '场景1-1: 简单图片生成意图',
    async () => {
      const result = await recognizeIntent('画一只橘猫');
      return result.intent === 'image-generation';
    },
    'image-generation',
    (await recognizeIntent('画一只橘猫')).intent
  );

  // 场景1：带指代词的二次创作
  await runTest(
    '场景1-2: 指代词"这张"应该识别为图片处理',
    async () => {
      const result = await recognizeIntent('把这张猫复制一份，换成蓝眼睛');
      console.log('   实际识别结果:', result.intent, result.confidence);
      return ['image-beautification', 'image-style-transfer', 'image-generation'].includes(result.intent);
    },
    'image-beautification 或 image-generation',
    '见实际输出'
  );

  // 场景1-3: 复制文案指令
  await runTest(
    '场景1-3: "复制+修改"指令识别',
    async () => {
      const result = await recognizeIntent('把上面这段复制，改成蓝海科技');
      console.log('   实际识别结果:', result.intent, result.confidence);
      return result.intent.includes('copy') || result.intent === 'text-generation';
    },
    'text-generation 或类似文案处理意图',
    (await recognizeIntent('把上面这段复制，改成蓝海科技')).intent
  );

  // 场景1-4: "基于这个"延伸设计
  await runTest(
    '场景1-4: "基于这个Logo"延伸意图',
    async () => {
      const result = await recognizeIntent('基于这个Logo设计一张海报');
      console.log('   实际识别结果:', result.intent, result.confidence);
      return result.intent === 'poster-design' || result.intent.includes('design');
    },
    'poster-design 或 design',
    (await recognizeIntent('基于这个Logo设计一张海报')).intent
  );

  // 场景1-5: "这个不错"引用
  await runTest(
    '场景1-5: "这个不错"引用+新请求',
    async () => {
      const result = await recognizeIntent('这个不错，帮我生成一套周边产品的效果图');
      console.log('   实际识别结果:', result.intent, result.confidence);
      return result.intent.includes('generation') || result.intent.includes('design');
    },
    'image-generation 或 design',
    (await recognizeIntent('这个不错，帮我生成一套周边产品的效果图')).intent
  );
}

// ==================== 第二部分：需求分析测试 ====================

async function testRequirementAnalysis() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 第二部分：需求分析测试');
  console.log('='.repeat(60) + '\n');

  // 场景2-1: 完整信息一次性提供
  await runTest(
    '场景2-1: Logo设计一次性提供所有信息',
    async () => {
      const result = await analyzeRequirements(
        'logo-design',
        '品牌叫绿野科技，理念是专注环保科技，想要商务文具和包装产品',
        []
      );
      console.log('   收集到的信息:', result.collectedInfo);
      console.log('   缺失字段:', result.missingFields.map(f => f.key));
      console.log('   是否完成:', result.ready);
      return result.collectedInfo['brandName'] === '绿野科技' ||
             result.collectedInfo['brandName']?.includes('绿野');
    },
    'brandName=绿野科技',
    '见实际输出'
  );

  // 场景2-2: 上下文引用测试
  await runTest(
    '场景2-2: 基于之前生成的Logo生成海报（上下文引用）',
    async () => {
      const history = [
        { role: 'user' as const, content: '帮我设计一个Logo，品牌叫云智科技' },
        { role: 'assistant' as const, content: '已为您生成云智科技的Logo，包含科技感元素和蓝色配色' },
        { role: 'user' as const, content: '基于这个Logo设计一张海报' }
      ];
      const result = await analyzeRequirements(
        'poster-design',
        '基于这个Logo设计一张海报',
        history
      );
      console.log('   收集到的信息:', result.collectedInfo);
      console.log('   是否引用了Logo:', result.collectedInfo['brandName'] || result.summary);
      return result.collectedInfo['brandName'] !== undefined ||
             result.collectedInfo['reference'] !== undefined ||
             result.summary.includes('Logo');
    },
    '应该能识别到Logo相关信息',
    '见实际输出'
  );

  // 场景2-3: 变体生成需求
  await runTest(
    '场景2-3: "再生成一个浅色版本"',
    async () => {
      const result = await analyzeRequirements(
        'image-generation',
        '再生成一个浅色版本的',
        [{ role: 'user' as const, content: '生成一张咖啡店海报' }]
      );
      console.log('   分析结果:', result.summary);
      return result.collectedInfo['colorTone'] !== undefined ||
             result.collectedInfo['style'] !== undefined ||
             result.collectedInfo['variant'] !== undefined;
    },
    '应该识别到"浅色"这一变化需求',
    '见实际输出'
  );
}

// ==================== 第三部分：多Skill联动测试 ====================

async function testMultiSkillScenario() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 第三部分：多Skill联动测试');
  console.log('='.repeat(60) + '\n');

  // 场景3-1: Logo → VI系统
  await runTest(
    '场景3-1: "基于这个Logo生成VI系统"意图识别',
    async () => {
      const result = await recognizeIntent('基于这个Logo生成完整的VI系统，包括名片、信纸、工牌');
      console.log('   识别意图:', result.intent);
      return result.intent.includes('design') ||
             result.intent.includes('generation') ||
             result.params['type'] === 'vi-system';
    },
    '应该识别为设计类请求',
    (await recognizeIntent('基于这个Logo生成完整的VI系统，包括名片、信纸、工牌')).intent
  );

  // 场景3-2: 文案多渠道适配
  await runTest(
    '场景3-2: "适配到朋友圈、微博、小红书"',
    async () => {
      const result = await recognizeIntent('把这段文案适配到朋友圈、微博、小红书三个平台');
      console.log('   识别意图:', result.intent, result.params);
      return result.intent.includes('social') ||
             result.intent.includes('copy') ||
             result.params['platform'] !== undefined;
    },
    '应该识别为社媒文案',
    (await recognizeIntent('把这段文案适配到朋友圈、微博、小红书三个平台')).intent
  );

  // 场景3-3: 批量生成
  await runTest(
    '场景3-3: "生成一套营销物料"批量需求',
    async () => {
      const result = await recognizeIntent('基于这个产品生成一套营销物料：主视觉海报、详情页主图、社交媒体配图');
      console.log('   识别意图:', result.intent, result.params);
      return result.intent.includes('generation') ||
             result.intent.includes('design') ||
             result.intent.includes('marketing');
    },
    '应该识别为批量生成',
    (await recognizeIntent('基于这个产品生成一套营销物料：主视觉海报、详情页主图、社交媒体配图')).intent
  );
}

// ==================== 第四部分：边界测试 ====================

async function testEdgeCases() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 第四部分：边界测试');
  console.log('='.repeat(60) + '\n');

  // 边界1: 极短输入
  await runTest(
    '边界1: 极短输入"画"',
    async () => {
      const result = await recognizeIntent('画');
      console.log('   识别结果:', result.intent, result.confidence);
      return result.intent !== 'general' || result.confidence < 0.5;
    },
    '应该尝试识别意图',
    (await recognizeIntent('画')).intent
  );

  // 边界2: 模糊指代
  await runTest(
    '边界2: "这张图"没有上下文',
    async () => {
      const result = await recognizeIntent('把这张图改成蓝色');
      console.log('   识别结果:', result.intent, result.reasoning);
      return result.intent === 'image-beautification' ||
             result.intent === 'image-style-transfer' ||
             result.intent === 'image-generation';
    },
    '应该识别为图片处理',
    (await recognizeIntent('把这张图改成蓝色')).intent
  );

  // 边界3: 多重意图
  await runTest(
    '边界3: "识别这张图然后转换风格"',
    async () => {
      const result = await recognizeIntent('识别这张图然后转换成油画风格');
      console.log('   识别结果:', result.intent, result.reasoning);
      return result.intent.includes('recognition') ||
             result.intent.includes('style') ||
             result.intent.includes('transfer');
    },
    '应该识别为图片处理相关',
    (await recognizeIntent('识别这张图然后转换成油画风格')).intent
  );
}

// ==================== 执行所有测试 ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 津小脉 Skill 自动化测试开始');
  console.log('='.repeat(60));

  try {
    await testIntentRecognition();
    await testRequirementAnalysis();
    await testMultiSkillScenario();
    await testEdgeCases();
  } catch (error) {
    console.error('\n❌ 测试执行过程出错:', error);
  }

  // 打印测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结');
  console.log('='.repeat(60));

  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;

  console.log(`\n✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 通过率: ${Math.round(passed / testResults.length * 100)}%`);

  if (failed > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
      console.log(`    预期: ${r.expected}`);
      console.log(`    实际: ${r.actual}`);
      if (r.error) console.log(`    错误: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  return { passed, failed, results: testResults };
}

// 运行测试
runAllTests().then(({ passed, failed }) => {
  console.log(`\n测试完成！${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});
