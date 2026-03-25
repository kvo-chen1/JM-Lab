/**
 * Skill API 自动化测试
 * 通过 HTTP 请求测试 Skill 核心功能
 */

const API_BASE = 'http://localhost:3006';

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: any;
}

const results: TestResult[] = [];

async function callAPI(endpoint: string, body: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await response.json();
  } catch (error) {
    console.error('API调用失败:', error);
    return null;
  }
}

async function runTest(
  name: string,
  testFn: () => Promise<boolean>,
  expected: string,
  actual: string,
  details?: any
) {
  try {
    const passed = await testFn();
    results.push({ name, passed, expected, actual, details });
    console.log(passed ? `✅ ${name}` : `❌ ${name}`);
    if (!passed) {
      console.log(`   预期: ${expected}`);
      console.log(`   实际: ${actual}`);
      if (details) console.log(`   详情:`, details);
    }
  } catch (error) {
    results.push({
      name,
      passed: false,
      expected,
      actual: `执行错误: ${error}`,
    });
    console.log(`❌ ${name} - 执行错误: ${error}`);
  }
}

// ==================== 测试用例 ====================

async function testIntentRecognition() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 第一部分：意图识别测试');
  console.log('='.repeat(60) + '\n');

  // 场景1: 简单图片生成
  const result1 = await callAPI('/api/skill/intent', {
    message: '画一只橘猫'
  });
  await runTest(
    '场景1-1: 简单图片生成',
    async () => result1?.intent === 'image-generation',
    'image-generation',
    result1?.intent || '无响应'
  );

  // 场景1-2: 指代词"这张"
  const result2 = await callAPI('/api/skill/intent', {
    message: '把这张猫复制一份，换成蓝眼睛'
  });
  await runTest(
    '场景1-2: 指代词"这张"',
    async () => ['image-beautification', 'image-style-transfer', 'image-generation'].includes(result2?.intent),
    'image-beautification / image-style-transfer / image-generation',
    result2?.intent || '无响应',
    result2
  );

  // 场景1-3: 复制文案
  const result3 = await callAPI('/api/skill/intent', {
    message: '把上面这段复制，改成蓝海科技'
  });
  await runTest(
    '场景1-3: "复制+修改"文案',
    async () => result3?.intent?.includes('copy') || result3?.intent === 'text-generation',
    'text-generation / brand-copy / marketing-copy',
    result3?.intent || '无响应'
  );

  // 场景1-4: 基于已有设计延伸
  const result4 = await callAPI('/api/skill/intent', {
    message: '基于这个Logo设计一张海报'
  });
  await runTest(
    '场景1-4: "基于这个"延伸',
    async () => result4?.intent === 'poster-design' || result4?.intent?.includes('design'),
    'poster-design / poster-generation',
    result4?.intent || '无响应'
  );

  // 场景1-5: 引用+新请求
  const result5 = await callAPI('/api/skill/intent', {
    message: '这个不错，帮我生成一套周边产品的效果图'
  });
  await runTest(
    '场景1-5: "这个不错"引用',
    async () => result5?.intent?.includes('generation') || result5?.intent?.includes('design'),
    'image-generation / design',
    result5?.intent || '无响应'
  );
}

async function testRequirementAnalysis() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 第二部分：需求分析测试');
  console.log('='.repeat(60) + '\n');

  // 场景2-1: 完整信息
  const result1 = await callAPI('/api/skill/analyze', {
    intent: 'logo-design',
    message: '品牌叫绿野科技，理念是专注环保科技，想要商务文具和包装产品',
    history: []
  });
  await runTest(
    '场景2-1: Logo设计完整信息',
    async () => result1?.collectedInfo?.brandName?.includes('绿野'),
    'brandName包含绿野',
    result1?.collectedInfo?.brandName || '未收集到',
    result1
  );

  // 场景2-2: 上下文引用
  const result2 = await callAPI('/api/skill/analyze', {
    intent: 'poster-design',
    message: '基于这个Logo设计一张海报',
    history: [
      { role: 'user', content: '帮我设计一个Logo，品牌叫云智科技' },
      { role: 'assistant', content: '已为您生成云智科技的Logo' },
    ]
  });
  await runTest(
    '场景2-2: 上下文引用Logo',
    async () => {
      const info = result2?.collectedInfo;
      return info?.brandName || info?.reference || result2?.summary?.includes('Logo');
    },
    '应该能引用到Logo信息',
    JSON.stringify(result2?.collectedInfo || result2?.summary || '无'),
    result2
  );
}

async function testMultiSkill() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 第三部分：多Skill联动测试');
  console.log('='.repeat(60) + '\n');

  // 场景3-1: VI系统批量生成
  const result1 = await callAPI('/api/skill/intent', {
    message: '基于这个Logo生成完整的VI系统，包括名片、信纸、工牌'
  });
  await runTest(
    '场景3-1: VI系统批量生成',
    async () => result1?.intent?.includes('design') || result1?.intent === 'poster-design',
    '设计相关意图',
    result1?.intent || '无响应'
  );

  // 场景3-2: 多渠道适配
  const result2 = await callAPI('/api/skill/intent', {
    message: '把这段文案适配到朋友圈、微博、小红书三个平台'
  });
  await runTest(
    '场景3-2: 多渠道文案适配',
    async () => result2?.intent?.includes('social') || result2?.intent?.includes('copy'),
    'social-copy / marketing-copy',
    result2?.intent || '无响应'
  );

  // 场景3-3: 批量生成物料
  const result3 = await callAPI('/api/skill/intent', {
    message: '基于这个产品生成一套营销物料：主视觉海报、详情页主图、社交媒体配图'
  });
  await runTest(
    '场景3-3: 批量营销物料',
    async () => result3?.intent?.includes('generation') || result3?.intent?.includes('marketing'),
    '营销/生成相关意图',
    result3?.intent || '无响应'
  );
}

async function testEdgeCases() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 第四部分：边界测试');
  console.log('='.repeat(60) + '\n');

  // 边界1: 极短输入
  const result1 = await callAPI('/api/skill/intent', { message: '画' });
  await runTest(
    '边界1: 极短输入"画"',
    async () => result1?.intent !== 'general' || result1?.confidence < 0.5,
    '应该尝试识别',
    `${result1?.intent} (置信度: ${result1?.confidence})`
  );

  // 边界2: 无上下文指代
  const result2 = await callAPI('/api/skill/intent', {
    message: '把这张图改成蓝色'
  });
  await runTest(
    '边界2: 无上下文"这张图"',
    async () => ['image-beautification', 'image-style-transfer', 'image-generation'].includes(result2?.intent),
    '图片处理意图',
    result2?.intent || '无响应'
  );
}

// ==================== 主函数 ====================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 津小脉 Skill API 自动化测试');
  console.log('='.repeat(60));

  await testIntentRecognition();
  await testRequirementAnalysis();
  await testMultiSkill();
  await testEdgeCases();

  // 总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 通过率: ${Math.round(passed / results.length * 100)}%`);

  if (failed > 0) {
    console.log('\n❌ 失败详情:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n  【${r.name}】`);
      console.log(`  预期: ${r.expected}`);
      console.log(`  实际: ${r.actual}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  return { passed, failed, results };
}

main().then(({ passed, failed }) => {
  console.log(`\n测试完成！${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
