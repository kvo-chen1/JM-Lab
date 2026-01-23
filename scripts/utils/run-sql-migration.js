// 使用supabaseClient执行SQL迁移脚本
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// 从.env文件读取环境变量，优先读取.env.local
dotenv.config({ path: '.env.local' });
dotenv.config();

// 清理环境变量值的函数
const cleanEnvValue = (value) => {
  if (!value) return '';
  return value.trim().replace(/^[\s"'`]+|[\s"'`]+$/g, '');
};

// 获取Supabase连接信息
const supabaseUrl = cleanEnvValue(process.env.SUPABASE_URL) || cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

console.log('=== Supabase数据库迁移工具 ===');
console.log('URL:', supabaseUrl);
console.log('密钥类型:', supabaseKey.includes('service_role') ? 'Service Role Key' : 'Anon Key');
console.log('密钥:', supabaseKey ? '已设置（长度：' + supabaseKey.length + '）' : '未设置');

// 读取SQL迁移脚本
const sqlFilePath = './supabase-tables.sql';
if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ SQL迁移脚本不存在:', sqlFilePath);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
console.log('\n已读取SQL迁移脚本，共', sqlContent.split('\n').length, '行');

// 连接到Supabase
console.log('\n正在连接到Supabase数据库...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    // 测试连接
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('❌ 认证测试失败:', authError.message);
      process.exit(1);
    }
    console.log('✅ 成功连接到Supabase数据库');

    // 将SQL脚本分割为多个语句
    const statements = sqlContent.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`\n开始执行 ${statements.length} 个SQL语句...`);

    // 逐条执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n执行语句 ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        // 使用Supabase的rpc方法执行SQL语句
        const { error } = await supabase.rpc('execute_sql', {
          sql: statement
        });
        
        if (error) {
          console.error(`❌ 执行失败:`, error.message);
          // 继续执行其他语句，不要中断整个迁移
        } else {
          console.log(`✅ 执行成功`);
        }
      } catch (err) {
        console.error(`❌ 执行出错:`, err.message);
        // 继续执行其他语句，不要中断整个迁移
      }
    }

    console.log('\n=== 数据库迁移完成 ===');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error.message);
    process.exit(1);
  }
}

runMigration();
