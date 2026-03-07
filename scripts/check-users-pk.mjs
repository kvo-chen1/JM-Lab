/**
 * 检查 users 表主键
 */
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkUsersPK() {
  const client = await pool.connect();
  
  try {
    console.log('[Check] 检查 users 表约束...\n');
    
    // 检查所有约束
    const constraintsResult = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'users'
      ORDER BY tc.constraint_type, kcu.column_name
    `);
    
    console.log('[Check] users 表约束:');
    constraintsResult.rows.forEach(row => {
      console.log(`  ${row.constraint_type}: ${row.constraint_name} (${row.column_name})`);
    });
    
    // 检查 users 表的实际列
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n[Check] users 表所有列:');
    columnsResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // 尝试查询 users 表
    const sampleResult = await client.query('SELECT id FROM users LIMIT 1');
    console.log('\n[Check] 成功查询 users 表 id 列');
    console.log('[Check] 样本数据:', sampleResult.rows);
    
  } catch (error) {
    console.error('[Check] ❌ 检查失败:', error.message);
    
    // 尝试用 instance_id 查询
    try {
      const result = await client.query('SELECT instance_id FROM users LIMIT 1');
      console.log('\n[Check] 但 instance_id 列存在:', result.rows);
    } catch (e) {
      console.error('[Check] instance_id 也不存在');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersPK();
