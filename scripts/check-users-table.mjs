/**
 * 检查 users 表结构
 */
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const connectionString = process.env.DATABASE_URL || 
  process.env.NEON_DATABASE_URL || 
  'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('[Check] 检查 users 表结构...\n');
    
    // 检查 users 表的列
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('[Check] users 表列:');
    columnsResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // 检查 users 表的主键
    const pkResult = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'users'
      AND tc.constraint_type = 'PRIMARY KEY'
    `);
    
    console.log('\n[Check] users 表主键:', pkResult.rows.map(r => r.column_name).join(', '));
    
    // 检查 users 表的数据量
    const countResult = await client.query('SELECT COUNT(*) FROM users');
    console.log('[Check] users 表记录数:', countResult.rows[0].count);
    
    // 检查 ip_assets 表是否存在
    const ipAssetsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ip_assets'
      )
    `);
    console.log('\n[Check] ip_assets 表存在:', ipAssetsResult.rows[0].exists);
    
    if (ipAssetsResult.rows[0].exists) {
      const ipAssetsColumns = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'ip_assets'
      `);
      console.log('[Check] ip_assets 表列:', ipAssetsColumns.rows.map(r => r.column_name).join(', '));
    }
    
  } catch (error) {
    console.error('[Check] ❌ 检查失败:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersTable();
