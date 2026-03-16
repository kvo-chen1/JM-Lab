import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Pool } = pg;

// Supabase 配置
const SUPABASE_URL = 'https://kizgwtrrsmkjeiddotup.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpemd3dHJyc21ramVpZGRvdHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxOTI2NSwiZXhwIjoyMDg4Mzk1MjY1fQ.Joc5d8ORWUfijvns7szuBONRkoIJubd6_B30fIM8HB0';

console.log('🧪 Supabase 数据库连接测试\n');
console.log('═══════════════════════════════════════');

// 测试 1: Supabase API 连接
async function testSupabaseAPI() {
  console.log('\n📡 测试 1: Supabase API 连接');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ 失败:', error.message);
      return false;
    }
    console.log('✅ 成功! Supabase API 连接正常');
    return true;
  } catch (err) {
    console.log('❌ 错误:', err.message);
    return false;
  }
}

// 测试 2: PostgreSQL 直接连接
async function testPostgresConnection() {
  console.log('\n🐘 测试 2: PostgreSQL 直接连接');
  const pool = new Pool({
    connectionString: 'postgresql://postgres:csh200506207837@db.kizgwtrrsmkjeiddotup.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, current_database() as database');
    console.log('✅ 成功! PostgreSQL 连接正常');
    console.log(`   📅 服务器时间: ${result.rows[0].time}`);
    console.log(`   🗄️  数据库: ${result.rows[0].database}`);
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.log('❌ 失败:', err.message);
    await pool.end();
    return false;
  }
}

// 测试 3: 检查数据库表
async function testDatabaseTables() {
  console.log('\n📋 测试 3: 检查数据库表');
  const pool = new Pool({
    connectionString: 'postgresql://postgres:csh200506207837@db.kizgwtrrsmkjeiddotup.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✅ 成功! 找到 ${result.rows.length} 个表:`);
    result.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.log('❌ 失败:', err.message);
    await pool.end();
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  const results = {
    api: await testSupabaseAPI(),
    postgres: await testPostgresConnection(),
    tables: await testDatabaseTables()
  };
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 测试结果汇总');
  console.log('═══════════════════════════════════════');
  console.log(`Supabase API 连接: ${results.api ? '✅ 通过' : '❌ 失败'}`);
  console.log(`PostgreSQL 连接:   ${results.postgres ? '✅ 通过' : '❌ 失败'}`);
  console.log(`数据库表检查:      ${results.tables ? '✅ 通过' : '❌ 失败'}`);
  
  const allPassed = results.api && results.postgres && results.tables;
  console.log('\n' + (allPassed ? '🎉 所有测试通过！Supabase 数据库连接配置成功！' : '⚠️ 部分测试失败，请检查配置'));
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests();
