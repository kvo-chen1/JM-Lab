// 检查天津模板真实统计数据
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
console.log('天津模板真实数据统计');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStats() {
  // 1. 查询模板总数
  console.log('📊 查询 tianjin_templates 表...');
  try {
    const { data: templates, error } = await supabase
      .from('tianjin_templates')
      .select('*');
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      console.log('   ✅ 模板总数:', templates.length);
      
      // 统计使用次数
      const totalUsage = templates.reduce((sum, t) => sum + (t.usage_count || 0), 0);
      console.log('   ✅ 总使用次数:', totalUsage);
      
      // 显示所有模板
      console.log('\n   模板列表:');
      templates.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.name} - 使用次数: ${t.usage_count || 0}`);
      });
      
      // 按使用次数排序（热门排行）
      const sortedTemplates = [...templates].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
      console.log('\n   🔥 热门模板排行（按使用次数）:');
      sortedTemplates.slice(0, 5).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.name} - ${t.usage_count || 0} 次使用`);
      });
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 2. 查询用户收藏数据
  console.log('\n📊 查询 template_favorites 表...');
  try {
    const { data: favorites, error } = await supabase
      .from('template_favorites')
      .select('*');
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
      console.log('   错误码:', error.code);
    } else {
      console.log('   ✅ 收藏记录数:', favorites?.length || 0);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 3. 查询模板点赞数据
  console.log('\n📊 查询 template_likes 表...');
  try {
    const { data: likes, error } = await supabase
      .from('template_likes')
      .select('*');
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
      console.log('   错误码:', error.code);
    } else {
      console.log('   ✅ 点赞记录数:', likes?.length || 0);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }
}

checkStats();
