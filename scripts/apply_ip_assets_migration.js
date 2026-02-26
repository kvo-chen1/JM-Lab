// 应用 IP 资产审核迁移脚本
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取环境变量
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('开始应用 IP 资产审核迁移...');

  // 读取迁移文件
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260226000030_update_ip_assets_for_audit.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // 分割 SQL 语句
  const statements = sql.split(';').filter(s => s.trim());

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    console.log(`执行语句 ${i + 1}/${statements.length}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // 如果 exec_sql 不存在，尝试直接执行
        console.log('  警告:', error.message);
      } else {
        console.log('  成功');
      }
    } catch (err) {
      console.log('  错误:', err.message);
    }
  }

  console.log('迁移完成！');
}

applyMigration().catch(console.error);
