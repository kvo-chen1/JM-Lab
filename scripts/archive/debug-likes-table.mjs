#!/usr/bin/env node
/**
 * 检查 work_likes 表结构
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL?.replace(':5432/', ':6543/') || 
  'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('\n========================================');
console.log('检查 work_likes 表结构');
console.log('========================================\n');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function debugLikesTable() {
  const client = await pool.connect();
  
  try {
    // 1. 检查 work_likes 表是否存在
    console.log('1. 检查 work_likes 表是否存在...');
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'work_likes'
      );
    `);
    console.log(`   结果: ${tableResult.rows[0].exists ? '✅ 存在' : '❌ 不存在'}`);
    
    // 2. 检查表结构
    if (tableResult.rows[0].exists) {
      console.log('\n2. 检查 work_likes 表结构...');
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'work_likes'
        ORDER BY ordinal_position;
      `);
      console.log('   字段:');
      columnsResult.rows.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type}`);
      });
      
      // 3. 检查记录数
      console.log('\n3. 检查记录数...');
      const countResult = await client.query('SELECT COUNT(*) as count FROM work_likes');
      console.log(`   总记录数: ${countResult.rows[0].count}`);
      
      // 4. 检查示例数据
      console.log('\n4. 检查示例数据...');
      const sampleResult = await client.query('SELECT * FROM work_likes LIMIT 3');
      if (sampleResult.rows.length > 0) {
        console.log('   示例数据:');
        sampleResult.rows.forEach(row => {
          console.log(`     - user_id: ${row.user_id}, work_id: ${row.work_id}`);
        });
      } else {
        console.log('   没有数据');
      }
    }
    
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

debugLikesTable();
