#!/usr/bin/env node
/**
 * 调试收藏 API 问题
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });

// 使用 PgBouncer 事务模式
const connectionString = process.env.DATABASE_URL?.replace(':5432/', ':6543/') || 
  'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('\n========================================');
console.log('调试收藏 API');
console.log('========================================\n');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function debugBookmarks() {
  const client = await pool.connect();
  
  try {
    // 1. 检查 work_favorites 表是否存在
    console.log('1. 检查 work_favorites 表是否存在...');
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'work_favorites'
      );
    `);
    console.log(`   结果: ${tableResult.rows[0].exists ? '✅ 存在' : '❌ 不存在'}`);
    
    // 2. 检查 works 表是否存在
    console.log('\n2. 检查 works 表是否存在...');
    const worksTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'works'
      );
    `);
    console.log(`   结果: ${worksTableResult.rows[0].exists ? '✅ 存在' : '❌ 不存在'}`);
    
    // 3. 尝试执行查询
    console.log('\n3. 测试查询 work_favorites...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000'; // 测试用虚拟用户ID
      const { rows: favRows } = await client.query(
        'SELECT work_id FROM work_favorites WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [testUserId, 50, 0]
      );
      console.log(`   ✅ 查询成功，返回 ${favRows.length} 条记录`);
    } catch (e) {
      console.log(`   ❌ 查询失败: ${e.message}`);
    }
    
    // 4. 检查表结构
    console.log('\n4. 检查 work_favorites 表结构...');
    try {
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'work_favorites'
        ORDER BY ordinal_position;
      `);
      if (columnsResult.rows.length > 0) {
        console.log('   字段:');
        columnsResult.rows.forEach(col => {
          console.log(`     - ${col.column_name}: ${col.data_type}`);
        });
      } else {
        console.log('   未找到字段信息');
      }
    } catch (e) {
      console.log(`   ❌ 获取表结构失败: ${e.message}`);
    }
    
    // 5. 检查 works 表结构
    console.log('\n5. 检查 works 表结构...');
    try {
      const worksColumnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'works'
        ORDER BY ordinal_position;
      `);
      if (worksColumnsResult.rows.length > 0) {
        console.log('   字段 (前10个):');
        worksColumnsResult.rows.slice(0, 10).forEach(col => {
          console.log(`     - ${col.column_name}: ${col.data_type}`);
        });
      } else {
        console.log('   未找到字段信息');
      }
    } catch (e) {
      console.log(`   ❌ 获取表结构失败: ${e.message}`);
    }
    
    console.log('\n========================================');
    console.log('调试完成');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugBookmarks();
