import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从 .env.local 读取配置
const envLocalPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = '';
let supabaseServiceKey = '';

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim();
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 模拟前端的 likePost 函数
async function likePost(id, userId) {
  console.log('[likePost] Called with:', { id, userId });
  
  if (!userId || userId === 'anonymous') {
    console.warn('[likePost] No valid userId');
    return undefined;
  }

  // 首先尝试使用后端 API
  console.log('[likePost] Trying backend API...');
  // 模拟 API 调用失败（404）
  console.log('[likePost] Backend API failed: 404');

  // 如果后端 API 不可用，尝试使用 Supabase
  console.log('[likePost] Trying Supabase...');
  
  // 1. 首先尝试插入到 works_likes 表（广场作品）
  console.log('[likePost] Trying works_likes table...');
  const { error: worksLikeError } = await supabase
    .from('works_likes')
    .insert({ 
      user_id: userId, 
      work_id: id,
      created_at: new Date().toISOString()
    });
  
  if (!worksLikeError || worksLikeError.code === '23505') {
    console.log('[likePost] works_likes success');
    return { id, isLiked: true, likes: 0 };
  }
  
  console.log('[likePost] works_likes failed:', worksLikeError);
  
  // 2. 如果 works_likes 失败，尝试 likes 表（社区帖子）
  console.log('[likePost] Trying likes table for post...');
  const { error: postLikeError } = await supabase
    .from('likes')
    .insert({ 
      user_id: userId, 
      post_id: id,
      created_at: new Date().toISOString()
    });
  
  if (postLikeError && postLikeError.code !== '23505') {
    console.error('[likePost] Supabase error:', postLikeError);
    return undefined;
  }

  console.log('[likePost] Supabase success');
  return { id, isLiked: true, likes: 0 };
}

async function testFrontendLike() {
  console.log('Testing frontend-like functionality...\n');
  
  // 使用一个测试用户ID（UUID格式）
  const testUserId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429'; // 从 bookmarks 表中获取的真实用户ID
  // 使用一个测试作品ID（UUID格式）
  const testWorkId = 'd265d441-1910-4b87-a005-ccd6557b4775'; // 从 works 表中获取的真实作品ID
  
  console.log('Test User ID:', testUserId);
  console.log('Test Work ID:', testWorkId);
  console.log('');
  
  // 调用模拟的 likePost 函数
  const result = await likePost(testWorkId, testUserId);
  console.log('\nResult:', result);
  
  // 验证数据是否写入
  console.log('\nVerifying data...');
  const { data: likes, error } = await supabase
    .from('works_likes')
    .select('*')
    .eq('user_id', testUserId)
    .eq('work_id', testWorkId);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Data in works_likes:', likes);
  }
  
  // 清理测试数据
  console.log('\nCleaning up...');
  await supabase
    .from('works_likes')
    .delete()
    .eq('user_id', testUserId)
    .eq('work_id', testWorkId);
  console.log('Test data cleaned up');
  
  console.log('\n✓ Test complete!');
}

testFrontendLike();
