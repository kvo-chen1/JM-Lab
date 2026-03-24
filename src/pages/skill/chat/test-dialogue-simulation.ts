/**
 * 对话模拟测试脚本
 * 运行: npx ts-node test-dialogue-simulation.ts
 * 
 * 测试多种交流场景下的对话回复能力
 */

interface TestStep {
  user: string;
  expectedPhase: 'analyzing' | 'collecting' | 'confirming' | 'executing' | 'completed';
  expectedProgress?: string;
  checkResponse?: (response: string) => boolean;
  description: string;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  conversations: TestStep[];
}

// 测试用例定义
const testCases: TestCase[] = [
  {
    id: 'scenario-1',
    name: '场景 1: Logo 设计 - 正常流程',
    description: '测试按顺序收集必填字段，进度正确更新',
    conversations: [
      {
        user: '帮我设计一个 Logo',
        expectedPhase: 'collecting',
        expectedProgress: '0/3',
        description: '初始消息，应该进入收集阶段，询问品牌名称',
        checkResponse: (r) => r.includes('品牌名称') || r.includes('品牌') || r.includes('名称')
      },
      {
        user: '品牌叫绿野科技',
        expectedPhase: 'collecting',
        expectedProgress: '1/3',
        description: '提供品牌名称，应该询问品牌理念',
        checkResponse: (r) => r.includes('理念') || r.includes('定位') || r.includes('概念')
      },
      {
        user: '专注环保科技，倡导绿色生活',
        expectedPhase: 'collecting',
        expectedProgress: '2/3',
        description: '提供品牌理念，应该询问周边类型',
        checkResponse: (r) => r.includes('周边') || r.includes('产品') || r.includes('类型')
      },
      {
        user: '商务文具和包装产品',
        expectedPhase: 'confirming',
        expectedProgress: '3/3',
        description: '提供周边类型，所有信息收集完成，进入确认阶段',
        checkResponse: (r) => r.includes('确认') || r.includes('核对') || r.includes('总结')
      },
      {
        user: '确认',
        expectedPhase: 'executing',
        description: '确认信息，开始执行 Logo 设计',
        checkResponse: (r) => r.includes('开始') || r.includes('执行') || r.includes('生成')
      }
    ]
  },
  {
    id: 'scenario-2',
    name: '场景 2: Logo 设计 - 含"好"字的描述',
    description: '测试消息中包含"好"字但不触发确认',
    conversations: [
      {
        user: '帮我设计一个好看的科技公司 Logo',
        expectedPhase: 'collecting',
        expectedProgress: '0/3',
        description: '包含"好"字的描述，不应该误判为确认',
        checkResponse: (r) => r.includes('品牌名称') || r.includes('品牌') || r.includes('名称')
      }
    ]
  },
  {
    id: 'scenario-3',
    name: '场景 3: Logo 设计 - 信息一次性提供',
    description: '测试一次性提供所有信息，直接进入确认阶段',
    conversations: [
      {
        user: '帮我设计一个 Logo，品牌叫绿野科技，理念是专注环保科技，想要商务文具和包装产品',
        expectedPhase: 'confirming',
        expectedProgress: '3/3',
        description: '一次性提供所有必填信息，应该直接进入确认阶段',
        checkResponse: (r) => r.includes('确认') || r.includes('核对') || r.includes('绿野科技')
      }
    ]
  },
  {
    id: 'scenario-4',
    name: '场景 4: 海报设计 - 缺少必填项',
    description: '测试空消息不推进流程，继续追问',
    conversations: [
      {
        user: '帮我设计一张海报',
        expectedPhase: 'collecting',
        description: '初始消息，应该询问海报目的',
        checkResponse: (r) => r.includes('目的') || r.includes('用途') || r.includes('类型')
      },
      {
        user: '活动宣传',
        expectedPhase: 'collecting',
        description: '提供目的，应该询问主标题',
        checkResponse: (r) => r.includes('标题') || r.includes('主题')
      },
      {
        user: '',
        expectedPhase: 'collecting',
        description: '空消息，不应该推进流程，继续追问标题',
        checkResponse: (r) => r.includes('标题') || r.includes('不能为空') || r.includes('请提供')
      },
      {
        user: '春季新品发布会',
        expectedPhase: 'collecting',
        description: '提供有效标题，继续收集其他信息',
        checkResponse: (r) => r.includes('内容') || r.includes('信息') || r.includes('时间')
      }
    ]
  },
  {
    id: 'scenario-5',
    name: '场景 5: 文案创作 - 修改需求',
    description: '测试确认阶段可以修改已收集的信息',
    conversations: [
      {
        user: '帮我写一段品牌文案，品牌叫绿野科技',
        expectedPhase: 'collecting',
        description: '提供品牌名称，继续收集其他信息',
        checkResponse: (r) => r.includes('定位') || r.includes('理念') || r.includes('价值观')
      },
      {
        user: '定位是环保科技品牌，价值观是创新、环保',
        expectedPhase: 'confirming',
        description: '提供所有信息，进入确认阶段',
        checkResponse: (r) => r.includes('确认') || r.includes('绿野科技')
      },
      {
        user: '品牌名称改一下，叫蓝海科技',
        expectedPhase: 'confirming',
        description: '修改品牌名称，应该更新信息并保持在确认阶段',
        checkResponse: (r) => r.includes('蓝海科技') || r.includes('更新') || r.includes('修改')
      }
    ]
  },
  {
    id: 'scenario-6',
    name: '场景 6: 图片生成 - 快速模式',
    description: '测试简单请求触发快速生成',
    conversations: [
      {
        user: '画一只可爱的猫咪',
        expectedPhase: 'executing',
        description: '简单生成请求，应该直接触发快速生成',
        checkResponse: (r) => r.includes('生成') || r.includes('画') || r.includes('正在')
      }
    ]
  },
  {
    id: 'scenario-7',
    name: '场景 7: 复杂需求 - 普通模式',
    description: '测试复杂需求不走快速模式',
    conversations: [
      {
        user: '我需要做一个完整的品牌设计方案，包括Logo、VI系统和包装设计',
        expectedPhase: 'collecting',
        description: '复杂需求，不应该触发快速模式，进入详细收集',
        checkResponse: (r) => r.includes('品牌') || r.includes('详细') || r.includes('了解')
      }
    ]
  },
  {
    id: 'scenario-8',
    name: '场景 8: 问候和帮助',
    description: '测试问候和帮助意图',
    conversations: [
      {
        user: '你好',
        expectedPhase: 'completed',
        description: '问候语，应该直接返回问候回复',
        checkResponse: (r) => r.includes('你好') || r.includes('您好') || r.includes('帮助')
      },
      {
        user: '你能做什么',
        expectedPhase: 'completed',
        description: '帮助请求，应该返回功能介绍',
        checkResponse: (r) => r.includes('设计') || r.includes('生成') || r.includes('文案') || r.includes('帮助')
      }
    ]
  },
  {
    id: 'scenario-9',
    name: '场景 9: 意图不明确',
    description: '测试低置信度意图的处理',
    conversations: [
      {
        user: '我不知道要做什么',
        expectedPhase: 'collecting',
        description: '意图不明确，应该引导用户',
        checkResponse: (r) => r.includes('帮助') || r.includes('设计') || r.includes('选择') || r.includes('推荐')
      },
      {
        user: '随便',
        expectedPhase: 'collecting',
        description: '模糊的回复，继续引导',
        checkResponse: (r) => r.includes('帮助') || r.includes('建议') || r.includes('推荐')
      }
    ]
  },
  {
    id: 'scenario-10',
    name: '场景 10: 多轮对话上下文保持',
    description: '测试对话上下文的保持',
    conversations: [
      {
        user: '帮我设计一个 Logo',
        expectedPhase: 'collecting',
        description: '开始 Logo 设计对话',
        checkResponse: (r) => r.includes('品牌')
      },
      {
        user: '品牌叫绿野科技',
        expectedPhase: 'collecting',
        description: '提供品牌名称',
        checkResponse: (r) => r.includes('理念') || r.includes('概念')
      },
      {
        user: '刚才说的品牌名称是什么？',
        expectedPhase: 'collecting',
        description: '询问之前的对话内容，应该能记住并回答',
        checkResponse: (r) => r.includes('绿野科技') || r.includes('刚才') || r.includes('之前')
      }
    ]
  }
];

