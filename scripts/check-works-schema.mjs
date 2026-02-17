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

async function checkWorksSchema() {
  console.log('Checking works table schema...\n');
  
  // 获取一个作品样本
  const { data: work, error } = await supabase
    .from('works')
    .select('*')
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Sample work fields:');
  Object.keys(work).forEach(key => {
    console.log(`  - ${key}: ${work[key]}`);
  });
  
  console.log('\n✓ Check complete!');
}

checkWorksSchema();
