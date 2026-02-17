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

async function testLikeAndBookmark() {
  console.log('Testing like and bookmark functionality...\n');
  
  // 使用一个测试用户ID（需要是有效的UUID）
  const testUserId = '550e8400-e29b-41d4-a716-446655440001';
  // 使用一个测试作品ID（UUID格式，如截图中的）
  const testWorkId = '88f4150c-c72a-462a-bbef-a18c683ce299';
  
  console.log('Test User ID:', testUserId);
  console.log('Test Work ID:', testWorkId);
  console.log('');
  
  // 1. 测试点赞功能
  console.log('1. Testing LIKE functionality...');
  console.log('   a. Inserting into works_likes...');
  
  const { data: likeData, error: likeError } = await supabase
    .from('works_likes')
    .insert({
      user_id: testUserId,
      work_id: testWorkId,
      created_at: new Date().toISOString()
    })
    .select();
  
  if (likeError) {
    console.error('   ❌ Error:', likeError.message);
    console.error('   Code:', likeError.code);
    console.error('   Details:', likeError.details);
  } else {
    console.log('   ✅ Like inserted successfully!');
    console.log('   Data:', likeData);
  }
  
  // 2. 测试收藏功能
  console.log('\n2. Testing BOOKMARK functionality...');
  console.log('   a. Inserting into works_bookmarks...');
  
  const { data: bookmarkData, error: bookmarkError } = await supabase
    .from('works_bookmarks')
    .insert({
      user_id: testUserId,
      work_id: testWorkId,
      created_at: new Date().toISOString()
    })
    .select();
  
  if (bookmarkError) {
    console.error('   ❌ Error:', bookmarkError.message);
    console.error('   Code:', bookmarkError.code);
    console.error('   Details:', bookmarkError.details);
  } else {
    console.log('   ✅ Bookmark inserted successfully!');
    console.log('   Data:', bookmarkData);
  }
  
  // 3. 查询验证
  console.log('\n3. Verifying data...');
  
  const { data: likes, error: queryLikeError } = await supabase
    .from('works_likes')
    .select('*')
    .eq('user_id', testUserId);
  
  if (queryLikeError) {
    console.error('   ❌ Error querying likes:', queryLikeError.message);
  } else {
    console.log('   ✅ Likes found:', likes.length);
    console.log('   Data:', likes);
  }
  
  const { data: bookmarks, error: queryBookmarkError } = await supabase
    .from('works_bookmarks')
    .select('*')
    .eq('user_id', testUserId);
  
  if (queryBookmarkError) {
    console.error('   ❌ Error querying bookmarks:', queryBookmarkError.message);
  } else {
    console.log('   ✅ Bookmarks found:', bookmarks.length);
    console.log('   Data:', bookmarks);
  }
  
  // 4. 清理测试数据
  console.log('\n4. Cleaning up test data...');
  await supabase.from('works_likes').delete().eq('user_id', testUserId).eq('work_id', testWorkId);
  await supabase.from('works_bookmarks').delete().eq('user_id', testUserId).eq('work_id', testWorkId);
  console.log('   ✅ Test data cleaned up');
  
  console.log('\n✓ Test complete!');
}

testLikeAndBookmark();
