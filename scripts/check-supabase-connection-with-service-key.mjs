#!/usr/bin/env node
/**
 * Supabase 连接状态检查脚本（包含 Service Key 测试）
 * 用于验证与 Supabase 的连接是否正常，包括管理员权限
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量或配置文件读取 Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTE1MzIsImV4cCI6MjA4MjA2NzUzMn0.hXdokiVrdl8mc5DNa3SjJtsfJpXmNhfJ3ztfHP6YV8c';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

console.log('========================================');
console.log('🔍 Supabase 连接状态检查（完整版）');
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

const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

// 3. 测试连接
async function testConnection() {
  const results = {
    config: { success: true, message: '配置完整' },
    connection: { success: false, message: '' },
    auth: { success: false, message: '' },
    database: { success: false, message: '' },
    adminConnection: { success: false, message: '' },
    adminDatabase: { success: false, message: '' },
  };

  // 测试基本连接（Anon Key）
  try {
    console.log('🌐 测试基本连接（Anon Key）...');
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

  // 测试数据库查询（Anon Key）
  try {
    console.log('\n💾 测试数据库查询（Anon Key）...');
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

  // 测试管理员连接（Service Key）
  if (supabaseAdmin) {
    try {
      console.log('\n👑 测试管理员连接（Service Key）...');
      const startTime = Date.now();
      const { error } = await supabaseAdmin.from('users').select('count', { count: 'exact', head: true });
      const duration = Date.now() - startTime;

      if (error) {
        results.adminConnection.success = false;
        results.adminConnection.message = `管理员连接失败: ${error.message}`;
        console.log(`   ❌ 管理员连接失败 (${duration}ms): ${error.message}`);
      } else {
        results.adminConnection.success = true;
        results.adminConnection.message = `管理员连接成功 (${duration}ms)`;
        console.log(`   ✅ 管理员连接成功 (${duration}ms)`);
      }
    } catch (err) {
      results.adminConnection.success = false;
      results.adminConnection.message = `管理员连接异常: ${err.message}`;
      console.log(`   ❌ 管理员连接异常: ${err.message}`);
    }

    // 测试管理员数据库查询（绕过 RLS）
    try {
      console.log('\n💾 测试管理员数据库查询（绕过 RLS）...');
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, username, created_at')
        .limit(5);

      if (error) {
        results.adminDatabase.success = false;
        results.adminDatabase.message = `管理员查询失败: ${error.message}`;
        console.log(`   ❌ 管理员查询失败: ${error.message}`);
      } else {
        results.adminDatabase.success = true;
        results.adminDatabase.message = `管理员查询成功，返回 ${data.length} 条记录`;
        console.log(`   ✅ 管理员查询成功，返回 ${data.length} 条记录`);
        if (data.length > 0) {
          console.log(`   📄 示例数据:`, JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
        }
      }
    } catch (err) {
      results.adminDatabase.success = false;
      results.adminDatabase.message = `管理员查询异常: ${err.message}`;
      console.log(`   ❌ 管理员查询异常: ${err.message}`);
    }
  } else {
    console.log('\n👑 测试管理员连接（Service Key）...');
    console.log('   ⏭️ 跳过（未设置 Service Key）');
    results.adminConnection.message = '未设置 Service Key';
    results.adminDatabase.message = '未设置 Service Key';
  }

  // 总结
  console.log('\n========================================');
  console.log('📊 检查结果总结');
  console.log('========================================');

  const allPassed = Object.values(results).every(r => r.success);

  for (const [key, result] of Object.entries(results)) {
    const icon = result.success ? '✅' : result.message.includes('未设置') ? '⏭️' : '❌';
    const name = {
      config: '配置检查',
      connection: '基本连接（Anon Key）',
      auth: '认证服务',
      database: '数据库查询（Anon Key）',
      adminConnection: '管理员连接（Service Key）',
      adminDatabase: '管理员查询（绕过 RLS）'
    }[key];
    console.log(`${icon} ${name}: ${result.message}`);
  }

  console.log('\n========================================');
  if (allPassed) {
    console.log('🎉 所有检查通过！Supabase 连接完全正常');
  } else {
    const hasFailures = Object.values(results).some(r => !r.success && !r.message.includes('未设置'));
    if (hasFailures) {
      console.log('⚠️ 部分检查未通过，请查看上方详情');
    } else {
      console.log('🎉 所有检查通过！Supabase 连接正常');
    }
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
