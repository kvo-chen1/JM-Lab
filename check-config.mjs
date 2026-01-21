import { userDB, DB_TYPE } from './server/database.mjs';
import { emailConfig } from './server/emailService.mjs';

// 检查当前数据库配置
console.log('=== 数据库配置检查 ===');
console.log('环境变量 DB_TYPE:', process.env.DB_TYPE);
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Supabase Anon Key:', process.env.SUPABASE_ANON_KEY);

// 检查邮件服务配置
console.log('\n=== 邮件服务配置检查 ===');
console.log('Email Host:', emailConfig.host);
console.log('Email User:', emailConfig.auth.user);
console.log('Email From:', emailConfig.from);
console.log('是否为模拟配置:', emailConfig.host === 'smtp.example.com' || emailConfig.auth.user.includes('example.com'));

// 检查系统当前使用的数据库类型
async function checkDBType() {
  try {
    const db = await userDB.getDB();
    console.log('\n=== 数据库连接检查 ===');
    console.log('数据库实例:', db.constructor.name);
  } catch (error) {
    console.error('数据库连接失败:', error.message);
  }
}

checkDBType();
