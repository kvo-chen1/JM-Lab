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

async function checkRLS() {
  console.log('Checking RLS policies...\n');
  
  // 1. 检查 works_likes 表的 RLS 策略
  console.log('1. Checking works_likes RLS policies...');
  const { data: worksLikesPolicies, error: worksLikesError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'works_likes');
  
  if (worksLikesError) {
    console.error('   Error:', worksLikesError.message);
  } else {
    console.log('   Policies found:', worksLikesPolicies.length);
    worksLikesPolicies.forEach(p => {
      console.log(`   - ${p.policyname}: ${p.action} - ${p.permissive}`);
    });
  }
  
  // 2. 检查 works_bookmarks 表的 RLS 策略
  console.log('\n2. Checking works_bookmarks RLS policies...');
  const { data: worksBookmarksPolicies, error: worksBookmarksError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'works_bookmarks');
  
  if (worksBookmarksError) {
    console.error('   Error:', worksBookmarksError.message);
  } else {
    console.log('   Policies found:', worksBookmarksPolicies.length);
    worksBookmarksPolicies.forEach(p => {
      console.log(`   - ${p.policyname}: ${p.action} - ${p.permissive}`);
    });
  }
  
  // 3. 检查 likes 表的 RLS 策略
  console.log('\n3. Checking likes RLS policies...');
  const { data: likesPolicies, error: likesError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'likes');
  
  if (likesError) {
    console.error('   Error:', likesError.message);
  } else {
    console.log('   Policies found:', likesPolicies.length);
    likesPolicies.forEach(p => {
      console.log(`   - ${p.policyname}: ${p.action} - ${p.permissive}`);
    });
  }
  
  // 4. 检查 bookmarks 表的 RLS 策略
  console.log('\n4. Checking bookmarks RLS policies...');
  const { data: bookmarksPolicies, error: bookmarksError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'bookmarks');
  
  if (bookmarksError) {
    console.error('   Error:', bookmarksError.message);
  } else {
    console.log('   Policies found:', bookmarksPolicies.length);
    bookmarksPolicies.forEach(p => {
      console.log(`   - ${p.policyname}: ${p.action} - ${p.permissive}`);
    });
  }
  
  console.log('\n✓ Check complete!');
}

checkRLS();
