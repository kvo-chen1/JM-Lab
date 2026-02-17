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

async function checkTableStructure() {
  console.log('Checking actual table structure in database...\n');
  
  // 检查 works_likes 表结构
  console.log('1. Checking works_likes table structure...');
  try {
    // 尝试插入一个 UUID 来测试
    const testUserId = 'test-user-id';
    const testWorkId = '88f4150c-c72a-462a-bbef-a18c683ce299'; // UUID from error
    
    const { error } = await supabase
      .from('works_likes')
      .insert({
        user_id: testUserId,
        work_id: testWorkId,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('   Error inserting UUID:', error.message);
      console.log('   This means work_id is still INTEGER type!');
    } else {
      console.log('   ✓ UUID insert successful - work_id is TEXT type');
      // 清理测试数据
      await supabase
        .from('works_likes')
        .delete()
        .eq('user_id', testUserId)
        .eq('work_id', testWorkId);
    }
  } catch (e) {
    console.error('   Unexpected error:', e);
  }
  
  // 检查 likes 表结构
  console.log('\n2. Checking likes table structure...');
  try {
    const testUserId = '550e8400-e29b-41d4-a716-446655440001'; // Valid UUID
    const testPostId = '88f4150c-c72a-462a-bbef-a18c683ce299';
    
    const { error } = await supabase
      .from('likes')
      .insert({
        user_id: testUserId,
        post_id: testPostId,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('   Error:', error.message);
      if (error.message.includes('integer')) {
        console.log('   ❌ likes.post_id is still INTEGER type!');
      }
    } else {
      console.log('   ✓ likes table accepts UUID');
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', testUserId)
        .eq('post_id', testPostId);
    }
  } catch (e) {
    console.error('   Unexpected error:', e);
  }
  
  console.log('\n✓ Check complete!');
}

checkTableStructure();
