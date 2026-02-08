// 添加 likes_count 字段到 posts 表
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
console.log('添加 likes_count 字段到 posts 表');
console.log('========================================\n');

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function addLikesCountColumn() {
  try {
    // 使用 RPC 执行 SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE posts 
        ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
        
        -- 将现有的 likes 数据复制到 likes_count
        UPDATE posts 
        SET likes_count = COALESCE(likes, 0) 
        WHERE likes_count IS NULL OR likes_count = 0;
      `
    });
    
    if (error) {
      console.log('❌ 添加字段失败:', error.message);
      console.log('\n尝试使用直接 SQL 执行...');
      
      // 尝试另一种方式
      const { error: alterError } = await supabase
        .from('posts')
        .select('*')
        .limit(0);
      
      if (alterError) {
        console.log('❌ 无法访问 posts 表:', alterError.message);
        return;
      }
      
      // 使用 Supabase 的 REST API 执行 SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({
          query: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0'
        })
      });
      
      if (!response.ok) {
        console.log('❌ SQL 执行失败:', await response.text());
      } else {
        console.log('✅ likes_count 字段添加成功');
      }
    } else {
      console.log('✅ likes_count 字段添加成功');
      console.log('✅ 已复制现有 likes 数据到 likes_count');
    }

    // 验证字段是否添加成功
    const { data: posts, error: checkError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.log('❌ 验证失败:', checkError.message);
      return;
    }

    if (posts && posts.length > 0) {
      if ('likes_count' in posts[0]) {
        console.log('\n✅ 验证成功：likes_count 字段已存在');
        console.log('  示例值:', posts[0].likes_count);
      } else {
        console.log('\n❌ 验证失败：likes_count 字段仍然不存在');
      }
    }

  } catch (error) {
    console.error('❌ 操作异常:', error.message);
  }
}

addLikesCountColumn();
