// 验证数据库表是否创建成功
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTE1MzIsImV4cCI6MjA4MjA2NzUzMn0.hXdokiVrdl8mc5DNa3SjJtsfJpXmNhfJ3ztfHP6YV8c';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tables = [
  'user_uploads',
  'user_patterns',
  'user_style_presets',
  'user_tile_configs',
  'user_mockup_configs'
];

async function verifyTables() {
  console.log('验证数据库表...\n');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${table}: 表不存在`);
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: 表存在且可访问`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
  
  console.log('\n验证完成！');
}

verifyTables().catch(console.error);
