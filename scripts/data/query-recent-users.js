import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 查询最近用户数据');
console.log('Supabase URL:', supabaseUrl);
console.log('Key类型:', supabaseKey.startsWith('sb_publishable_') ? 'Publishable Key' : 'Anon Key');

// 检查配置是否完整
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase配置，请检查.env文件');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 查询最近用户数据
async function getRecentUsers() {
  try {
    console.log('\n📊 查询最近10位用户...');
    
    // 1. 首先尝试查询auth.users表（Supabase认证系统表）
    console.log('\n1️⃣ 尝试查询auth.users表（Supabase认证系统）...');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at, last_sign_in_at, raw_user_meta_data')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (authError) {
      console.error('❌ auth.users表查询失败:', authError.message);
      console.error('详细错误:', authError);
    } else {
      console.log('✅ 从auth.users表获取到数据:');
      console.log('📋 用户数量:', authUsers.length);
      if (authUsers.length > 0) {
        authUsers.forEach((user, index) => {
          const username = user.raw_user_meta_data?.username || '未设置';
          console.log(`${index + 1}. ID: ${user.id.substring(0, 8)}... | 用户名: ${username} | 邮箱: ${user.email} | 创建时间: ${new Date(user.created_at).toLocaleString()} | 最后登录: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '未登录'}`);
        });
      } else {
        console.log('⚠️  auth.users表中没有数据');
      }
    }
    
    // 2. 然后尝试查询public.users表（自定义用户表）
    console.log('\n2️⃣ 尝试查询public.users表（自定义用户表）...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (publicError) {
      console.error('❌ public.users表查询失败:', publicError.message);
      console.error('详细错误:', publicError);
    } else {
      console.log('✅ 从public.users表获取到数据:');
      console.log('📋 用户数量:', publicUsers.length);
      if (publicUsers.length > 0) {
        publicUsers.forEach((user, index) => {
          console.log(`${index + 1}. ID: ${user.id.substring(0, 8)}... | 用户名: ${user.username} | 邮箱: ${user.email} | 角色: ${user.role} | 状态: ${user.is_active ? '活跃' : '禁用'} | 创建时间: ${new Date(user.created_at).toLocaleString()}`);
        });
      } else {
        console.log('⚠️  public.users表中没有数据');
      }
    }
    
    // 3. 检查是否有其他用户相关表
    console.log('\n3️⃣ 尝试查询可能存在的其他用户表...');
    
    // 检查是否有profiles表（Supabase常见的用户资料表）
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (profilesError) {
      console.log('ℹ️  profiles表不存在或查询失败:', profilesError.message);
    } else {
      console.log('✅ 从profiles表获取到数据:');
      console.log('📋 资料数量:', profiles.length);
    }
    
    // 4. 总结
    console.log('\n📊 查询总结:');
    console.log('   - auth.users表用户数:', authUsers?.length || 0);
    console.log('   - public.users表用户数:', publicUsers?.length || 0);
    console.log('   - profiles表用户数:', profiles?.length || 0);
    
    const totalUsers = (authUsers?.length || 0) + (publicUsers?.length || 0);
    console.log(`\n📈 总共发现 ${totalUsers} 位用户`);
    
    return { authUsers, publicUsers, profiles };
  } catch (err) {
    console.error('❌ 执行异常:', err.message);
    console.error('详细错误:', err);
    console.error('错误堆栈:', err.stack);
  }
}

// 执行查询
getRecentUsers().then(() => {
  console.log('\n🔚 查询完成');
  process.exit(0);
});
