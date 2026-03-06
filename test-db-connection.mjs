// 测试数据库连接配置
import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 数据库连接配置检查');
console.log('='.repeat(50));

// 检查所有可能的数据库连接环境变量
const envVars = [
  'DATABASE_URL',
  'NEON_DATABASE_URL',
  'NEON_URL',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
  'DB_TYPE'
];

console.log('\n📋 环境变量状态:');
envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // 隐藏密码
    const displayValue = value.includes('@') 
      ? value.replace(/:([^@]+)@/, ':****@')
      : value;
    console.log(`  ✅ ${varName}: ${displayValue.substring(0, 60)}${displayValue.length > 60 ? '...' : ''}`);
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
  }
});

// 模拟 database.mjs 的连接逻辑
console.log('\n🔧 连接逻辑检查:');

function getPostgresConnectionString() {
  // 1. 最优先使用 NON_POOLING
  if (process.env.POSTGRES_URL_NON_POOLING) {
    console.log('  → 将使用: POSTGRES_URL_NON_POOLING');
    return process.env.POSTGRES_URL_NON_POOLING;
  }

  // 2. 其次尝试标准 DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('  → 将使用: DATABASE_URL');
    return process.env.DATABASE_URL;
  }
  
  // 3. 尝试 POSTGRES_URL
  if (process.env.POSTGRES_URL) {
    console.log('  → 将使用: POSTGRES_URL');
    return process.env.POSTGRES_URL;
  }
  
  // 4. 尝试 Neon 相关变量
  const neonUrl = process.env.NEON_URL || 
                  process.env.NEON_DATABASE_URL;
  if (neonUrl) {
    console.log('  → 将使用: NEON 相关变量');
    return neonUrl;
  }
  
  console.log('  ❌ 未找到有效的数据库连接字符串');
  return null;
}

const connectionString = getPostgresConnectionString();

if (connectionString) {
  console.log('\n✅ 数据库连接配置正确');
  console.log(`   连接字符串: ${connectionString.replace(/:([^@]+)@/, ':****@')}`);
  
  // 验证连接字符串格式
  try {
    const url = new URL(connectionString);
    console.log(`   协议: ${url.protocol}`);
    console.log(`   主机: ${url.hostname}`);
    console.log(`   端口: ${url.port || '5432 (默认)'}`);
    console.log(`   数据库: ${url.pathname.slice(1)}`);
    console.log(`   用户名: ${url.username}`);
  } catch (e) {
    console.log('   ⚠️ 连接字符串格式可能不正确');
  }
} else {
  console.log('\n❌ 数据库连接配置不正确');
}

// 检查 DB_TYPE
console.log('\n📊 数据库类型:');
const dbType = process.env.DB_TYPE || '未设置';
console.log(`   DB_TYPE: ${dbType}`);

if (dbType === 'postgresql') {
  console.log('   ✅ 正确配置为 PostgreSQL (Neon)');
} else {
  console.log('   ⚠️ 建议设置为: postgresql');
}

console.log('\n' + '='.repeat(50));
console.log('检查完成!');
