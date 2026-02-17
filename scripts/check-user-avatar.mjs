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

async function checkUserAvatar() {
  console.log('Checking user avatar data...\n');
  
  // 使用截图中的用户ID
  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';
  console.log('User ID:', userId);
  console.log('');
  
  // 1. 检查 users 表中的用户信息
  console.log('1. Checking users table...');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (userError) {
    console.error('   Error:', userError.message);
  } else {
    console.log('   User data:', user);
    console.log('   Avatar URL:', user?.avatar_url);
  }
  
  // 2. 检查 work_favorites 表结构
  console.log('\n2. Checking work_favorites table structure...');
  const { data: favorite, error: favoriteError } = await supabase
    .from('work_favorites')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .single();
  
  if (favoriteError) {
    console.error('   Error:', favoriteError.message);
  } else {
    console.log('   Favorite data:', favorite);
    console.log('   Work ID:', favorite?.work_id);
    
    // 3. 获取作品信息
    if (favorite?.work_id) {
      console.log('\n3. Checking work info...');
      const { data: work, error: workError } = await supabase
        .from('works')
        .select('*')
        .eq('id', favorite.work_id)
        .single();
      
      if (workError) {
        console.error('   Error:', workError.message);
      } else {
        console.log('   Work data:', work);
        console.log('   Creator ID:', work?.creator_id);
        
        // 4. 获取作者信息
        if (work?.creator_id) {
          console.log('\n4. Checking creator info...');
          const { data: creator, error: creatorError } = await supabase
            .from('users')
            .select('*')
            .eq('id', work.creator_id)
            .single();
          
          if (creatorError) {
            console.error('   Error:', creatorError.message);
          } else {
            console.log('   Creator data:', creator);
            console.log('   Creator avatar:', creator?.avatar_url);
          }
        }
      }
    }
  }
  
  console.log('\n✓ Check complete!');
}

checkUserAvatar();
