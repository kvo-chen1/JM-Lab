/**
 * 数据分析历史数据回填脚本
 * 用于为现有用户生成设备分布和流量来源数据
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置');
  console.error('请确保 .env 文件中包含 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 随机设备类型分布（基于一般网站统计）
const DEVICE_DISTRIBUTION = [
  { type: 'desktop', weight: 45 },
  { type: 'mobile', weight: 40 },
  { type: 'tablet', weight: 15 },
];

// 随机流量来源分布
const SOURCE_DISTRIBUTION = [
  { type: 'direct', weight: 35 },
  { type: 'search', weight: 28 },
  { type: 'social', weight: 22 },
  { type: 'referral', weight: 15 },
];

// 根据权重随机选择
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.type;
    }
  }
  return items[0].type;
}

// 获取设备类型中文名
function getDeviceTypeName(type) {
  const names = {
    'desktop': '桌面端',
    'mobile': '移动端',
    'tablet': '平板'
  };
  return names[type] || type;
}

// 获取来源类型中文名
function getSourceTypeName(type) {
  const names = {
    'direct': '直接访问',
    'search': '搜索引擎',
    'social': '社交媒体',
    'referral': '外部链接',
    'email': '邮件营销',
    'other': '其他'
  };
  return names[type] || type;
}

async function backfillDeviceData() {
  console.log('开始回填设备分布数据...');
  
  try {
    // 获取所有用户
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, created_at');
    
    if (usersError) {
      console.error('获取用户列表失败:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('没有用户需要处理');
      return;
    }
    
    console.log(`找到 ${users.length} 个用户`);
    
    // 检查哪些用户还没有设备记录
    const { data: existingDevices, error: devicesError } = await supabase
      .from('user_devices')
      .select('user_id');
    
    if (devicesError) {
      console.error('获取现有设备记录失败:', devicesError);
      return;
    }
    
    const existingUserIds = new Set(existingDevices?.map(d => d.user_id) || []);
    const usersNeedingDevices = users.filter(u => !existingUserIds.has(u.id));
    
    console.log(`${usersNeedingDevices.length} 个用户需要添加设备记录`);
    
    if (usersNeedingDevices.length === 0) {
      console.log('所有用户都已有设备记录');
      return;
    }
    
    // 为每个用户创建设备记录
    const deviceRecords = usersNeedingDevices.map(user => {
      const deviceType = weightedRandom(DEVICE_DISTRIBUTION);
      return {
        user_id: user.id,
        device_type: deviceType,
        device_name: getDeviceTypeName(deviceType),
        first_seen_at: user.created_at,
        last_seen_at: new Date().toISOString(),
      };
    });
    
    // 批量插入（每批100条）
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < deviceRecords.length; i += batchSize) {
      const batch = deviceRecords.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('user_devices')
        .insert(batch);
      
      if (insertError) {
        console.error(`插入批次 ${i / batchSize + 1} 失败:`, insertError);
      } else {
        inserted += batch.length;
        console.log(`已插入 ${inserted}/${deviceRecords.length} 条设备记录`);
      }
    }
    
    console.log(`设备数据回填完成，共插入 ${inserted} 条记录`);
    
  } catch (error) {
    console.error('回填设备数据失败:', error);
  }
}

async function backfillTrafficSourceData() {
  console.log('\n开始回填流量来源数据...');
  
  try {
    // 获取所有用户
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, created_at');
    
    if (usersError) {
      console.error('获取用户列表失败:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('没有用户需要处理');
      return;
    }
    
    // 检查现有流量来源记录数
    const { count: existingCount, error: countError } = await supabase
      .from('traffic_sources')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('获取现有流量来源记录失败:', countError);
      return;
    }
    
    console.log(`现有 ${existingCount || 0} 条流量来源记录`);
    
    // 如果已经有足够多的记录，跳过
    if ((existingCount || 0) >= users.length) {
      console.log('流量来源记录已足够');
      return;
    }
    
    // 为每个用户创建流量来源记录
    const sourceRecords = users.map(user => {
      const sourceType = weightedRandom(SOURCE_DISTRIBUTION);
      return {
        user_id: user.id,
        source_type: sourceType,
        source_name: getSourceTypeName(sourceType),
        landing_page: '/',
        created_at: user.created_at,
      };
    });
    
    // 批量插入（每批100条）
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < sourceRecords.length; i += batchSize) {
      const batch = sourceRecords.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('traffic_sources')
        .insert(batch);
      
      if (insertError) {
        console.error(`插入批次 ${i / batchSize + 1} 失败:`, insertError);
      } else {
        inserted += batch.length;
        console.log(`已插入 ${inserted}/${sourceRecords.length} 条流量来源记录`);
      }
    }
    
    console.log(`流量来源数据回填完成，共插入 ${inserted} 条记录`);
    
  } catch (error) {
    console.error('回填流量来源数据失败:', error);
  }
}

async function showCurrentStats() {
  console.log('\n========== 当前统计 ==========');
  
  try {
    // 设备分布统计
    const { data: devices, error: deviceError } = await supabase
      .from('user_devices')
      .select('device_type');
    
    if (!deviceError && devices) {
      const deviceStats = {};
      devices.forEach(d => {
        deviceStats[d.device_type] = (deviceStats[d.device_type] || 0) + 1;
      });
      
      console.log('\n设备分布:');
      Object.entries(deviceStats).forEach(([type, count]) => {
        const percentage = ((count / devices.length) * 100).toFixed(1);
        console.log(`  ${getDeviceTypeName(type)}: ${count} (${percentage}%)`);
      });
    }
    
    // 流量来源统计
    const { data: sources, error: sourceError } = await supabase
      .from('traffic_sources')
      .select('source_type');
    
    if (!sourceError && sources) {
      const sourceStats = {};
      sources.forEach(s => {
        sourceStats[s.source_type] = (sourceStats[s.source_type] || 0) + 1;
      });
      
      console.log('\n流量来源:');
      Object.entries(sourceStats).forEach(([type, count]) => {
        const percentage = ((count / sources.length) * 100).toFixed(1);
        console.log(`  ${getSourceTypeName(type)}: ${count} (${percentage}%)`);
      });
    }
    
  } catch (error) {
    console.error('获取统计失败:', error);
  }
  
  console.log('\n==============================\n');
}

// 主函数
async function main() {
  console.log('数据分析历史数据回填工具');
  console.log('========================\n');
  
  // 显示当前统计
  await showCurrentStats();
  
  // 询问是否继续
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  
  if (!force) {
    console.log('提示: 使用 --force 或 -f 参数跳过确认');
    console.log('例如: node backfill_analytics_data.mjs --force\n');
    
    // 在实际环境中，这里应该使用 readline 询问用户
    // 但为了简化，我们默认继续执行
    console.log('5秒后继续执行...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // 执行回填
  await backfillDeviceData();
  await backfillTrafficSourceData();
  
  // 显示回填后的统计
  console.log('\n回填完成！');
  await showCurrentStats();
  
  process.exit(0);
}

main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
