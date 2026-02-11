// 执行数据库迁移脚本
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('错误: 未设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.log('请在 .env 文件中设置 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('开始执行数据库迁移...');
  
  const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20260214000009_add_design_workshop_tables.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error('迁移文件不存在:', migrationFile);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationFile, 'utf8');
  console.log('迁移文件内容长度:', sql.length, '字符');
  
  // 尝试使用 Supabase 的 SQL 执行功能
  console.log('\n尝试执行迁移...');
  
  try {
    // 首先检查表是否已存在
    const { data: existingTables, error: checkError } = await supabase
      .from('user_uploads')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('表已存在，跳过迁移');
      return;
    }
  } catch (e) {
    // 表不存在，继续执行
  }
  
  // 由于 Supabase JS 客户端无法直接执行原始 SQL，
  // 我们需要使用 Supabase CLI 或在 Dashboard 中手动执行
  console.log('\n=====================================');
  console.log('迁移文件已创建:', migrationFile);
  console.log('\n请通过以下方式之一执行迁移:');
  console.log('1. 登录 Supabase Dashboard，进入 SQL Editor，粘贴并执行上述文件内容');
  console.log('2. 使用 Supabase CLI: npx supabase db push');
  console.log('3. 使用 psql 直接连接数据库执行');
  console.log('=====================================\n');
  
  // 显示迁移文件内容预览
  console.log('迁移文件内容预览:');
  console.log('---');
  console.log(sql.substring(0, 500));
  console.log('...');
  console.log(sql.substring(sql.length - 200));
  console.log('---');
}

runMigration().catch(console.error);
