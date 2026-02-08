// 添加 video_url 列到 works 表
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  }
});

async function addVideoUrlColumn() {
  const client = await pool.connect();
  
  try {
    console.log('检查并添加 video_url 列到 works 表...\n');
    
    // 1. 检查 works 表是否存在 video_url 列
    const { rows } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'works' AND column_name = 'video_url'
    `);
    
    if (rows.length === 0) {
      console.log('⚠️  video_url 列不存在，正在添加...');
      
      // 2. 添加 video_url 列
      await client.query(`
        ALTER TABLE works 
        ADD COLUMN video_url TEXT
      `);
      
      console.log('✅ video_url 列添加成功！');
    } else {
      console.log('✅ video_url 列已存在');
    }
    
    // 3. 显示 works 表的所有列
    const { rows: allColumns } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'works'
      ORDER BY ordinal_position
    `);
    
    console.log('\nworks 表的列:');
    allColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('添加失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addVideoUrlColumn();
