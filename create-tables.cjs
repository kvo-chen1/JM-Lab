// 使用Supabase服务角色密钥创建数据库表的脚本
// 运行方法：node create-tables.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 从环境变量获取Supabase配置，支持Vite和Next.js的环境变量
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 验证配置
if (!supabaseUrl || !serviceRoleKey) {
  console.error('请确保.env.local文件中包含SUPABASE_URL（或VITE_SUPABASE_URL/ NEXT_PUBLIC_SUPABASE_URL）和SUPABASE_SERVICE_ROLE_KEY环境变量');
  console.log('当前环境变量：');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

// 创建Supabase服务端客户端（使用服务角色密钥）
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

// 使用服务角色密钥直接连接到PostgreSQL数据库
const { Client } = require('pg');

// 从连接字符串解析数据库配置
// 注意：需要将PostgreSQL连接字符串添加到环境变量中
// 示例：DATABASE_URL=postgresql://postgres:password@hostname:5432/database

// 或者使用Supabase的连接信息手动构建
const pgClient = new Client({
  connectionString: supabaseUrl.replace('https://', 'postgresql://'),
  password: serviceRoleKey,
  user: 'postgres', // 默认Supabase用户名
  database: 'postgres', // 默认Supabase数据库名
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// 直接使用pg客户端执行SQL语句的函数
async function executeSQLWithPg(sql) {
  try {
    await pgClient.connect();
    await pgClient.query(sql);
    console.log(`执行SQL成功: ${sql.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error(`执行SQL失败: ${sql}`);
    console.error(error.message);
    return false;
  } finally {
    await pgClient.end();
  }
}

// 读取外部SQL文件内容
const fs = require('fs');
const sqlFilePath = './supabase-tables.sql';

// 验证SQL文件是否存在
if (!fs.existsSync(sqlFilePath)) {
  console.error(`❌ SQL文件不存在: ${sqlFilePath}`);
  process.exit(1);
}

// 读取SQL文件内容
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// 分割SQL语句（处理分号分隔的多个SQL语句）
const createTablesSQL = sqlContent
  .split(';')
  .map(sql => sql.trim())
  .filter(sql => sql.length > 0 && !sql.startsWith('--'));

console.log(`✅ 已读取SQL文件，共 ${createTablesSQL.length} 条SQL语句`);

// 主函数
async function main() {
  console.log('开始创建数据库表...');
  
  // 安装pg依赖（如果尚未安装）
  try {
    require('pg');
  } catch (error) {
    console.log('pg依赖未安装，正在安装...');
    const { execSync } = require('child_process');
    execSync('npm install pg', { stdio: 'inherit' });
    console.log('pg依赖安装成功');
  }
  
  // 重新导入pg客户端（确保安装后能正确导入）
  const { Client } = require('pg');
  
  // 创建新的pg客户端实例
  const pgClient = new Client({
    connectionString: supabaseUrl.replace('https://', 'postgresql://'),
    password: serviceRoleKey,
    user: 'postgres',
    database: 'postgres',
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  // 执行所有SQL语句
  for (const sql of createTablesSQL) {
    try {
      await pgClient.connect();
      await pgClient.query(sql);
      console.log(`执行SQL成功: ${sql.substring(0, 100)}...`);
      await pgClient.end();
    } catch (error) {
      console.error(`执行SQL失败: ${sql}`);
      console.error(`错误信息: ${error.message}`);
      await pgClient.end();
      
      // 提供备选方案
      console.log('\n建议使用以下方法创建表：');
      console.log('1. 在Supabase控制台的SQL编辑器中执行database-schema.sql文件');
      console.log('2. 手动复制以下SQL语句到Supabase SQL编辑器：');
      console.log('\n' + createTablesSQL.join('\n\n'));
      
      process.exit(1);
    }
  }
  
  console.log('\n所有表创建成功！');
}

// 运行主函数
main().catch(error => {
  console.error('程序执行出错:', error);
  process.exit(1);
});
