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

async function listTables() {
  console.log('Listing all tables in public schema...\n');
  
  // 查询所有表
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')
    .order('table_name');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Total tables:', tables.length);
  console.log('\nAll tables:');
  tables.forEach(t => {
    console.log(`  - ${t.table_name}`);
  });
  
  // 查找与 like/bookmark 相关的表
  console.log('\n\nLike/Bookmark related tables:');
  const relatedTables = tables.filter(t => 
    t.table_name.includes('like') || 
    t.table_name.includes('bookmark') ||
    t.table_name.includes('favorite')
  );
  
  relatedTables.forEach(t => {
    console.log(`  - ${t.table_name}`);
  });
  
  console.log('\n✓ Done!');
}

listTables();
