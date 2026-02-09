// 测试收藏和点赞 API
import { readFileSync } from 'fs';

// 加载环境变量
const envLocal = readFileSync('.env.local', 'utf-8');
const envConfig = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envConfig[match[1].trim()] = match[2].trim();
  }
});

const BASE_URL = 'http://localhost:3000';

console.log('========================================');
console.log('测试收藏和点赞 API');
console.log('========================================\n');

async function testAPI() {
  // 测试后端 API 是否可访问
  console.log('1️⃣ 测试后端 API 健康检查...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    console.log('   状态:', response.status);
    if (response.ok) {
      console.log('   ✅ 后端 API 正常');
    } else {
      console.log('   ⚠️ 后端 API 返回非 200 状态码');
    }
  } catch (error) {
    console.log('   ❌ 后端 API 无法访问:', error.message);
    console.log('   请确保后端服务已启动 (pnpm dev:server)');
  }

  // 测试用户收藏 API（无认证）
  console.log('\n2️⃣ 测试 /api/user/bookmarks API...');
  try {
    const response = await fetch(`${BASE_URL}/api/user/bookmarks`);
    console.log('   状态:', response.status);
    if (response.status === 401) {
      console.log('   ✅ API 存在，需要认证（这是正常的）');
    } else if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API 正常，返回数据:', data);
    } else {
      console.log('   ⚠️ API 返回:', await response.text());
    }
  } catch (error) {
    console.log('   ❌ API 请求失败:', error.message);
  }

  // 测试用户点赞 API（无认证）
  console.log('\n3️⃣ 测试 /api/user/likes API...');
  try {
    const response = await fetch(`${BASE_URL}/api/user/likes`);
    console.log('   状态:', response.status);
    if (response.status === 401) {
      console.log('   ✅ API 存在，需要认证（这是正常的）');
    } else if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API 正常，返回数据:', data);
    } else {
      console.log('   ⚠️ API 返回:', await response.text());
    }
  } catch (error) {
    console.log('   ❌ API 请求失败:', error.message);
  }
}

testAPI();
