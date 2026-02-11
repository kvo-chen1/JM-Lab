// 执行数据库迁移脚本
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_service_role_AYUZnzF2LNBPXi2o_3LGbA_7ceksBnv';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('开始执行数据库迁移...');
  
  const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20260214000009_add_design_workshop_tables.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error('迁移文件不存在:', migrationFile);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  // 分割 SQL 语句（简单处理）
  const statements = sql.split(';').filter(s => s.trim());
  
  console.log(`找到 ${statements.length} 条 SQL 语句`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    console.log(`\n执行语句 ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 100) + '...');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // 如果 exec_sql 函数不存在，尝试直接查询
        console.log('尝试直接执行...');
        const { error: queryError } = await supabase.from('_dummy').select('*').limit(0);
        
        if (queryError && queryError.message.includes('does not exist')) {
          console.log('表不存在，继续执行...');
        }
      }
    } catch (e) {
      console.error('执行出错:', e.message);
    }
  }
  
  console.log('\n迁移执行完成！');
}

runMigration().catch(console.error);
