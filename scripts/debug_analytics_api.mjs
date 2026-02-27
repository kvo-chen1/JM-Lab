/**
 * 调试 API 响应数据
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAPI() {
  console.log('=== 模拟后端 API 逻辑 ===\n');

  // 1. 获取设备分布数据（模拟 API 逻辑）
  console.log('1. 设备分布数据查询:');
  const { data: devices, error: deviceError } = await supabase
    .from('user_devices')
    .select('device_type, user_id');

  if (deviceError) {
    console.error('查询失败:', deviceError);
  } else {
    console.log(`   查询到 ${devices?.length || 0} 条记录`);
    console.log('   原始数据:', devices);
    
    // 统计设备类型分布（使用 Set 去重用户）
    const deviceMap = new Map();
    devices?.forEach(device => {
      const deviceType = device.device_type || 'desktop';
      if (!deviceMap.has(deviceType)) {
        deviceMap.set(deviceType, new Set());
      }
      deviceMap.get(deviceType).add(device.user_id);
    });
    
    console.log('\n   按设备类型统计（去重用户）:');
    const total = devices?.length || 0;
    const distribution = [];
    
    deviceMap.forEach((users, deviceType) => {
      const percentage = total > 0 ? Math.round((users.size / total) * 100) : 0;
      console.log(`   - ${deviceType}: ${users.size}人 (${percentage}%)`);
      distribution.push({
        name: deviceType,
        value: percentage,
        count: users.size
      });
    });
    
    console.log('\n   API 返回数据格式:', JSON.stringify(distribution, null, 2));
  }

  // 2. 获取流量来源数据
  console.log('\n\n2. 流量来源数据查询:');
  const { data: sources, error: sourceError } = await supabase
    .from('traffic_sources')
    .select('source_type');

  if (sourceError) {
    console.error('查询失败:', sourceError);
  } else {
    console.log(`   查询到 ${sources?.length || 0} 条记录`);
    
    // 统计来源类型分布
    const sourceMap = new Map();
    sources?.forEach(source => {
      const sourceType = source.source_type || 'direct';
      const count = sourceMap.get(sourceType) || 0;
      sourceMap.set(sourceType, count + 1);
    });
    
    console.log('\n   按来源类型统计:');
    const total = sources?.length || 0;
    const distribution = [];
    
    sourceMap.forEach((count, sourceType) => {
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      console.log(`   - ${sourceType}: ${count}人 (${percentage}%)`);
      distribution.push({
        name: sourceType,
        value: percentage,
        count: count
      });
    });
    
    console.log('\n   API 返回数据格式:', JSON.stringify(distribution, null, 2));
  }
}

debugAPI().catch(console.error);
