#!/usr/bin/env node
/**
 * 测试社区统计API
 */

const API_BASE = 'http://localhost:3022';
const COMMUNITY_ID = '4000e812-564d-4e7e-8247-dab93b75fac4';

async function testAPI() {
  console.log('🧪 测试社区统计API...\n');

  try {
    // 测试获取社区统计
    console.log('1️⃣ 测试 GET /api/communities/{id}/stats');
    const response = await fetch(`${API_BASE}/api/communities/${COMMUNITY_ID}/stats`);
    
    console.log('   状态码:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('   响应:', JSON.stringify(result, null, 2));
    } else {
      console.log('   错误:', await response.text());
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n⚠️ 请确保后端服务器已启动 (pnpm dev)');
  }
}

testAPI();
