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

async function checkBookmarkData() {
  console.log('Checking bookmark data...\n');
  
  // 使用截图中的用户ID
  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';
  console.log('User ID:', userId);
  console.log('');
  
  // 1. 检查 work_bookmarks 表
  console.log('1. Checking work_bookmarks table...');
  const { data: workBookmarks, error: workBookmarksError } = await supabase
    .from('work_bookmarks')
    .select('*')
    .eq('user_id', userId);
  
  if (workBookmarksError) {
    console.error('   Error:', workBookmarksError.message);
  } else {
    console.log('   Count:', workBookmarks?.length || 0);
    console.log('   Data:', workBookmarks);
  }
  
  // 2. 检查 bookmarks 表（社区帖子）
  console.log('\n2. Checking bookmarks table...');
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId);
  
  if (bookmarksError) {
    console.error('   Error:', bookmarksError.message);
  } else {
    console.log('   Count:', bookmarks?.length || 0);
    console.log('   Data:', bookmarks);
  }
  
  // 3. 检查 work_favorites 表（可能存在的其他表）
  console.log('\n3. Checking work_favorites table...');
  const { data: favorites, error: favoritesError } = await supabase
    .from('work_favorites')
    .select('*')
    .eq('user_id', userId);
  
  if (favoritesError) {
    if (favoritesError.message.includes('does not exist')) {
      console.log('   Table does not exist');
    } else {
      console.error('   Error:', favoritesError.message);
    }
  } else {
    console.log('   Count:', favorites?.length || 0);
    console.log('   Data:', favorites);
  }
  
  console.log('\n✓ Check complete!');
}

checkBookmarkData();
