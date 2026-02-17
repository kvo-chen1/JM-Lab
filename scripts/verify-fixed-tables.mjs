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

async function verifyTables() {
  console.log('Verifying fixed tables...\n');
  
  // 检查 works_bookmarks 表结构
  console.log('1. Checking works_bookmarks table structure...');
  const { data: bookmarkColumns, error: bookmarkError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'works_bookmarks')
    .order('ordinal_position');
  
  if (bookmarkError) {
    console.error('   Error:', bookmarkError.message);
  } else {
    console.log('   works_bookmarks columns:');
    bookmarkColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
  }
  
  // 检查 works_likes 表结构
  console.log('\n2. Checking works_likes table structure...');
  const { data: likeColumns, error: likeError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'works_likes')
    .order('ordinal_position');
  
  if (likeError) {
    console.error('   Error:', likeError.message);
  } else {
    console.log('   works_likes columns:');
    likeColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
  }
  
  // 测试插入一条记录
  console.log('\n3. Testing insert with UUID...');
  const testUserId = 'test-user-id';
  const testWorkId = '7a214592-e3ea-4d5f-b42c-332bb0ea7313'; // UUID format
  
  const { error: testError } = await supabase
    .from('works_likes')
    .insert({
      user_id: testUserId,
      work_id: testWorkId,
      created_at: new Date().toISOString()
    });
  
  if (testError) {
    console.error('   Insert test failed:', testError.message);
  } else {
    console.log('   ✓ Insert test passed! UUID work_id accepted.');
    
    // 清理测试数据
    await supabase
      .from('works_likes')
      .delete()
      .eq('user_id', testUserId)
      .eq('work_id', testWorkId);
    console.log('   Test data cleaned up.');
  }
  
  console.log('\n✓ Verification complete!');
}

verifyTables();
