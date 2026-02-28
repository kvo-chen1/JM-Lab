/**
 * 数据分析服务测试脚本
 * 
 * 使用方法:
 * 1. 在浏览器控制台执行此文件内容
 * 2. 或作为单元测试运行
 */

import { analyticsTrackingService } from '../services/analyticsTrackingService';

// 测试配置
const TEST_CONFIG = {
  userId: 'test-user-' + Date.now(),
  workId: 'test-work-' + Date.now(),
  promotedWorkId: 'test-promoted-' + Date.now(),
};

console.log('🧪 开始测试数据分析服务...\n');
console.log('测试用户 ID:', TEST_CONFIG.userId);
console.log('测试作品 ID:', TEST_CONFIG.workId);
console.log('测试推广作品 ID:', TEST_CONFIG.promotedWorkId);
console.log('\n');

// 测试 1: 行为追踪
async function testBehaviorTracking() {
  console.log('📋 测试 1: 行为追踪');
  
  try {
    // 测试浏览
    await analyticsTrackingService.trackBehavior({
      action: 'view_work',
      work_id: TEST_CONFIG.workId,
      metadata: { test: true, duration: 1000 },
    });
    console.log('✅ 浏览追踪成功');

    // 测试点击
    await analyticsTrackingService.trackBehavior({
      action: 'click_work',
      work_id: TEST_CONFIG.workId,
      metadata: { test: true },
    });
    console.log('✅ 点击追踪成功');

    // 测试点赞
    await analyticsTrackingService.trackBehavior({
      action: 'like_work',
      work_id: TEST_CONFIG.workId,
      metadata: { test: true },
    });
    console.log('✅ 点赞追踪成功');

    // 测试推广曝光
    await analyticsTrackingService.trackBehavior({
      action: 'view_promoted',
      promoted_work_id: TEST_CONFIG.promotedWorkId,
      metadata: { test: true },
    });
    console.log('✅ 推广曝光追踪成功');

    // 测试推广点击
    await analyticsTrackingService.trackBehavior({
      action: 'click_promoted',
      promoted_work_id: TEST_CONFIG.promotedWorkId,
      metadata: { test: true },
    });
    console.log('✅ 推广点击追踪成功');

    console.log('✅ 行为追踪测试全部通过\n');
    return true;
  } catch (error) {
    console.error('❌ 行为追踪测试失败:', error);
    return false;
  }
}

// 测试 2: 转化事件追踪
async function testConversionTracking() {
  console.log('📋 测试 2: 转化事件追踪');
  
  try {
    // 测试购买转化
    await analyticsTrackingService.trackConversion({
      promoted_work_id: TEST_CONFIG.promotedWorkId,
      conversion_type: 'purchase',
      conversion_value: 199,
      metadata: { test: true, order_id: 'test-order-123' },
    });
    console.log('✅ 购买转化追踪成功');

    // 测试注册转化
    await analyticsTrackingService.trackConversion({
      promoted_work_id: TEST_CONFIG.promotedWorkId,
      conversion_type: 'signup',
      conversion_value: 0,
      metadata: { test: true },
    });
    console.log('✅ 注册转化追踪成功');

    console.log('✅ 转化事件追踪测试全部通过\n');
    return true;
  } catch (error) {
    console.error('❌ 转化事件追踪测试失败:', error);
    return false;
  }
}

// 测试 3: 统计数据获取
async function testStatsRetrieval() {
  console.log('📋 测试 3: 统计数据获取');
  
  try {
    // 测试时段统计
    console.log('  - 获取时段统计数据...');
    const hourlyStats = await analyticsTrackingService.getHourlyStats(24);
    console.log('  ✅ 时段统计成功，获取到', hourlyStats.length, '条记录');

    // 测试聚合时段统计
    console.log('  - 获取聚合时段统计数据...');
    const aggregateStats = await analyticsTrackingService.getAggregateHourlyStats();
    console.log('  ✅ 聚合时段统计成功，获取到', aggregateStats.length, '条记录');

    // 测试转化漏斗
    console.log('  - 获取转化漏斗数据...');
    const funnel = await analyticsTrackingService.getConversionFunnel();
    console.log('  ✅ 转化漏斗获取成功，共', funnel.length, '层');
    funnel.forEach((stage, index) => {
      console.log(`    ${index + 1}. ${stage.stage}: ${stage.count}人 (${(stage.conversion_rate * 100).toFixed(2)}%)`);
    });

    console.log('✅ 统计数据获取测试全部通过\n');
    return true;
  } catch (error) {
    console.error('❌ 统计数据获取测试失败:', error);
    return false;
  }
}

