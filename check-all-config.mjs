/**
 * 全面检查数据库和存储配置
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🔍 全面配置检查');
console.log('='.repeat(70));

// 1. 数据库配置检查
console.log('\n📦 1. 数据库配置 (Neon)');
console.log('-'.repeat(50));

const dbVars = [
  'DATABASE_URL',
  'NEON_DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
  'DB_TYPE'
];

let dbConfigured = true;
dbVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('URL') 
      ? value.replace(/:([^@]+)@/, ':****@').substring(0, 60) + '...'
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else if (varName === 'DB_TYPE') {
    console.log(`  ⚠️  ${varName}: 未设置 (默认使用 postgresql)`);
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
    if (varName === 'DATABASE_URL' || varName === 'NEON_DATABASE_URL') {
      dbConfigured = false;
    }
  }
});

// 2. 存储配置检查
console.log('\n📦 2. 存储配置 (腾讯云 COS)');
console.log('-'.repeat(50));

const storageVars = [
  'VITE_STORAGE_TYPE',
  'COS_SECRET_ID',
  'COS_SECRET_KEY',
  'COS_BUCKET',
  'COS_REGION',
  'COS_DOMAIN'
];

let cosConfigured = true;
storageVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes('SECRET')) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 10)}****`);
    } else {
      console.log(`  ✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
    if (varName !== 'VITE_STORAGE_TYPE') {
      cosConfigured = false;
    }
  }
});

// 3. Supabase 配置（应该已禁用）
console.log('\n📦 3. Supabase 配置（应已禁用）');
console.log('-'.repeat(50));

const supabaseVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

supabaseVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (value.includes('localhost') || value.includes('local-proxy')) {
      console.log(`  ✅ ${varName}: ${value} (已指向本地代理)`);
    } else if (value.includes('supabase.co')) {
      console.log(`  ⚠️  ${varName}: 仍指向 Supabase 服务`);
    } else {
      console.log(`  ℹ️  ${varName}: ${value.substring(0, 40)}...`);
    }
  } else {
    console.log(`  ✅ ${varName}: 未设置`);
  }
});

// 4. 其他重要配置
console.log('\n📦 4. 其他重要配置');
console.log('-'.repeat(50));

const otherVars = [
  'JWT_SECRET',
  'VITE_API_BASE_URL',
  'VITE_LOCAL_API_URL',
  'VITE_USE_LOCAL_PROXY'
];

otherVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ℹ️  ${varName}: 未设置`);
  }
});

// 5. 总结
console.log('\n' + '='.repeat(70));
console.log('📊 配置状态总结');
console.log('='.repeat(70));

if (dbConfigured) {
  console.log('✅ 数据库配置: 正常 (Neon PostgreSQL)');
} else {
  console.log('❌ 数据库配置: 异常');
}

if (cosConfigured) {
  console.log('✅ 存储配置: 正常 (腾讯云 COS)');
} else if (process.env.VITE_STORAGE_TYPE === 'local') {
  console.log('✅ 存储配置: 正常 (本地存储)');
} else {
  console.log('❌ 存储配置: 异常');
}

console.log('\n💡 提示:');
console.log('   - 数据库: 平台只与 Neon 数据库连接');
console.log('   - 存储: 新上传图片保存到腾讯云 COS');
console.log('   - Supabase: 已完全禁用');

// 6. 测试数据库连接
console.log('\n🧪 测试数据库连接...');
console.log('-'.repeat(50));

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL_NON_POOLING;

if (DATABASE_URL) {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query('SELECT version()');
    console.log('  ✅ 数据库连接成功');
    console.log(`  📋 ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    
    // 检查表数量
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`  📊 表数量: ${tablesResult.rows[0].count}`);
    
    await client.end();
  } catch (error) {
    console.log('  ❌ 数据库连接失败:', error.message);
  }
} else {
  console.log('  ❌ 未配置数据库连接字符串');
}

console.log('\n' + '='.repeat(70));
console.log('检查完成！');
