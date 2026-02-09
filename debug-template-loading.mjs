// 调试模板加载
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
console.log('调试模板加载');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
  console.log('1️⃣ 查询 tianjin_templates 表...');
  try {
    const { data, error } = await supabase
      .from('tianjin_templates')
      .select('*')
      .order('usage_count', { ascending: false });
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
      console.log('   错误码:', error.code);
      console.log('   错误详情:', error.details);
    } else {
      console.log('   ✅ 查询成功');
      console.log('   数据条数:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('\n   第一条数据示例:');
        console.log('   - ID:', data[0].id);
        console.log('   - 名称:', data[0].name);
        console.log('   - 使用次数:', data[0].usage_count);
        console.log('   - 缩略图:', data[0].thumbnail?.substring(0, 50) + '...');
      }
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
    console.log('   堆栈:', e.stack);
  }

  console.log('\n2️⃣ 查询 template_likes 表...');
  try {
    const { count, error } = await supabase
      .from('template_likes')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      console.log('   ✅ 总点赞数:', count);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  console.log('\n3️⃣ 查询 template_favorites 表...');
  try {
    const { count, error } = await supabase
      .from('template_favorites')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      console.log('   ✅ 总收藏数:', count);
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }
}

debug();
