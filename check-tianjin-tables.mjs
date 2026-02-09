// 检查天津相关表结构
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
console.log('天津相关表结构检查');
console.log('========================================\n');

// 使用 service role key 获取完整权限
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  const tables = [
    'tianjin_templates',
    'tianjin_offline_experiences',
    'tianjin_traditional_brands',
    'tianjin_hotspots',
    'events'
  ];

  for (const table of tables) {
    console.log(`\n📋 检查表: ${table}`);
    console.log('-'.repeat(50));
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ 查询失败: ${error.message}`);
        console.log(`   错误码: ${error.code}`);
      } else {
        console.log(`   ✅ 表存在`);
        console.log(`   数据条数: ${data.length > 0 ? '有数据' : '空表'}`);
        if (data.length > 0) {
          console.log(`   字段: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`   ❌ 异常: ${e.message}`);
    }
  }

  // 获取所有表名
  console.log('\n\n📋 查询数据库中所有表');
  console.log('-'.repeat(50));
  try {
    const { data, error } = await supabase
      .rpc('get_all_tables');
    
    if (error) {
      // 尝试直接查询 information_schema
      const { data: tables, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (schemaError) {
        console.log(`   无法获取表列表: ${schemaError.message}`);
      } else {
        console.log(`   找到 ${tables.length} 个表:`);
        tables.forEach(t => console.log(`   - ${t.table_name}`));
      }
    } else {
      console.log('   表列表:', data);
    }
  } catch (e) {
    console.log(`   异常: ${e.message}`);
  }
}

checkTables();
