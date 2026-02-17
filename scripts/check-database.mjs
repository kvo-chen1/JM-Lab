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

async function checkDatabase() {
  console.log('Checking database tables and data...\n');
  
  // 1. 检查 works 表的数据
  console.log('1. Checking works table...');
  const { data: works, error: worksError } = await supabase
    .from('works')
    .select('id, title')
    .limit(5);
  
  if (worksError) {
    console.error('   Error:', worksError.message);
  } else {
    console.log('   ✓ works table exists');
    console.log('   Sample data:', works);
    if (works.length > 0) {
      console.log('   ID type:', typeof works[0].id, '- Sample ID:', works[0].id);
    }
  }
  
  // 2. 检查 works_likes 表
  console.log('\n2. Checking works_likes table...');
  const { data: worksLikes, error: worksLikesError } = await supabase
    .from('works_likes')
    .select('*')
    .limit(5);
  
  if (worksLikesError) {
    console.error('   Error:', worksLikesError.message);
  } else {
    console.log('   ✓ works_likes table exists');
    console.log('   Data count:', worksLikes.length);
    if (worksLikes.length > 0) {
      console.log('   Sample data:', worksLikes);
    }
  }
  
  // 3. 检查 works_bookmarks 表
  console.log('\n3. Checking works_bookmarks table...');
  const { data: worksBookmarks, error: worksBookmarksError } = await supabase
    .from('works_bookmarks')
    .select('*')
    .limit(5);
  
  if (worksBookmarksError) {
    console.error('   Error:', worksBookmarksError.message);
  } else {
    console.log('   ✓ works_bookmarks table exists');
    console.log('   Data count:', worksBookmarks.length);
    if (worksBookmarks.length > 0) {
      console.log('   Sample data:', worksBookmarks);
    }
  }
  
  // 4. 检查 likes 表
  console.log('\n4. Checking likes table...');
  const { data: likes, error: likesError } = await supabase
    .from('likes')
    .select('*')
    .limit(5);
  
  if (likesError) {
    console.error('   Error:', likesError.message);
  } else {
    console.log('   ✓ likes table exists');
    console.log('   Data count:', likes.length);
    if (likes.length > 0) {
      console.log('   Sample data:', likes);
    }
  }
  
  // 5. 检查 bookmarks 表
  console.log('\n5. Checking bookmarks table...');
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('*')
    .limit(5);
  
  if (bookmarksError) {
    console.error('   Error:', bookmarksError.message);
  } else {
    console.log('   ✓ bookmarks table exists');
    console.log('   Data count:', bookmarks.length);
    if (bookmarks.length > 0) {
      console.log('   Sample data:', bookmarks);
    }
  }
  
  // 6. 测试插入一条点赞记录
  console.log('\n6. Testing insert like...');
  const testUserId = '550e8400-e29b-41d4-a716-446655440001';
  
  // 获取第一个作品的ID
  if (works && works.length > 0) {
    const workId = works[0].id;
    console.log('   Testing with work ID:', workId);
    
    const { error: insertError } = await supabase
      .from('works_likes')
      .insert({
        user_id: testUserId,
        work_id: workId,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('   ❌ Insert error:', insertError.message);
      console.error('   Code:', insertError.code);
    } else {
      console.log('   ✅ Insert successful!');
      
      // 查询验证
      const { data: verifyData } = await supabase
        .from('works_likes')
        .select('*')
        .eq('user_id', testUserId)
        .eq('work_id', workId);
      
      console.log('   Verification:', verifyData);
      
      // 清理
      await supabase
        .from('works_likes')
        .delete()
        .eq('user_id', testUserId)
        .eq('work_id', workId);
      console.log('   Test data cleaned up');
    }
  }
  
  console.log('\n✓ Check complete!');
}

checkDatabase();
