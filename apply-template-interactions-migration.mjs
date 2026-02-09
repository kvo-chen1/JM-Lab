// 应用模板互动表迁移
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// 加载环境变量
const envLocal = readFileSync('.env.local', 'utf-8');
const envConfig = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envConfig[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('应用模板互动表迁移');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  const sql = readFileSync('./supabase/migrations/20260209000000_create_template_interactions.sql', 'utf-8');
  
  // 分割 SQL 语句并逐条执行
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    const trimmedStatement = statement.trim();
    if (!trimmedStatement) continue;
    
    console.log('执行:', trimmedStatement.substring(0, 60) + '...');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: trimmedStatement + ';' });
      
      if (error) {
        // 如果 exec_sql 函数不存在，尝试直接执行
        console.log('  尝试直接执行...');
        const { error: directError } = await supabase.from('_sql_query').select('*').eq('query', trimmedStatement + ';');
        if (directError) {
          console.log('  ⚠️ 跳过:', error.message);
        }
      } else {
        console.log('  ✅ 成功');
      }
    } catch (e) {
      console.log('  ⚠️ 错误:', e.message);
    }
  }
  
  console.log('\n========================================');
  console.log('迁移完成');
  console.log('========================================');
}

// 检查表是否已存在
async function checkTables() {
  console.log('检查现有表...\n');
  
  const tables = ['template_favorites', 'template_likes'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: 表已存在`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
}

checkTables().then(() => {
  console.log('\n请使用 Supabase CLI 或 Dashboard 执行 SQL 迁移文件:');
  console.log('supabase/migrations/20260209000000_create_template_interactions.sql');
  console.log('\n或者使用 psql 直接执行:');
  console.log(`psql "${envConfig.DATABASE_URL}" -f supabase/migrations/20260209000000_create_template_interactions.sql`);
});
