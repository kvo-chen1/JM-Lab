/**
 * 津小脉 Skill 浏览器控制台测试脚本
 *
 * 使用方法：
 * 1. 在浏览器中打开 http://localhost:3006
 * 2. 打开开发者工具 (F12)
 * 3. 切换到 Console 标签
 * 4. 粘贴此脚本并按回车执行
 */

const TestRunner = {
  results: [],

  async run(name, testFn) {
    try {
      const passed = await testFn();
      this.results.push({ name, passed });
      console.log(`${passed ? '✅' : '❌'} ${name}`);
      return passed;
    } catch (error) {
      this.results.push({ name, passed: false, error: error.message });
      console.log(`❌ ${name} - 错误: ${error.message}`);
      return false;
    }
  },

  summary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试结果总结');
    console.log('='.repeat(50));
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`📈 通过率: ${Math.round(passed / this.results.length * 100)}%`);

    if (failed > 0) {
      console.log('\n❌ 失败项:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}${r.error ? ` (${r.error})` : ''}`);
      });
    }
  }
};

async function runAllTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 津小脉 Skill 自动化测试开始');
  console.log('='.repeat(50));

  // ==================== 第一部分：意图识别测试 ====================
  console.log('\n📋 第一部分：意图识别测试');
  console.log('-'.repeat(50));

  // 测试1: 基础图片生成
  await TestRunner.run(
    '1.1 简单图片生成: "画一只橘猫"',
    async () => {
      const result = await window.__skill_intentRecognition?.('画一只橘猫') ||
                    await window.__skillTest?.intentRecognition?.('画一只橘猫');
      console.log('   实际结果:', result);
      return result?.intent === 'image-generation';
    }
  );

  // 测试2: 指代词识别
  await TestRunner.run(
    '1.2 指代词识别: "把这张猫复制一份，换成蓝眼睛"',
    async () => {
      const result = await window.__skillTest?.intentRecognition?.('把这张猫复制一份，换成蓝眼睛');
      console.log('   实际结果:', result);
      return ['image-beautification', 'image-style-transfer', 'image-generation'].includes(result?.intent);
    }
  );

  // 测试3: 复制文案指令
  await TestRunner.run(
    '1.3 复制指令: "把上面这段复制，改成蓝海科技"',
    async () => {
      const result = await window.__skillTest?.intentRecognition?.('把上面这段复制，改成蓝海科技');
      console.log('   实际结果:', result);
      return result?.intent?.includes('copy') || result?.intent === 'text-generation';
    }
  );

  // 测试4: 延伸设计
  await TestRunner.run(
    '1.4 延伸设计: "基于这个Logo设计一张海报"',
    async () => {
      const result = await window.__skillTest?.intentRecognition?.('基于这个Logo设计一张海报');
      console.log('   实际结果:', result);
      return result?.intent === 'poster-design' || result?.intent?.includes('design');
    }
  );

  // 测试5: 引用+新请求
  await TestRunner.run(
    '1.5 引用新请求: "这个不错，帮我生成一套周边产品的效果图"',
    async () => {
      const result = await window.__skillTest?.intentRecognition?.('这个不错，帮我生成一套周边产品的效果图');
      console.log('   实际结果:', result);
      return result?.intent?.includes('generation') || result?.intent?.includes('design');
    }
  );

  // ==================== 第二部分：上下文引用测试 ====================
  console.log('\n📋 第二部分：上下文引用测试');
  console.log('-'.repeat(50));

  await TestRunner.run(
    '2.1 历史消息引用: "再生成一个浅色版本的"',
    async () => {
      const history = [
        { role: 'user', content: '生成一张咖啡店海报' },
        { role: 'assistant', content: '已为您生成咖啡店海报' }
      ];
      const result = await window.__skillTest?.analyzeRequirements?.(
        'image-generation',
        '再生成一个浅色版本的',
        history
      );
      console.log('   实际结果:', result);
      return result?.collectedInfo?.colorTone !== undefined ||
             result?.collectedInfo?.style !== undefined ||
             result?.summary?.includes('浅色');
    }
  );

  // ==================== 第三部分：多Skill联动测试 ====================
  console.log('\n📋 第三部分：多Skill联动测试');
  console.log('-'.repeat(50));

  await TestRunner.run(
    '3.1 VI系统批量: "基于这个Logo生成VI系统"',
    async () => {
      const result = await window.__skillTest?.intentRecognition?.(
        '基于这个Logo生成完整的VI系统，包括名片、信纸、工牌'
      );
      console.log('   实际结果:', result);
      return result?.intent?.includes('design') || result?.intent?.includes('generation');
    }
  );

  await TestRunner.run(
    '3.2 多渠道适配: "把这段文案适配到朋友圈、微博、小红书"',
    async () => {
      const result = await window.__skillTest?.intentRecognition?.(
        '把这段文案适配到朋友圈、微博、小红书三个平台'
      );
      console.log('   实际结果:', result);
      return result?.intent?.includes('social') || result?.intent?.includes('copy');
    }
  );

  await TestRunner.run(
    '3.3 批量物料生成',
    async () => {
      const result = await window.__skillTest?.intentRecognition?.(
        '基于这个产品生成一套营销物料：主视觉海报、详情页主图、社交媒体配图'
      );
      console.log('   实际结果:', result);
      return result?.intent?.includes('generation') || result?.intent?.includes('marketing');
    }
  );

  // ==================== 第四部分：边界测试 ====================
  console.log('\n📋 第四部分：边界测试');
  console.log('-'.repeat(50));

  await TestRunner.run(
    '4.1 极短输入: "画"',
    async () => {
      const result = await window.__skillTest?.intentRecognition?.('画');
      console.log('   实际结果:', result);
      return result?.intent !== 'general' || result?.confidence < 0.5;
    }
  );

  await TestRunner.run(
    '4.2 无上下文指代: "把这张图改成蓝色"',
    async () => {
      const result = await window.__skillTest?.intentRecognition?.('把这张图改成蓝色');
      console.log('   实际结果:', result);
      return ['image-beautification', 'image-style-transfer', 'image-generation'].includes(result?.intent);
    }
  );

  // 打印总结
  TestRunner.summary();

  return TestRunner.results;
}

// 如果页面中有测试接口，直接执行
if (window.__skillTest || window.__skill_intentRecognition) {
  console.log('✅ 检测到 Skill 测试接口，开始执行测试...');
  runAllTests();
} else {
  console.log('❌ 未检测到 Skill 测试接口');
  console.log('\n请确保以下条件:');
  console.log('1. 页面已加载津小脉 Skill 模块');
  console.log('2. 测试接口已挂载到 window.__skillTest');
  console.log('\n或者，你可以手动测试以下关键场景:');
  console.log('---');
  console.log('1. 在 Skill 对话中输入: "画一只橘猫"');
  console.log('2. 然后输入: "把这张猫复制一份，换成蓝眼睛"');
  console.log('3. 观察系统是否能正确识别"这张"指代之前生成的图片');
  console.log('---');
}
