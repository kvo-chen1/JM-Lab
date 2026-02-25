#!/usr/bin/env node
/**
 * Supabase Realtime 详细诊断脚本
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('========================================');
console.log('🔍 Supabase Realtime 详细诊断');
console.log('========================================\n');

console.log('📋 配置信息:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Anon Key: ${supabaseAnonKey ? '已设置 ✓' : '未设置 ✗'}`);
console.log();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// 测试 Realtime 连接
async function testRealtime() {
  console.log('🌐 测试 Realtime 连接...\n');

  return new Promise((resolve) => {
    const channel = supabase.channel('test-diagnostic', {
      config: {
        broadcast: { self: true },
      }
    });

    let statusReceived = false;
    let timeout;

    channel
      .on('system', { event: '*' }, (payload) => {
        console.log('   📡 系统事件:', payload);
      })
      .subscribe((status) => {
        console.log(`   📊 连接状态: ${status}`);
        statusReceived = true;

        if (status === 'SUBSCRIBED') {
          console.log('   ✅ 成功订阅 Realtime');

          // 发送测试消息
          channel.send({
            type: 'broadcast',
            event: 'test',
            payload: { message: 'Hello from diagnostic script' }
          }).then(() => {
            console.log('   📤 测试消息已发送');
          });

          // 3秒后取消订阅
          setTimeout(() => {
            channel.unsubscribe();
            console.log('   🛑 已取消订阅');
            resolve(true);
          }, 3000);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log(`   ❌ Realtime 连接失败: ${status}`);
          resolve(false);
        }
      });

    // 超时处理
    timeout = setTimeout(() => {
      if (!statusReceived) {
        console.log('   ⏱️ 连接超时 (10秒)');
        channel.unsubscribe();
        resolve(false);
      }
    }, 10000);
  });
}

// 检查数据库表的 Realtime 配置
async function checkRealtimeConfig() {
  console.log('\n💾 检查数据库 Realtime 配置...\n');

  try {
    // 检查 replication 配置
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.log('   ⚠️ 无法查询表列表:', error.message);
      return;
    }

    console.log(`   📋 发现 ${tables.length} 个表:`);
    tables.slice(0, 10).forEach(t => {
      console.log(`      - ${t.table_name}`);
    });
    if (tables.length > 10) {
      console.log(`      ... 还有 ${tables.length - 10} 个表`);
    }

  } catch (err) {
    console.log('   ⚠️ 检查失败:', err.message);
  }
}

// 主函数
async function main() {
  await checkRealtimeConfig();
  const realtimeOk = await testRealtime();

  console.log('\n========================================');
  console.log('📊 诊断结果');
  console.log('========================================');

  if (realtimeOk) {
    console.log('✅ Realtime 服务正常工作');
  } else {
    console.log('❌ Realtime 服务存在问题');
    console.log('\n可能的解决方案:');
    console.log('1. 登录 Supabase 控制台: https://app.supabase.com');
    console.log('2. 进入项目设置 -> Database -> Replication');
    console.log('3. 确保 Realtime 功能已启用');
    console.log('4. 检查需要实时更新的表是否已添加到 Realtime 配置中');
    console.log('5. 检查项目配额是否超出限制');
  }
  console.log('========================================');
}

main().catch(err => {
  console.error('诊断过程出错:', err);
  process.exit(1);
});
