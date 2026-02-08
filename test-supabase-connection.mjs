// 测试 Supabase 连接
import { createClient } from '@supabase/supabase-js';
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

console.log('========================================');
console.log('Supabase 连接测试');
console.log('========================================\n');

console.log('📋 配置信息:');
console.log('  URL:', SUPABASE_URL);
console.log('  Anon Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : '未设置');
console.log();

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔍 开始测试连接...\n');

  const results = {
    auth: false,
    users: false,
    posts: false,
    communities: false,
    storage: false
  };

  // 1. 测试基本连接
  console.log('1️⃣ 测试基本连接 (auth.getSession)...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('   ❌ 失败:', error.message);
    } else {
      console.log('   ✅ 成功');
      results.auth = true;
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 2. 测试 users 表
  console.log('\n2️⃣ 测试 users 表查询...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('   ❌ 失败:', error.message);
      if (error.code) console.log('   错误码:', error.code);
    } else {
      console.log('   ✅ 成功');
      console.log('   用户数量:', data.length);
      if (data.length > 0) {
        console.log('   第一条用户:', { id: data[0].id, username: data[0].username, email: data[0].email });
      }
      results.users = true;
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 3. 测试 posts 表
  console.log('\n3️⃣ 测试 posts 表查询...');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('   ❌ 失败:', error.message);
      if (error.code) console.log('   错误码:', error.code);
    } else {
      console.log('   ✅ 成功');
      console.log('   帖子数量:', data.length);
      if (data.length > 0) {
        console.log('   第一条帖子:', { id: data[0].id, title: data[0].title, author_id: data[0].author_id });
      }
      results.posts = true;
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 4. 测试 communities 表
  console.log('\n4️⃣ 测试 communities 表查询...');
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('   ❌ 失败:', error.message);
      if (error.code) console.log('   错误码:', error.code);
    } else {
      console.log('   ✅ 成功');
      console.log('   社区数量:', data.length);
      if (data.length > 0) {
        console.log('   第一个社区:', { id: data[0].id, name: data[0].name });
      }
      results.communities = true;
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 5. 测试 Storage
  console.log('\n5️⃣ 测试 Storage 功能...');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('   ❌ 失败:', error.message);
    } else {
      console.log('   ✅ 成功');
      console.log('   Storage Buckets:', data.map(b => b.name).join(', ') || '无');
      results.storage = true;
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 总结
  console.log('\n========================================');
  console.log('测试结果总结');
  console.log('========================================');
  const passed = Object.values(results).filter(v => v).length;
  const total = Object.keys(results).length;
  console.log(`✅ 通过: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 所有测试通过！Supabase 连接正常。');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查配置。');
    console.log('失败项:', Object.entries(results).filter(([k, v]) => !v).map(([k]) => k).join(', '));
  }
}

testConnection();
