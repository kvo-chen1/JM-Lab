// 检查 Supabase 连接状态
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envConfig.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('Supabase 连接状态检查');
console.log('========================================\n');

console.log('📋 配置信息:');
console.log('  URL:', SUPABASE_URL);
console.log('  Anon Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : '未设置');
console.log('  Service Key:', SUPABASE_SERVICE_KEY ? `${SUPABASE_SERVICE_KEY.substring(0, 20)}...` : '未设置');
console.log();

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConnection() {
  console.log('🔍 开始检查连接...\n');

  // 1. 测试基本连接
  console.log('1️⃣ 测试基本连接 (auth.getSession)...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('   ❌ 失败:', error.message);
    } else {
      console.log('   ✅ 成功');
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 2. 测试数据库查询
  console.log('\n2️⃣ 测试数据库查询 (users 表)...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ 失败:', error.message);
      if (error.code) console.log('   错误码:', error.code);
    } else {
      console.log('   ✅ 成功');
      console.log('   用户数量:', data);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 3. 测试 posts 表
  console.log('\n3️⃣ 测试 posts 表查询...');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ 失败:', error.message);
      if (error.code) console.log('   错误码:', error.code);
    } else {
      console.log('   ✅ 成功');
      console.log('   帖子数量:', data);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 4. 测试 communities 表
  console.log('\n4️⃣ 测试 communities 表查询...');
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ 失败:', error.message);
      if (error.code) console.log('   错误码:', error.code);
    } else {
      console.log('   ✅ 成功');
      console.log('   社区数量:', data);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 5. 测试 Realtime 功能
  console.log('\n5️⃣ 测试 Realtime 功能...');
  try {
    const channel = supabase.channel('test-channel');
    console.log('   ✅ Realtime 通道创建成功');
    
    const subscription = channel.subscribe((status) => {
      console.log('   Realtime 订阅状态:', status);
    });
    
    // 5秒后取消订阅
    setTimeout(() => {
      subscription.unsubscribe();
      console.log('   ✅ Realtime 测试完成');
    }, 5000);
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 6. 测试 Storage
  console.log('\n6️⃣ 测试 Storage 功能...');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('   ❌ 失败:', error.message);
    } else {
      console.log('   ✅ 成功');
      console.log('   Storage Buckets:', data.map(b => b.name).join(', ') || '无');
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  console.log('\n========================================');
  console.log('检查完成');
  console.log('========================================');
}

checkConnection();
