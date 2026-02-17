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
  console.log('Verifying tables...\n');
  
  // 检查 works_bookmarks 表
  console.log('1. Checking works_bookmarks table...');
  const { data: bookmarksData, error: bookmarksError } = await supabase
    .from('works_bookmarks')
    .select('*')
    .limit(1);
  
  if (bookmarksError) {
    console.error('   Error:', bookmarksError.message);
  } else {
    console.log('   ✓ works_bookmarks table exists');
    console.log('   Sample data:', bookmarksData);
  }
  
  // 检查 works_likes 表
  console.log('\n2. Checking works_likes table...');
  const { data: likesData, error: likesError } = await supabase
    .from('works_likes')
    .select('*')
    .limit(1);
  
  if (likesError) {
    console.error('   Error:', likesError.message);
  } else {
    console.log('   ✓ works_likes table exists');
    console.log('   Sample data:', likesData);
  }
  
  // 检查表结构
  console.log('\n3. Checking table structure...');
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type')
    .eq('table_schema', 'public')
    .in('table_name', ['works_bookmarks', 'works_likes'])
    .order('table_name');
  
  if (columnsError) {
    console.error('   Error:', columnsError.message);
  } else {
    console.log('   Table structure:');
    columns.forEach(col => {
      console.log(`   - ${col.table_name}.${col.column_name}: ${col.data_type}`);
    });
  }
  
  console.log('\n✓ Verification complete!');
}

verifyTables();
