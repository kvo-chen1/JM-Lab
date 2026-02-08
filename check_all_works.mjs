// 检查所有作品数据
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAllWorks() {
  const client = await pool.connect();
  
  try {
    console.log('检查所有作品数据...\n');
    
    // 1. 获取所有作品
    const { rows } = await client.query(`
      SELECT id, title, type, video_url, thumbnail, creator_id, created_at
      FROM works
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log(`找到 ${rows.length} 个作品:\n`);
    
    rows.forEach((work, index) => {
      console.log(`${index + 1}. ${work.title}`);
      console.log(`   ID: ${work.id}`);
      console.log(`   Type: ${work.type || 'NULL'}`);
      console.log(`   Video URL: ${work.video_url || 'NULL'}`);
      console.log(`   Thumbnail: ${work.thumbnail ? work.thumbnail.substring(0, 50) + '...' : 'NULL'}`);
      console.log('');
    });
    
    // 2. 按类型统计
    const { rows: typeStats } = await client.query(`
      SELECT type, COUNT(*) as count
      FROM works
      GROUP BY type
    `);
    
    console.log('\n按类型统计:');
    typeStats.forEach(stat => {
      console.log(`  ${stat.type || 'NULL'}: ${stat.count}`);
    });
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllWorks();
