#!/usr/bin/env node
/**
 * 检查 community_members 表结构
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL?.replace(':5432/', ':6543/') || 
  'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('\n========================================');
console.log('检查 community_members 表结构');
console.log('========================================\n');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function checkStructure() {
  const client = await pool.connect();
  
  try {
    // 获取表结构
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'community_members'
      ORDER BY ordinal_position;
    `);
    
    console.log('community_members 表结构:');
    console.log('----------------------------------------');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // 检查主键
    const pkResult = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'community_members'
        AND tc.constraint_type = 'PRIMARY KEY';
    `);
    
    console.log('\n主键:');
    pkResult.rows.forEach(pk => {
      console.log(`  - ${pk.column_name}`);
    });
    
    // 显示示例数据
    console.log('\n示例数据:');
    const sampleResult = await client.query('SELECT * FROM community_members LIMIT 2');
    sampleResult.rows.forEach((row, i) => {
      console.log(`\n  记录 ${i + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    });
    
    console.log('\n========================================');
    console.log('检查完成');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStructure();
