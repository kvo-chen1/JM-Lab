// AI API代理服务连接状态检查脚本
// 测试本地后端代理服务的健康状态和API端点

import fetch from 'node-fetch';

// 测试配置
const TEST_CONFIG = {
  timeout: 10000, // 单个测试超时时间（毫秒）
  retryCount: 1, // 重试次数
  retryDelay: 1000, // 重试延迟（毫秒）
  // 本地代理服务基础URL
  proxyBaseUrl: process.env.LOCAL_API_BASE_URL || `http://localhost:${process.env.LOCAL_API_PORT || '3020'}`
};

// 支持的API端点配置
const API_ENDPOINTS = [
  {
    id: 'health',
    name: '健康检查',
    path: '/api/health/ping',
    method: 'GET',
    expectedStatus: 200
  },
  {
    id: 'llms-health',
    name: 'LLM健康检查',
    path: '/api/health/llms',
    method: 'GET',
    expectedStatus: 200
  },
  {
    id: 'doubao-chat',
    name: '豆包聊天',
    path: '/api/doubao/chat/completions',
    method: 'POST',
    expectedStatus: 200,
    body: {
      model: 'doubao-seedance-1-0-pro-250528',
      messages: [
        { role: 'user', content: [{ type: 'text', text: '请用一句话介绍你自己' }] }
      ],
      max_tokens: 100
    }
  },
  {
    id: 'kimi-chat',
    name: 'Kimi聊天',
    path: '/api/kimi/chat/completions',
    method: 'POST',
    expectedStatus: 200,
    body: {
      model: 'moonshot-v1-32k',
      messages: [
        { role: 'user', content: '请用一句话介绍你自己' }
      ],
      max_tokens: 100
    }
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek聊天',
    path: '/api/deepseek/chat/completions',
    method: 'POST',
    expectedStatus: 200,
    body: {
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: '请用一句话介绍你自己' }
      ],
      max_tokens: 100
    }
  },
  {
    id: 'qwen-chat',
    name: '通义千问聊天',
    path: '/api/dashscope/chat/completions',
    method: 'POST',
    expectedStatus: 200,
    body: {
      model: 'qwen-plus',
      messages: [
        { role: 'user', content: '请用一句话介绍你自己' }
      ],
      max_tokens: 100
    }
  }
];

// 测试结果类型定义
class TestResult {
  constructor(endpointId, endpointName) {
    this.endpointId = endpointId;
    this.endpointName = endpointName;
    this.tests = [];
    this.summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      averageResponseTime: 0
    };
  }
  
  addTest(name, status, error, responseTime, details) {
    this.tests.push({
      name,
      status,
      error,
      responseTime,
      details
    });
    
    // 更新统计信息
    this.summary.totalTests++;
    if (status === 'pass') {
      this.summary.passedTests++;
    } else {
      this.summary.failedTests++;
    }
    
    if (responseTime) {
      this.summary.averageResponseTime = (
        this.summary.averageResponseTime * (this.summary.totalTests - 1) + responseTime
      ) / this.summary.totalTests;
    }
  }
}

// 测试结果存储
const testResults = [];

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 重试函数
const retry = async (fn, maxRetries, delayMs) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries) {
        throw error;
      }
      console.log(`  重试第 ${i + 1} 次...`);
      await delay(delayMs);
    }
  }
};