// 模拟对话执行
async function simulateDialogue(testCase: TestCase): Promise<{
  passed: boolean;
  results: { step: number; passed: boolean; error?: string }[];
}> {
  console.log(`\n📋 ${testCase.name}`);
  console.log(`   ${testCase.description}`);
  console.log('─'.repeat(60));

  const results: { step: number; passed: boolean; error?: string }[] = [];
  let allPassed = true;

  for (let i = 0; i < testCase.conversations.length; i++) {
    const step = testCase.conversations[i];
    console.log(`\n  步骤 ${i + 1}/${testCase.conversations.length}:`);
    console.log(`  👤 用户: "${step.user || '(空消息)'}"`);
    console.log(`  📝 预期: ${step.description}`);
    console.log(`  🎯 阶段: ${step.expectedPhase}${step.expectedProgress ? ` (${step.expectedProgress})` : ''}`);

    // 这里应该调用实际的对话处理逻辑
    // 目前只是模拟，实际使用时需要替换为真实的 API 调用
    const simulatedResponse = `[模拟响应] 这是第 ${i + 1} 步的模拟回复`;
    
    console.log(`  🤖 系统: "${simulatedResponse}"`);

    // 验证响应
    let stepPassed = true;
    let error = '';

    if (step.checkResponse && !step.checkResponse(simulatedResponse)) {
      stepPassed = false;
      error = '响应内容不符合预期';
    }

    // 模拟阶段验证（实际使用时需要检查真实的阶段）
    // 这里假设所有步骤都通过
    
    results.push({ step: i + 1, passed: stepPassed, error });
    
    if (!stepPassed) {
      allPassed = false;
      console.log(`  ❌ 失败: ${error}`);
    } else {
      console.log(`  ✅ 通过`);
    }
  }

  return { passed: allPassed, results };
}

