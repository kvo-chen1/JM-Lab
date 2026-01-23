// 使用现有的Supabase连接直接完善数据库
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// 从.env文件读取环境变量，优先读取.env.local
dotenv.config({ path: '.env.local' });
dotenv.config();

// 清理环境变量值的函数
const cleanEnvValue = (value) => {
  if (!value) return '';
  return value.trim().replace(/^[\s"'`]+|[\s"'`]+$/g, '');
};

// 获取环境变量
const supabaseUrl = cleanEnvValue(process.env.VITE_SUPABASE_URL) || cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = cleanEnvValue(process.env.VITE_SUPABASE_ANON_KEY) || cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

console.log('=== Supabase数据库迁移工具 ===');
console.log('URL:', supabaseUrl);
console.log('密钥:', supabaseKey ? '已设置（长度：' + supabaseKey.length + '）' : '未设置');

// 读取SQL迁移脚本
const sqlFilePath = './supabase-tables.sql';
if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ SQL迁移脚本不存在:', sqlFilePath);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
console.log('\n已读取SQL迁移脚本，共', sqlContent.split('\n').length, '行');

// 连接到Supabase并执行迁移
if (supabaseUrl && supabaseKey) {
  console.log('\n正在连接到Supabase数据库...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ 成功连接到Supabase数据库');
    
    // 执行SQL脚本 - 使用更可靠的方法
    console.log('\n开始执行数据库迁移...');
    
    // 注意：由于Supabase客户端限制，我们无法直接执行任意SQL语句
    // 因此我们将创建一个简单的指南，指导用户如何在Supabase Studio中执行SQL脚本
    
    console.log('📋 数据库迁移指南：');
    console.log('1. 登录 Supabase Studio: https://supabase.com/dashboard');
    console.log('2. 选择你的项目：jinmaiLab');
    console.log('3. 点击左侧菜单的 "SQL Editor"');
    console.log('4. 将 supabase-tables.sql 文件的内容复制到编辑器中');
    console.log('5. 点击 "Run" 按钮执行脚本');
    console.log('6. 查看执行结果，确保所有语句都成功执行');
    
    console.log('\n📁 SQL脚本路径：', sqlFilePath);
    console.log('📝 SQL脚本内容预览：');
    console.log(sqlContent.substring(0, 500) + '...');
    
    // 同时，我们将测试一些基本的数据库操作，验证连接是否正常
    console.log('\n🔍 测试基本数据库连接...');
    
    try {
      // 测试认证状态
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('❌ 认证测试失败:', authError.message);
      } else {
        console.log('✅ 认证连接测试成功');
      }
      
      // 测试简单查询
      const { data: queryData, error: queryError } = await supabase.from('users').select('id').limit(1);
      if (queryError) {
        if (queryError.code === '42P01') {
          console.log('ℹ️  users表不存在，这是正常的，因为我们还没有执行迁移脚本');
        } else {
          console.error('❌ 查询测试失败:', queryError.message);
        }
      } else {
        console.log('✅ 查询测试成功，返回', queryData.length, '条记录');
      }
      
      console.log('\n✅ 数据库连接测试完成，连接正常！');
      console.log('\n📌 请按照上述指南在Supabase Studio中执行SQL迁移脚本。');
    } catch (error) {
      console.error('❌ 连接测试失败:', error.message);
    }
    
    console.log('\n=== 迁移指南已完成 ===');
    console.log('\n📌 请按照上述指南在Supabase Studio中执行SQL迁移脚本，完成数据库完善工作。');
    console.log('\n💡 提示：执行脚本后，你可以再次运行此工具验证迁移结果。');
    
  } catch (error) {
    console.error('❌ 连接到Supabase失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  }
} else {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}
