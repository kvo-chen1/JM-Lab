/**
 * Skill 集成测试脚本
 * 测试 Agent + Skill 融合效果
 */

// 内联测试函数，避免模块导入问题
function isQuickGenerationRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  
  const quickKeywords = [
    '生成', '画', '画一个', '画个', '画一张', '画幅',
    '做', '做个', '做一个', '来', '来张', '来个',
    '给我画', '帮我画', '给我生成', '帮我生成'
  ];
  
  const hasQuickKeyword = quickKeywords.some(kw => lowerMsg.includes(kw));
  const hasSpecificDescription = message.length >= 4;
  const complexIndicators = ['需求', '方案', '流程', '策略', '规划', '详细', '完整'];
  const hasComplexIndicator = complexIndicators.some(ind => lowerMsg.includes(ind));
  
  return hasQuickKeyword && hasSpecificDescription && !hasComplexIndicator;
}

// 测试用例
const testCases = [
  {
    name: '✨ 快速生成 - 猫咪',
    message: '画一只猫咪',
    expectQuick: true
  },
  {
    name: '✨ 快速生成 - Logo',
    message: '生成一个科技公司的Logo',
    expectQuick: true
  },
  {
    name: '💬 复杂需求 - 品牌方案',
    message: '我需要做一个完整的品牌设计方案，包括Logo、VI系统和包装设计',
    expectQuick: false
  },
  {
    name: '💬 咨询建议',
    message: '有什么好的设计风格推荐吗？',
    expectQuick: false
  },
  {
    name: '✨ 插画快速生成',
    message: '画一个森系风格的女孩',
    expectQuick: true
  },
  {
    name: '💬 太短的消息',
    message: '画个猫',
    expectQuick: false
  },
  {
    name: '✨ 来张海报',
    message: '来张海报',
    expectQuick: true
  }
];

// 运行测试
function runTests() {
  console.log('🚀 Skill 集成测试 - 快速模式检测\n');
  console.log('=' .repeat(60));
  console.log();
  
  let passCount = 0;
  let failCount = 0;
  
  for (const testCase of testCases) {
    const result = isQuickGenerationRequest(testCase.message);
    const passed = result === testCase.expectQuick;
    
    if (passed) {
      passCount++;
      console.log(`✅ ${testCase.name}`);
    } else {
      failCount++;
      console.log(`❌ ${testCase.name}`);
      console.log(`   期望: ${testCase.expectQuick ? '快速模式 ⚡' : '普通模式 💬'}`);
      console.log(`   实际: ${result ? '快速模式 ⚡' : '普通模式 💬'}`);
    }
    console.log(`   消息: "${testCase.message}"`);
    console.log(`   长度: ${testCase.message.length} 字符`);
    console.log();
  }
  
  console.log('=' .repeat(60));
  console.log();
  console.log(`📊 测试结果: ${passCount} 通过, ${failCount} 失败`);
  console.log();
  
  if (failCount === 0) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️  有测试未通过，请检查逻辑');
  }
  
  console.log();
  console.log('📋 融合效果说明:');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│  用户输入 → 快速检测 → 分支处理                      │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│  ⚡ 快速模式: 直接执行 Skill → 立即返回图像          │');
  console.log('│     适用: "画一只猫咪"、"生成Logo" 等简单请求        │');
  console.log('│                                                      │');
  console.log('│  💬 普通模式: 意图识别 → LLM对话 → 复杂处理          │');
  console.log('│     适用: "品牌设计方案"、"咨询建议" 等复杂需求      │');
  console.log('└─────────────────────────────────────────────────────┘');
  console.log();
  console.log('🔧 触发快速模式的条件:');
  console.log('   1. ✅ 包含关键词: "生成"、"画"、"做"、"来" 等');
  console.log('   2. ✅ 消息长度 >= 4 个字符');
  console.log('   3. ❌ 不包含复杂词: "需求"、"方案"、"流程" 等');
  console.log();
  console.log('✨ 融合优势:');
  console.log('   • 简单请求: 秒回，无需等待 LLM');
  console.log('   • 复杂请求: 深度对话，专业处理');
  console.log('   • 自动判断: 智能选择最佳处理方式');
}

// 执行测试
runTests();
