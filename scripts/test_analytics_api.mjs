/**
 * 测试数据分析 API 是否正确返回 count 字段
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const API_BASE = 'http://localhost:3022';

async function testAPI() {
  console.log('测试数据分析 API...\n');

  // 1. 先登录获取 token
  console.log('1. 登录获取管理员 token...');
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.error('登录失败:', loginData);
    return;
  }
  const token = loginData.token;
  console.log('✓ 登录成功，获取到 token\n');

  // 2. 测试设备分布 API
  console.log('2. 测试设备分布 API...');
  const deviceRes = await fetch(`${API_BASE}/api/admin/analytics/devices`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deviceData = await deviceRes.json();
  console.log('设备分布响应:', JSON.stringify(deviceData, null, 2));

  // 3. 测试流量来源 API
  console.log('\n3. 测试流量来源 API...');
  const sourceRes = await fetch(`${API_BASE}/api/admin/analytics/sources`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const sourceData = await sourceRes.json();
  console.log('流量来源响应:', JSON.stringify(sourceData, null, 2));

  // 4. 验证 count 字段
  console.log('\n4. 验证 count 字段...');
  if (deviceData.data && deviceData.data.length > 0) {
    const hasCount = deviceData.data.every(item => typeof item.count !== 'undefined');
    console.log(`设备分布 count 字段: ${hasCount ? '✓ 存在' : '✗ 缺失'}`);
    deviceData.data.forEach(item => {
      console.log(`  - ${item.name}: ${item.count || 0}人 (${item.value}%)`);
    });
  }

  if (sourceData.data && sourceData.data.length > 0) {
    const hasCount = sourceData.data.every(item => typeof item.count !== 'undefined');
    console.log(`\n流量来源 count 字段: ${hasCount ? '✓ 存在' : '✗ 缺失'}`);
    sourceData.data.forEach(item => {
      console.log(`  - ${item.name}: ${item.count || 0}人 (${item.value}%)`);
    });
  }
}

testAPI().catch(console.error);