// 运行所有测试
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🎭 模拟对话回复测试');
  console.log('='.repeat(60));
  console.log(`\n📊 测试场景数量: ${testCases.length}`);
  console.log('─'.repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  for (const testCase of testCases) {
    try {
      const result = await simulateDialogue(testCase);
      
      if (result.passed) {
        totalPassed++;
      } else {
        totalFailed++;
      }
    } catch (error) {
      console.error(`\n❌ 测试执行错误: ${testCase.name}`, error);
      totalFailed++;
    }
  }

  // 测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结');
  console.log('='.repeat(60));
  console.log(`\n✅ 通过: ${totalPassed}/${testCases.length}`);
  console.log(`❌ 失败: ${totalFailed}/${testCases.length}`);
  
  const passRate = Math.round((totalPassed / testCases.length) * 100);
  console.log(`\n📈 通过率: ${passRate}%`);

  console.log('\n' + '='.repeat(60));
  console.log('📝 测试场景列表');
  console.log('='.repeat(60));
  
  testCases.forEach((tc, index) => {
    console.log(`\n${index + 1}. ${tc.name}`);
    console.log(`   ${tc.description}`);
    console.log(`   对话轮数: ${tc.conversations.length}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('💡 使用说明');
  console.log('='.repeat(60));
  console.log(`
1. 本脚本为模拟测试，目前使用模拟响应
2. 实际测试时需要：
   - 替换 simulateDialogue 中的模拟逻辑为真实 API 调用
   - 集成 useSkillChat hook 进行真实对话测试
   - 或者使用单元测试文件 dialogueSimulation.test.ts

3. 运行单元测试：
   npx vitest run src/pages/skill/chat/services/__tests__/dialogueSimulation.test.ts

4. 关键验证点：
   - 阶段转换是否正确（collecting → confirming → executing）
   - 进度显示是否准确（0/3 → 1/3 → 2/3 → 3/3）
   - 确认词是否只在收集阶段生效
   - 空消息是否不推进流程
`);

  console.log('='.repeat(60));
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});

// 导出测试用例，供其他测试使用
export { testCases };
export type { TestCase, TestStep };
