// 测试 events 查询
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('🔍 测试查询 events 表...\n');
    
    const { rows } = await pool.query('SELECT * FROM events ORDER BY start_date ASC');
    
    console.log('查询结果:', rows.length, '条记录');
    
    if (rows.length > 0) {
      rows.forEach((row, i) => {
        console.log(`\n活动 ${i + 1}:`);
        console.log('  ID:', row.id);
        console.log('  标题:', row.title);
        console.log('  start_date:', row.start_date);
        console.log('  end_date:', row.end_date);
        console.log('  所有字段:', Object.keys(row));
      });
    }
    
  } catch (e) {
    console.error('❌ 错误:', e.message);
  } finally {
    await pool.end();
  }
}

test();
