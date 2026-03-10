#!/usr/bin/env node
/**
 * 测试修复后的收藏 API
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });

// 使用 PgBouncer 事务模式
const connectionString = process.env.DATABASE_URL?.replace(':5432/', ':6543/') || 
  'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('\n========================================');
console.log('测试修复后的收藏 API');
console.log('========================================\n');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function testBookmarks() {
  const client = await pool.connect();
  
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const limit = 50;
    const offset = 0;
    
    // 1. 获取收藏的作品ID
    console.log('1. 获取收藏的作品ID...');
    const { rows: favRows } = await client.query(
      'SELECT work_id FROM work_favorites WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [testUserId, limit, offset]
    );
    console.log(`   找到 ${favRows.length} 条收藏记录`);
    
    if (favRows.length === 0) {
      console.log('   没有收藏记录，测试通过（返回空数组）');
      return;
    }
    
    const workIds = favRows.map(r => r.work_id);
    console.log(`   作品ID列表: ${workIds.slice(0, 5).join(', ')}${workIds.length > 5 ? '...' : ''}`);
    
    // 2. 测试修复后的查询方法
    console.log('\n2. 测试修复后的查询方法...');
    try {
      const placeholders = workIds.map((_, i) => `$${i + 1}`).join(',');
      const { rows: worksData } = await client.query(
        `SELECT * FROM works WHERE id::text IN (${placeholders}) ORDER BY created_at DESC`,
        workIds
      );
      console.log(`   ✅ 查询成功，返回 ${worksData.length} 条作品记录`);
    } catch (e) {
      console.log(`   ❌ 查询失败: ${e.message}`);
    }
    
    // 3. 测试 JOIN 方式
    console.log('\n3. 测试 JOIN 方式...');
    try {
      const { rows: worksData } = await client.query(
        `SELECT w.* FROM works w 
         INNER JOIN work_favorites wf ON w.id::text = wf.work_id 
         WHERE wf.user_id = $1 
         ORDER BY wf.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [testUserId, limit, offset]
      );
      console.log(`   ✅ JOIN 查询成功，返回 ${worksData.length} 条作品记录`);
    } catch (e) {
      console.log(`   ❌ JOIN 查询失败: ${e.message}`);
    }
    
    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

testBookmarks();
