#!/usr/bin/env node
/**
 * 测试 RPC 调用
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3023/api/db/rest/v1/rpc';

async function testRpcCall(functionName, params) {
  console.log(`\n🧪 测试 ${functionName}...`);
  
  try {
    const response = await fetch(`${API_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer neon-proxy-key'
      },
      body: JSON.stringify(params)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 调用成功');
      console.log('   返回:', JSON.stringify(data, null, 2).substring(0, 200));
      return true;
    } else {
      console.log('❌ 调用失败');
      console.log('   状态:', response.status);
      console.log('   错误:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ 请求错误:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始测试 RPC 调用...\n');
  
  // 测试 get_user_ip_stats
  await testRpcCall('get_user_ip_stats', {
    p_user_id: 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
  });
  
  // 测试 get_active_promoted_works
  await testRpcCall('get_active_promoted_works', {
    p_limit: 5,
    p_offset: 0
  });
  
  // 测试 get_alert_stats
  await testRpcCall('get_alert_stats', {
    p_start_date: '2024-01-01T00:00:00Z',
    p_end_date: '2024-12-31T23:59:59Z'
  });
  
  console.log('\n✅ 测试完成');
}

main();
