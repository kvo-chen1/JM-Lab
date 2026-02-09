// 检查真实的统计数据
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
const SUPABASE_SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('检查页面右上角统计数据');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStats() {
  // 1. 模板总数
  console.log('📊 模板总数');
  console.log('-'.repeat(50));
  try {
    const { data: templates, error } = await supabase
      .from('tianjin_templates')
      .select('id, name, usage_count');
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      console.log(`   ✅ 模板总数: ${templates.length}`);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 2. 总使用次数
  console.log('\n📊 总使用次数');
  console.log('-'.repeat(50));
  try {
    const { data, error } = await supabase
      .from('tianjin_templates')
      .select('usage_count');
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      const totalUsage = data.reduce((sum, item) => sum + (item.usage_count || 0), 0);
      console.log(`   ✅ 总使用次数: ${totalUsage}`);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 3. 总点赞数
  console.log('\n📊 总点赞数');
  console.log('-'.repeat(50));
  try {
    const { count, error } = await supabase
      .from('template_likes')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      console.log(`   ✅ 总点赞数: ${count || 0}`);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 4. 当前用户收藏数（如果有用户登录）
  console.log('\n📊 当前用户收藏数');
  console.log('-'.repeat(50));
  try {
    // 获取第一个用户作为示例
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    
    if (user) {
      const { count, error } = await supabase
        .from('template_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) {
        console.log('   ❌ 查询失败:', error.message);
      } else {
        console.log(`   ✅ 示例用户收藏数: ${count || 0}`);
      }
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  console.log('\n========================================');
  console.log('页面右上角应该显示:');
  console.log('20+ 模板 | 2663+ 使用 | 0+ 点赞');
  console.log('========================================');
}

checkStats();