// 测试 4: 用户分析
async function testUserAnalytics() {
  console.log('📋 测试 4: 用户分析');
  
  try {
    // 测试留存率
    console.log('  - 获取用户留存率...');
    const retention = await analyticsTrackingService.getRetentionRate(3);
    console.log('  ✅ 留存率获取成功，获取到', retention.length, '个月的数据');
    if (retention.length > 0) {
      const latest = retention[0];
      console.log(`    最新月份：${latest.period}`);
      console.log(`    次日留存：${(latest.day1_retention * 100).toFixed(2)}%`);
      console.log(`    7 日留存：${(latest.day7_retention * 100).toFixed(2)}%`);
      console.log(`    30 日留存：${(latest.day30_retention * 100).toFixed(2)}%`);
    }

    // 测试用户画像
    console.log('  - 获取用户画像...');
    const demographics = await analyticsTrackingService.getUserDemographics();
    console.log('  ✅ 用户画像获取成功');
    console.log(`    年龄分组：${demographics.age_groups.length}组`);
    console.log(`    性别分布：${demographics.gender_distribution.length}类`);
    console.log(`    热门城市：${demographics.top_cities.length}个`);

    console.log('✅ 用户分析测试全部通过\n');
    return true;
  } catch (error) {
    console.error('❌ 用户分析测试失败:', error);
    return false;
  }
}

// 测试 5: 热点话题
async function testHotTopics() {
  console.log('📋 测试 5: 热点话题分析');
  
  try {
    console.log('  - 获取热点话题...');
    const topics = await analyticsTrackingService.getHotTopics(5);
    console.log('  ✅ 热点话题获取成功，共', topics.length, '个');
    
    topics.forEach((topic, index) => {
      const trendIcon = topic.trend === 'rising' ? '📈' : topic.trend === 'falling' ? '📉' : '➡️';
      console.log(`    ${index + 1}. ${topic.tag}: ${topic.heat_score.toFixed(0)}分 ${trendIcon} (${topic.growth_rate > 0 ? '+' : ''}${topic.growth_rate.toFixed(2)}%)`);
    });

    console.log('✅ 热点话题测试通过\n');
    return true;
  } catch (error) {
    console.error('❌ 热点话题测试失败:', error);
    return false;
  }
}

// 主测试函数
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('数据分析服务完整测试');
  console.log('='.repeat(60));
  console.log('');

  const results = {
    behaviorTracking: await testBehaviorTracking(),
    conversionTracking: await testConversionTracking(),
    statsRetrieval: await testStatsRetrieval(),
    userAnalytics: await testUserAnalytics(),
    hotTopics: await testHotTopics(),
  };

  console.log('='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  console.log('');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;

  console.log(`✅ 通过：${passed}/${total}`);
  console.log('');

  if (passed === total) {
    console.log('🎉 所有测试通过！数据分析服务运行正常。');
  } else {
    console.log('⚠️  部分测试失败，请检查错误日志。');
  }

  console.log('');
  console.log('下一步:');
  console.log('1. 访问 /admin?tab=advancedAnalytics 查看高级数据大屏');
  console.log('2. 访问 /admin?tab=promotionAnalytics 查看推广效果分析');
  console.log('3. 在关键用户交互点添加行为追踪（参考 docs/behavior-tracking-guide.md）');
  console.log('');
}

// 执行测试
runAllTests().catch(console.error);
