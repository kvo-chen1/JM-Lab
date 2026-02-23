#!/usr/bin/env node
/**
 * Supabase 连接状态检查脚本
 * 用于验证与 Supabase 的连接是否正常
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量或配置文件读取 Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTE1MzIsImV4cCI6MjA4MjA2NzUzMn0.hXdokiVrdl8mc5DNa3SjJtsfJpXmNhfJ3ztfHP6YV8c';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('🔍 Supabase 连接状态检查');
console.log('========================================\n');

// 1. 检查配置
console.log('📋 配置信息:');
console.log(`   Supabase URL: ${supabaseUrl}`);
console.log(`   Anon Key: ${supabaseAnonKey ? '已设置 ✓' : '未设置 ✗'}`);
console.log(`   Service Key: ${supabaseServiceKey ? '已设置 ✓' : '未设置 ✗'}`);
console.log();

// 2. 创建客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// 3. 测试连接
async function testConnection() {
  const results = {
    config: { success: true, message: '配置完整' },
    connection: { success: false, message: '' },
    auth: { success: false, message: '' },
    database: { success: false, message: '' },
    realtime: { success: false, message: '' },
  };

  // 测试基本连接
  try {
    console.log('🌐 测试基本连接...');
    const startTime = Date.now();
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    const duration = Date.now() - startTime;

    if (error) {
      results.connection.success = false;
      results.connection.message = `连接失败: ${error.message}`;
      console.log(`   ❌ 连接失败 (${duration}ms): ${error.message}`);
    } else {
      results.connection.success = true;
      results.connection.message = `连接成功 (${duration}ms)`;
      console.log(`   ✅ 连接成功 (${duration}ms)`);
    }
  } catch (err) {
    results.connection.success = false;
    results.connection.message = `连接异常: ${err.message}`;
    console.log(`   ❌ 连接异常: ${err.message}`);
  }

  // 测试认证服务
  try {
    console.log('\n🔐 测试认证服务...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      results.auth.success = false;
      results.auth.message = `认证服务异常: ${error.message}`;
      console.log(`   ❌ 认证服务异常: ${error.message}`);
    } else {
      results.auth.success = true;
      results.auth.message = '认证服务正常';
      console.log(`   ✅ 认证服务正常`);
    }
  } catch (err) {
    results.auth.success = false;
    results.auth.message = `认证服务异常: ${err.message}`;
    console.log(`   ❌ 认证服务异常: ${err.message}`);
  }

  // 测试数据库查询
  try {
    console.log('\n💾 测试数据库查询...');
    const { data, error } = await supabase
      .from('users')
      .select('id, email, username')
      .limit(1);

    if (error) {
      results.database.success = false;
      results.database.message = `数据库查询失败: ${error.message}`;
      console.log(`   ❌ 数据库查询失败: ${error.message}`);
    } else {
      results.database.success = true;
      results.database.message = `数据库查询成功，返回 ${data.length} 条记录`;
      console.log(`   ✅ 数据库查询成功，返回 ${data.length} 条记录`);
    }
  } catch (err) {
    results.database.success = false;
    results.database.message = `数据库查询异常: ${err.message}`;
    console.log(`   ❌ 数据库查询异常: ${err.message}`);
  }

  // 测试 Realtime
  try {
    console.log('\n⚡ 测试 Realtime 服务...');
    const channel = supabase.channel('test-connection');
    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        results.realtime.success = true;
        results.realtime.message = 'Realtime 服务正常';
        console.log(`   ✅ Realtime 服务正常`);
        subscription.unsubscribe();
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        results.realtime.success = false;
        results.realtime.message = `Realtime 服务异常: ${status}`;
        console.log(`   ❌ Realtime 服务异常: ${status}`);
      }
    });

    // 等待 3 秒后检查状态
    await new Promise(resolve => setTimeout(resolve, 3000));
    if (!results.realtime.success && !results.realtime.message) {
      results.realtime.message = 'Realtime 连接超时';
      console.log(`   ⏱️ Realtime 连接超时`);
    }
  } catch (err) {
    results.realtime.success = false;
    results.realtime.message = `Realtime 服务异常: ${err.message}`;
    console.log(`   ❌ Realtime 服务异常: ${err.message}`);
  }

  // 总结
  console.log('\n========================================');
  console.log('📊 检查结果总结');
  console.log('========================================');

  const allPassed = Object.values(results).every(r => r.success);

  for (const [key, result] of Object.entries(results)) {
    const icon = result.success ? '✅' : '❌';
    const name = {
      config: '配置检查',
      connection: '基本连接',
      auth: '认证服务',
      database: '数据库查询',
      realtime: 'Realtime 服务'
    }[key];
    console.log(`${icon} ${name}: ${result.message}`);
  }

  console.log('\n========================================');
  if (allPassed) {
    console.log('🎉 所有检查通过！Supabase 连接正常');
  } else {
    console.log('⚠️ 部分检查未通过，请查看上方详情');
  }
  console.log('========================================');

  return allPassed;
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('检查过程发生错误:', err);
  process.exit(1);
});
