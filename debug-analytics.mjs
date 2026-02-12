#!/usr/bin/env node
/**
 * 调试 Analytics API
 */

const API_BASE = 'http://localhost:3022';

async function debugAnalytics() {
  console.log('🔍 调试 Analytics API...\n');

  try {
    // 测试获取作品数据
    console.log('1️⃣ 测试 GET /api/analytics/metrics');
    const response = await fetch(`${API_BASE}/api/analytics/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metric: 'works',
        timeRange: '30d',
        groupBy: 'day',
        filters: {
          userId: 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'
        }
      })
    });

    console.log('   状态码:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('   响应数据点数:', result.data?.length || 0);
      console.log('   统计数据:', JSON.stringify(result.stats, null, 2));
      console.log('   数据点:', JSON.stringify(result.data?.slice(0, 3), null, 2));
    } else {
      console.log('   错误:', await response.text());
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

debugAnalytics();
