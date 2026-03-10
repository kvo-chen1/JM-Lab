/**
 * 增强服务测试代码
 * 用于验证新创建的优化服务是否正常工作
 */

import { enhancedTaskQueue, TaskStatus } from '../src/pages/create/agent/services/enhancedTaskQueue';
import { networkMonitor } from '../src/pages/create/agent/services/networkMonitor';
import { contextManager } from '../src/pages/create/agent/services/contextManager';
import { resourceManager } from '../src/pages/create/agent/services/resourceManager';
import { agentScheduler } from '../src/pages/create/agent/services/agentScheduler';
import { getMemoryService } from '../src/pages/create/agent/services/memoryService';

// 测试配置
const TEST_CONFIG = {
  verbose: true,
  timeout: 10000
};

// 测试结果
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

// 测试工具函数
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    if (TEST_CONFIG.verbose) {
      console.log(`\n🧪 运行测试: ${name}`);
    }
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    if (TEST_CONFIG.verbose) {
      console.log(`✅ 通过 (${duration}ms)`);
    }
  } catch (error) {
    const duration = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, duration, error: errorMsg });
    console.error(`❌ 失败: ${errorMsg}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ==================== 增强任务队列测试 ====================

async function testEnhancedTaskQueue(): Promise<void> {
  console.log('\n📦 测试增强任务队列服务');

  // 测试1: 添加任务
  await runTest('添加任务到队列', async () => {
    const task = enhancedTaskQueue.addTask('text', '测试任务', {
      priority: 'high',
      callbacks: {
        onComplete: (id, result) => {
          console.log(`  任务 ${id} 完成:`, result);
        }
      }
    });
    assert(task.id !== undefined, '任务应该有ID');
    assert(task.status === 'pending', '新任务状态应为pending');
  });

  // 测试2: 任务状态查询
  await runTest('查询任务状态', async () => {
    const task = enhancedTaskQueue.addTask('text', '查询测试');
    const status = enhancedTaskQueue.getTaskStatus(task.id);
    assert(status !== undefined, '应该能查询到任务状态');
  });

  // 测试3: 取消任务
  await runTest('取消排队中的任务', async () => {
    const task = enhancedTaskQueue.addTask('text', '取消测试', {
      priority: 'low'
    });
    const cancelled = enhancedTaskQueue.cancelTask(task.id);
    assert(cancelled === true, '应该成功取消任务');
    const status = enhancedTaskQueue.getTaskStatus(task.id);
    assert(status === 'cancelled', '任务状态应为cancelled');
  });

  // 测试4: 获取统计
  await runTest('获取队列统计', async () => {
    const stats = enhancedTaskQueue.getStats();
    assert(stats.totalCreated > 0, '应该有创建的任务');
    assert(typeof stats.pending === 'number', '应该有pending统计');
  });

  // 测试5: 清空队列
  await runTest('清空队列', async () => {
    enhancedTaskQueue.clearQueue();
    const stats = enhancedTaskQueue.getStats();
    assert(stats.pending === 0, '清空后pending应为0');
    assert(stats.running === 0, '清空后running应为0');
  });
}

// ==================== 网络监控测试 ====================

async function testNetworkMonitor(): Promise<void> {
  console.log('\n🌐 测试网络监控服务');

  // 测试1: 获取网络状态
  await runTest('获取网络状态', async () => {
    const status = networkMonitor.getStatus();
    assert(['online', 'offline', 'degraded', 'checking'].includes(status), '状态应该有效');
  });

  // 测试2: 网络状态检查
  await runTest('检查网络连接', async () => {
    const isOnline = networkMonitor.isOnline();
    assert(typeof isOnline === 'boolean', 'isOnline应该返回布尔值');
  });

  // 测试3: 网络质量
  await runTest('获取网络质量', async () => {
    const quality = networkMonitor.getQuality();
    // 质量可能为undefined（如果还未检查）
    if (quality) {
      assert(typeof quality.latency === 'number', '延迟应该是数字');
      assert(typeof quality.jitter === 'number', '抖动应该是数字');
    }
  });

  // 测试4: 网络状态事件
  await runTest('网络状态事件监听', async () => {
    let eventFired = false;
    const unsubscribe = networkMonitor.on('status-change', () => {
      eventFired = true;
    });
    
    // 手动触发状态更新
    networkMonitor.checkNetworkStatus();
    
    // 等待事件触发
    await new Promise(resolve => setTimeout(resolve, 100));
    
    unsubscribe();
    // 注意：事件可能不会被触发，取决于当前网络状态是否变化
  });
}

// ==================== 上下文管理测试 ====================

async function testContextManager(): Promise<void> {
  console.log('\n📝 测试上下文管理服务');

  // 测试1: Token估算
  await runTest('估算Token数量', async () => {
    const text = '这是一个测试文本';
    const tokens = contextManager.estimateTokens(text);
    assert(tokens > 0, 'Token数应该大于0');
    assert(typeof tokens === 'number', 'Token数应该是数字');
  });

  // 测试2: 上下文优化
  await runTest('优化上下文', async () => {
    const messages = [
      { id: '1', role: 'system', content: '系统提示', timestamp: Date.now(), type: 'text' },
      { id: '2', role: 'user', content: '用户消息1', timestamp: Date.now(), type: 'text' },
      { id: '3', role: 'assistant', content: '助手回复1', timestamp: Date.now(), type: 'text' },
      { id: '4', role: 'user', content: '用户消息2', timestamp: Date.now(), type: 'text' },
      { id: '5', role: 'assistant', content: '助手回复2', timestamp: Date.now(), type: 'text' }
    ] as any;

    const optimized = contextManager.optimizeContext(messages);
    assert(optimized.messages.length > 0, '优化后应该有消息');
    assert(typeof optimized.totalTokens === 'number', '应该有Token统计');
  });

  // 测试3: 需要优化检查
  await runTest('检查是否需要优化', async () => {
    const shortMessages = [
      { id: '1', role: 'user', content: '短消息', timestamp: Date.now(), type: 'text' }
    ] as any;
    
    const needsOpt = contextManager.needsOptimization(shortMessages);
    assert(needsOpt === false, '短消息不需要优化');
  });

  // 测试4: 上下文统计
  await runTest('获取上下文统计', async () => {
    const messages = [
      { id: '1', role: 'system', content: '系统', timestamp: Date.now(), type: 'text' },
      { id: '2', role: 'user', content: '用户', timestamp: Date.now(), type: 'text' },
      { id: '3', role: 'assistant', content: '助手', timestamp: Date.now(), type: 'text' }
    ] as any;

    const stats = contextManager.getContextStats(messages);
    assert(stats.messageCount === 3, '消息数应该是3');
    assert(stats.systemMessages === 1, '系统消息数应该是1');
    assert(stats.userMessages === 1, '用户消息数应该是1');
    assert(stats.assistantMessages === 1, '助手消息数应该是1');
  });
}

// ==================== 资源管理测试 ====================

async function testResourceManager(): Promise<void> {
  console.log('\n💾 测试资源管理服务');

  // 测试1: 获取资源使用
  await runTest('获取资源使用统计', async () => {
    const usage = resourceManager.getUsage();
    assert(typeof usage.messages === 'number', '消息数应该是数字');
    assert(typeof usage.behaviorRecords === 'number', '行为记录数应该是数字');
    assert(typeof usage.memoryEstimate === 'number', '内存估算应该是数字');
  });

  // 测试2: 资源警告
  await runTest('获取资源警告', async () => {
    const warnings = resourceManager.getWarnings();
    assert(Array.isArray(warnings), '警告应该是数组');
  });

  // 测试3: 资源限制检查
  await runTest('检查资源限制', async () => {
    const isOverLimit = resourceManager.isOverLimit();
    assert(typeof isOverLimit === 'boolean', '应该返回布尔值');
  });

  // 测试4: 强制清理
  await runTest('强制清理资源', async () => {
    resourceManager.forceCleanup();
    // 清理后应该正常运行
    const usage = resourceManager.getUsage();
    assert(usage !== undefined, '清理后应该能获取统计');
  });
}

// ==================== Agent调度器测试 ====================

async function testAgentScheduler(): Promise<void> {
  console.log('\n🤖 测试Agent调度器');

  // 测试1: 获取统计
  await runTest('获取调度器统计', async () => {
    const stats = agentScheduler.getStats();
    assert(typeof stats.totalCreated === 'number', '应该有创建任务统计');
    assert(typeof stats.activeTasks === 'number', '应该有活跃任务统计');
  });

  // 测试2: 网络状态响应
  await runTest('网络状态响应', async () => {
    const status = networkMonitor.getStatus();
    assert(['online', 'offline', 'degraded', 'checking'].includes(status), '状态应该有效');
  });
}

// ==================== MemoryService测试 ====================

async function testMemoryService(): Promise<void> {
  console.log('\n🧠 测试MemoryService行为记录');

  const memoryService = getMemoryService('test-user');

  // 测试1: 记录行为
  await runTest('记录用户行为', async () => {
    const recordId = memoryService.recordBehavior('click', 'test-button', { test: true });
    assert(recordId !== undefined, '应该有记录ID');
    assert(recordId.startsWith('behavior-'), 'ID应该以behavior-开头');
  });

  // 测试2: 获取行为记录
  await runTest('获取行为记录', async () => {
    const records = memoryService.getBehaviorRecords();
    assert(Array.isArray(records), '应该返回数组');
    assert(records.length > 0, '应该有记录');
  });

  // 测试3: 按类型获取
  await runTest('按类型获取行为记录', async () => {
    const clickRecords = memoryService.getBehaviorRecordsByType('click');
    assert(Array.isArray(clickRecords), '应该返回数组');
  });

  // 测试4: 记忆统计
  await runTest('获取记忆统计', async () => {
    const stats = memoryService.getMemoryStats();
    assert(typeof stats.totalBehaviorRecords === 'number', '应该有行为记录统计');
    assert(stats.totalBehaviorRecords > 0, '应该有行为记录');
  });

  // 清理测试数据
  memoryService.clearBehaviorRecords();
}

// ==================== 主测试函数 ====================

async function runAllTests(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     津小脉Agent增强服务测试套件                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  // 运行所有测试
  await testEnhancedTaskQueue();
  await testNetworkMonitor();
  await testContextManager();
  await testResourceManager();
  await testAgentScheduler();
  await testMemoryService();

  const totalDuration = Date.now() - startTime;

  // 输出测试结果摘要
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                   测试结果摘要                         ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n总计: ${results.length} 个测试`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`⏱️  总耗时: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\n失败的测试:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════');

  // 返回测试结果
  return failed === 0 ? Promise.resolve() : Promise.reject(new Error(`${failed} 个测试失败`));
}

// 导出测试函数
export { runAllTests };

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  // 浏览器环境
  (window as any).runAgentTests = runAllTests;
  console.log('测试函数已挂载到 window.runAgentTests()');
}

// Node环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}