// 生成测试结果报告
const generateTestReport = () => {
  console.log('\n=== AI API代理服务连接状态检查报告 ===\n');
  
  // 总体统计
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalResponseTime = 0;
  let testCount = 0;
  
  testResults.forEach(result => {
    totalTests += result.summary.totalTests;
    totalPassed += result.summary.passedTests;
    totalFailed += result.summary.failedTests;
    
    if (result.summary.averageResponseTime > 0) {
      totalResponseTime += result.summary.averageResponseTime;
      testCount++;
    }
    
    console.log(`\nAPI端点: ${result.endpointName} (${result.endpointId})`);
    console.log(`状态: ${result.summary.failedTests === 0 ? '✅ 全部通过' : `❌ 部分失败 (${result.summary.passedTests}/${result.summary.totalTests})`}`);
    console.log(`平均响应时间: ${result.summary.averageResponseTime.toFixed(2)}ms`);
    
    if (result.summary.failedTests > 0) {
      console.log('失败测试:');
      result.tests.filter(test => test.status === 'fail').forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
  });
  
  const overallAverageResponseTime = testCount > 0 ? totalResponseTime / testCount : 0;
  
  console.log('\n=== 总体测试结果 ===');
  console.log(`测试API端点数量: ${testResults.length}`);
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过测试数: ${totalPassed}`);
  console.log(`失败测试数: ${totalFailed}`);
  console.log(`总体平均响应时间: ${overallAverageResponseTime.toFixed(2)}ms`);
  console.log(`总体通过率: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
  
  // 输出JSON格式报告，便于后续处理
  console.log('\n=== JSON格式报告 ===');
  console.log(JSON.stringify(testResults, null, 2));
  
  return testResults;
};

// 检查后端服务是否正在运行
const checkServiceRunning = async () => {
  try {
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);
    
    const url = `${TEST_CONFIG.proxyBaseUrl}/api/health/ping`;
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200) {
      return {
        status: 'pass',
        responseTime,
        details: {
          url,
          status: response.status
        }
      };
    } else {
      throw new Error(`服务器返回错误状态码: ${response.status}`);
    }
  } catch (error) {
    return {
      status: 'fail',
      error: error.message,
      details: {
        error: error.message
      }
    };
  }
};

// 测试API端点
const testApiEndpoint = async (endpoint) => {
  try {
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);
    
    const url = `${TEST_CONFIG.proxyBaseUrl}${endpoint.path}`;
    
    const options = {
      method: endpoint.method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // 添加请求体（如果是POST请求）
    if (endpoint.method === 'POST' && endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    const response = await fetch(url, options);
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    // 解析响应
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // 检查响应状态码
    if (response.status === endpoint.expectedStatus) {
      return {
        status: 'pass',
        responseTime,
        details: {
          url,
          method: endpoint.method,
          status: response.status,
          response: data
        }
      };
    } else {
      throw new Error(`API端点返回错误状态码: ${response.status}, 预期: ${endpoint.expectedStatus}`);
    }
  } catch (error) {
    return {
      status: 'fail',
      error: error.message,
      details: {
        error: error.message
      }
    };
  }
};

// 测试单个API端点
const testEndpoint = async (endpoint) => {
  const result = new TestResult(endpoint.id, endpoint.name);
  
  console.log(`测试API端点: ${endpoint.name} (${endpoint.id})...`);
  
  // 1. 测试API端点
  console.log(`  - API端点测试...`);
  const apiResult = await retry(async () => {
    return await testApiEndpoint(endpoint);
  }, TEST_CONFIG.retryCount, TEST_CONFIG.retryDelay);
  result.addTest('API端点测试', apiResult.status, apiResult.error, apiResult.responseTime, apiResult.details);
  
  if (apiResult.status === 'fail') {
    console.log(`    ❌ 失败: ${apiResult.error}`);
  } else {
    console.log('    ✅ 通过');
  }
  
  return result;
};

// 主测试函数
const runTests = async () => {
  console.log('开始AI API代理服务连接状态检查...\n');
  
  // 1. 检查后端服务是否正在运行
  console.log('检查后端服务是否正在运行...');
  const serviceResult = await checkServiceRunning();
  if (serviceResult.status === 'fail') {
    console.log(`❌ 后端服务未运行: ${serviceResult.error}`);
    console.log('请先启动后端服务: pnpm dev:server');
    process.exit(1);
  }
  console.log('✅ 后端服务正在运行\n');
  
  // 2. 测试所有API端点
  for (const endpoint of API_ENDPOINTS) {
    const endpointResult = await testEndpoint(endpoint);
    testResults.push(endpointResult);
    
    // 输出端点测试结果
    console.log(`${endpoint.name}测试完成: ${endpointResult.summary.failedTests === 0 ? '✅ 全部通过' : `❌ ${endpointResult.summary.failedTests}个测试失败`}\n`);
  }
  
  // 3. 生成最终测试报告
  generateTestReport();
};

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
