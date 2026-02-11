/**
 * 执行搜索功能数据库迁移
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔧 执行搜索功能数据库迁移...\n');

  try {
    // 读取迁移文件
    const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20260211000002_create_search_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    // 分割 SQL 语句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📄 迁移文件包含 ${statements.length} 个 SQL 语句\n`);

    // 执行每个语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const firstLine = statement.split('\n')[0].trim();
      
      // 跳过注释和空行
      if (firstLine.startsWith('--') || firstLine.startsWith('/*') || firstLine === '') {
        continue;
      }

      process.stdout.write(`  [${i + 1}/${statements.length}] ${firstLine.substring(0, 60)}... `);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // 如果 exec_sql 函数不存在，尝试直接执行
          const { error: queryError } = await supabase.from('_dummy_query').select('*').limit(0);
          
          // 使用 REST API 直接执行 SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            const errorText = await response.text();
            // 忽略已存在的错误
            if (errorText.includes('already exists') || errorText.includes('Duplicate')) {
              console.log('⚠️ 已存在');
            } else {
              console.log(`❌ 失败: ${errorText.substring(0, 100)}`);
            }
          } else {
            console.log('✅');
          }
        } else {
          console.log('✅');
        }
      } catch (err) {
        // 忽略已存在的错误
        if (err.message?.includes('already exists') || err.message?.includes('Duplicate')) {
          console.log('⚠️ 已存在');
        } else {
          console.log(`❌ 失败: ${err.message?.substring(0, 100) || '未知错误'}`);
        }
      }
    }

    console.log('\n✅ 迁移执行完成！');

    // 验证表是否创建成功
    console.log('\n🔍 验证表...');
    const tables = [
      'user_search_history',
      'hot_searches',
      'search_suggestions',
      'user_search_preferences',
      'search_behavior_tracking'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: ${err.message}`);
      }
    }

  } catch (err) {
    console.error('\n❌ 迁移失败:', err.message);
    process.exit(1);
  }
}

runMigration();
