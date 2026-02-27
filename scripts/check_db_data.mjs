/**
 * 检查数据库中的设备分布和流量来源数据
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

async function checkData() {
  console.log('检查数据库中的数据...\n');

  // 1. 检查 user_devices 表
  console.log('1. user_devices 表数据:');
  const { data: devices, error: deviceError } = await supabase
    .from('user_devices')
    .select('*');

  if (deviceError) {
    console.error('查询设备数据失败:', deviceError);
  } else {
    console.log(`   总记录数: ${devices?.length || 0}`);
    
    // 统计各设备类型数量
    const deviceCounts = {};
    devices?.forEach(d => {
      const type = d.device_type || 'unknown';
      deviceCounts[type] = (deviceCounts[type] || 0) + 1;
    });
    
    console.log('   设备类型分布:');
    Object.entries(deviceCounts).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}人`);
    });
  }

  // 2. 检查 traffic_sources 表
  console.log('\n2. traffic_sources 表数据:');
  const { data: sources, error: sourceError } = await supabase
    .from('traffic_sources')
    .select('*');

  if (sourceError) {
    console.error('查询流量来源失败:', sourceError);
  } else {
    console.log(`   总记录数: ${sources?.length || 0}`);
    
    // 统计各来源类型数量
    const sourceCounts = {};
    sources?.forEach(s => {
      const type = s.source_type || 'unknown';
      sourceCounts[type] = (sourceCounts[type] || 0) + 1;
    });
    
    console.log('   来源类型分布:');
    Object.entries(sourceCounts).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}人`);
    });
  }

  // 3. 检查 users 表总数
  console.log('\n3. users 表数据:');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id');

  if (userError) {
    console.error('查询用户失败:', userError);
  } else {
    console.log(`   总用户数: ${users?.length || 0}`);
  }

  console.log('\n--- 总结 ---');
  console.log(`设备数据: ${devices?.length || 0} 条记录`);
  console.log(`来源数据: ${sources?.length || 0} 条记录`);
  console.log(`用户总数: ${users?.length || 0} 人`);
}

checkData().catch(console.error);
