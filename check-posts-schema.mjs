// 检查 posts 表结构
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
const SUPABASE_SERVICE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('检查 Posts 表结构');
console.log('========================================\n');

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkPostsSchema() {
  try {
    // 查询 posts 表的一条记录
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ 查询失败:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ posts 表字段结构:\n');
      const post = data[0];
      Object.keys(post).forEach(key => {
        const value = post[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`  ${key}: ${type}`);
      });
      
      // 检查是否有 likes_count 字段
      if ('likes_count' in post) {
        console.log('\n✅ likes_count 字段存在');
      } else {
        console.log('\n❌ likes_count 字段不存在，需要添加');
      }
    } else {
      console.log('⚠️ posts 表中没有数据，无法查看字段结构');
    }

  } catch (error) {
    console.error('❌ 查询异常:', error.message);
  }
}

checkPostsSchema();
